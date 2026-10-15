import { useState, useEffect, useCallback } from 'react';
import type { Task, Priority } from '@/types';
import { demoTasks } from '@/demoData';

const STORAGE_KEY = 'my-tasks-app';

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false;
  const t = value as Record<string, unknown>;
  return typeof t.id === 'string' && typeof t.title === 'string' &&
    t.title.trim().length > 0 && t.title.trim().length <= 200 &&
    typeof t.description === 'string' && t.description.length <= 2000 &&
    ['low', 'medium', 'high'].includes(String(t.priority)) &&
    typeof t.completed === 'boolean' && typeof t.createdAt === 'number' &&
    Number.isFinite(t.createdAt);
}

function loadTasks(): { tasks: Task[]; warning: string; blocked: boolean } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return { tasks: demoTasks, warning: '', blocked: false };
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isTask) ||
      new Set(parsed.map(t => t.id)).size !== parsed.length) throw new Error('Invalid saved tasks');
    return { tasks: parsed, warning: '', blocked: false };
  } catch {
    // Не перезаписываем повреждённое сохранение автоматически.
    return { tasks: [], warning: 'Не удалось прочитать сохранённые задачи. Данные останутся только до закрытия страницы; исходное сохранение не изменено.', blocked: true };
  }
}

export function useTasks() {
  const [initial] = useState(loadTasks);
  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const [storageWarning, setStorageWarning] = useState(initial.warning);
  const [storageBlocked, setStorageBlocked] = useState(initial.blocked);

  useEffect(() => {
    if (storageBlocked) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      setStorageWarning('');
    } catch {
      setStorageWarning('Не удалось сохранить задачи. Данные останутся только до закрытия страницы.');
    }
  }, [tasks, storageBlocked]);

  const addTask = useCallback((title: string, description: string, priority: Priority = 'medium') => {
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    if (!trimmedTitle || trimmedTitle.length > 200 || trimmedDesc.length > 2000 ||
      !['low', 'medium', 'high'].includes(priority)) return;
    const newTask: Task = {
      id: crypto.randomUUID(), title: trimmedTitle, description: trimmedDesc,
      priority, completed: false, createdAt: Date.now(),
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, []);
  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);
  const resetTasks = useCallback(() => setTasks(demoTasks), []);
  const allowStorageOverwrite = useCallback(() => setStorageBlocked(false), []);

  return { tasks, addTask, toggleTask, deleteTask, resetTasks,
    storageWarning, storageBlocked, allowStorageOverwrite };
}
