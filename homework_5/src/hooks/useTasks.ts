import { useCallback, useEffect, useRef, useState } from 'react';
import type { Task, Priority } from '@/types';
import {
  fetchTasks,
  createTask,
  setTaskCompleted,
  deleteTask,
  SupabaseApiError,
} from '@/lib/supabase/operations';

/**
 * Hook that manages tasks via the Supabase API.
 *
 * - On mount: fetches tasks for the current user.
 * - On error: sets errorMessage, keeps existing tasks.
 * - On sign out / session change: clears tasks and error.
 * - All mutations throw SupabaseApiError on failure.
 */
export function useTasks(userId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generation = useRef(0);
  const activeSession = useRef<string | null>(userId);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const version = ++generation.current;
    activeSession.current = userId;
    setTasks([]);
    setErrorMessage('');
    setIsSubmitting(false);
    setIsLoading(Boolean(userId));
    if (userId) {
      void fetchTasks().then((data) => {
        if (generation.current === version) setTasks(data);
      }).catch((e: unknown) => {
        if (generation.current === version) {
          setErrorMessage(e instanceof Error ? e.message : 'Не удалось загрузить задачи');
        }
      }).finally(() => {
        if (generation.current === version) setIsLoading(false);
      });
    }
    return () => { ++generation.current; activeSession.current = null; };
  }, [userId]);

  const withSession = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    if (!activeSession.current) throw new SupabaseApiError('Необходимо войти в аккаунт');
    const version = generation.current;
    const result = await fn();
    if (generation.current !== version) throw new SupabaseApiError('Сессия изменилась');
    return result;
  }, []);

  const addTask = useCallback(
    async (title: string, description: string, priority: Priority = 'medium') => {
      const trimmedTitle = title.trim();
      // Validate on the hook level so API is never called with invalid data
      if (!trimmedTitle || trimmedTitle.length > 200) {
        setErrorMessage(
          trimmedTitle.length > 200
            ? 'Название должно содержать не более 200 символов'
            : 'Введите название задачи'
        );
        return;
      }
      const version = generation.current;
      setIsSubmitting(true);
      setErrorMessage('');
      try {
        const newTask = await withSession(() =>
          createTask(trimmedTitle, description.trim(), priority)
        );
        setTasks((prev) => [newTask, ...prev]);
      } catch (e) {
        const msg =
          e instanceof SupabaseApiError
            ? e.message
            : 'Не удалось создать задачу';
        if (generation.current === version) setErrorMessage(msg);
        throw e;
      } finally {
        if (generation.current === version) setIsSubmitting(false);
      }
    },
    [withSession]
  );

  const toggleTask = useCallback(
    async (id: string, currentCompleted: boolean) => {
      const version = generation.current;
      setIsSubmitting(true);
      setErrorMessage('');
      try {
        const updated = await withSession(() =>
          setTaskCompleted(id, !currentCompleted)
        );
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? updated : t))
        );
      } catch (e) {
        const msg =
          e instanceof SupabaseApiError
            ? e.message
            : 'Не удалось изменить статус';
        if (generation.current === version) setErrorMessage(msg);
        throw e;
      } finally {
        if (generation.current === version) setIsSubmitting(false);
      }
    },
    [withSession]
  );

  const removeTask = useCallback(
    async (id: string) => {
      const version = generation.current;
      setIsSubmitting(true);
      setErrorMessage('');
      try {
        await withSession(() => deleteTask(id));
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } catch (e) {
        const msg =
          e instanceof SupabaseApiError
            ? e.message
            : 'Не удалось удалить задачу';
        if (generation.current === version) setErrorMessage(msg);
        throw e;
      } finally {
        if (generation.current === version) setIsSubmitting(false);
      }
    },
    [withSession]
  );

  return {
    tasks,
    isLoading,
    errorMessage,
    isSubmitting,
    addTask,
    toggleTask,
    removeTask,
  };
}
