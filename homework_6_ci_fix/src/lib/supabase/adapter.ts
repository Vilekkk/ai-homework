import type { Task } from "@/types";
import type { TasksRow } from "./database.types";

/**
 * Converts a database row into the frontend Task shape.
 * Transforms created_at from ISO string to Unix timestamp in milliseconds.
 */
export function dbTaskToTask(row: TasksRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    completed: row.completed,
    createdAt: parseDbTimestamp(row.created_at),
  };
}

/**
 * Converts an array of database rows to frontend tasks.
 */
export function dbTasksToTasks(rows: TasksRow[]): Task[] {
  return rows.map(dbTaskToTask);
}

/**
 * Parses a timestamptz ISO string into a Unix timestamp in milliseconds.
 * Returns 0 (epoch) for empty or invalid strings to avoid crashing.
 */
function parseDbTimestamp(created_at: string): number {
  if (!created_at || typeof created_at !== "string") {
    return 0;
  }
  const ms = Date.parse(created_at);
  return Number.isFinite(ms) ? ms : 0;
}
