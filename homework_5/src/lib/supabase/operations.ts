import type { Task, Priority } from '@/types';
import { getSupabaseClient } from './client';
import type { TasksInsert, TasksUpdate } from './database.types';
import { dbTasksToTasks } from './adapter';

/**
 * Thrown when a Supabase API call fails.
 * Carries the original error message so callers can
 * surface a user-friendly explanation to the UI.
 */
export class SupabaseApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseApiError';
  }
}

/**
 * Fetches all tasks for the currently authenticated user.
 *
 * - On success (even with zero rows) returns the array.
 * - On configuration, network, or API error throws SupabaseApiError.
 *
 * @throws SupabaseApiError on any failure.
 */
export async function fetchTasks(): Promise<Task[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    const msg = `fetchTasks: ${error.message}`;
    console.error(msg);
    throw new SupabaseApiError(msg);
  }

  if (!data || !Array.isArray(data)) {
    throw new SupabaseApiError('fetchTasks: unexpected response format');
  }

  return dbTasksToTasks(data);
}

/**
 * Creates a new task for the authenticated user.
 * owner_id is set to the current user's ID from the Supabase session.
 *
 * @param title - Task title (validated on the frontend and in DB).
 * @param description - Task description (optional, trimmed on frontend).
 * @param priority - Task priority: 'low' | 'medium' | 'high'.
 * @returns The created Task.
 * @throws SupabaseApiError when the user is not authenticated or the insert fails.
 */
export async function createTask(
  title: string,
  description: string,
  priority: Priority
): Promise<Task> {
  const supabase = getSupabaseClient();

  // Retrieve the current user's ID to set as owner_id.
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  if (!userId) {
    throw new SupabaseApiError('createTask: no authenticated user');
  }

  const insertPayload: TasksInsert = {
    owner_id: userId,
    title,
    description,
    priority,
    completed: false,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    const msg = `createTask: ${error.message}`;
    console.error(msg);
    throw new SupabaseApiError(msg);
  }

  if (!data) {
    throw new SupabaseApiError('createTask: no data returned after insert');
  }

  return dbTasksToTasks([data])[0];
}

/**
 * Sets the completed status of a task to a specific value.
 * Unlike the previous toggle pattern (SELECT → UPDATE), this operation
 * sends the desired new value directly, avoiding a race condition
 * where two concurrent changes could cancel each other out.
 *
 * @param id - Task UUID.
 * @param completed - The target completed value.
 * @returns The updated Task.
 * @throws SupabaseApiError when the task is not found or the update fails.
 */
export async function setTaskCompleted(
  id: string,
  completed: boolean
): Promise<Task> {
  const supabase = getSupabaseClient();

  const updatePayload: TasksUpdate = { completed };

  const { data, error } = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    const msg = `setTaskCompleted: ${error.message}`;
    console.error(msg);
    throw new SupabaseApiError(msg);
  }

  if (!data) {
    throw new SupabaseApiError(
      `setTaskCompleted: task not found (id=${id})`
    );
  }

  return dbTasksToTasks([data])[0];
}

/**
 * Deletes a task by ID.
 * Only the task owner can delete their task (enforced by RLS).
 *
 * @param id - Task UUID.
 * @throws SupabaseApiError when the delete fails.
 */
export async function deleteTask(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    const msg = `deleteTask: ${error.message}`;
    console.error(msg);
    throw new SupabaseApiError(msg);
  }

  if (!data) {
    throw new SupabaseApiError('deleteTask: no row deleted');
  }
}
