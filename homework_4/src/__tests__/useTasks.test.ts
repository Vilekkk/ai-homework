import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTasks } from '@/hooks/useTasks';
import { demoTasks } from '@/demoData';
import type { Task, Priority } from '@/types';

describe('useTasks', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // Тест 1: успешное создание задачи
  it('should add a task with valid title', () => {
    const { result } = renderHook(() => useTasks());
    const initialCount = result.current.tasks.length;

    act(() => {
      result.current.addTask('Новая задача', 'Описание', 'high');
    });

    expect(result.current.tasks.length).toBe(initialCount + 1);
    expect(result.current.tasks[0].title).toBe('Новая задача');
    expect(result.current.tasks[0].description).toBe('Описание');
    expect(result.current.tasks[0].priority).toBe('high');
    expect(result.current.tasks[0].completed).toBe(false);
  });

  // Тест 2: отклонение пустого названия
  it('should reject empty title', () => {
    const { result } = renderHook(() => useTasks());
    const initialCount = result.current.tasks.length;

    act(() => {
      result.current.addTask('   ', '');
    });

    expect(result.current.tasks.length).toBe(initialCount);
  });

  // Тест 3: отклонение названия длиннее 200 символов
  it('should reject title longer than 200 characters', () => {
    const { result } = renderHook(() => useTasks());
    const initialCount = result.current.tasks.length;
    const longTitle = 'a'.repeat(201);

    act(() => {
      result.current.addTask(longTitle, '');
    });

    expect(result.current.tasks.length).toBe(initialCount);
  });

  // Тест 4: переключение статуса
  it('should toggle task status', () => {
    const { result } = renderHook(() => useTasks());
    const firstTask = result.current.tasks[0];

    act(() => {
      result.current.toggleTask(firstTask.id);
    });

    const toggled = result.current.tasks.find(t => t.id === firstTask.id);
    expect(toggled?.completed).toBe(true);

    act(() => {
      result.current.toggleTask(firstTask.id);
    });

    const toggledBack = result.current.tasks.find(t => t.id === firstTask.id);
    expect(toggledBack?.completed).toBe(false);
  });

  // Тест 5: удаление задачи
  it('should delete a task', () => {
    const { result } = renderHook(() => useTasks());
    const firstTask = result.current.tasks[0];
    const initialCount = result.current.tasks.length;

    act(() => {
      result.current.deleteTask(firstTask.id);
    });

    expect(result.current.tasks.find(t => t.id === firstTask.id)).toBeUndefined();
    expect(result.current.tasks.length).toBe(initialCount - 1);
  });

  // Тест 6: восстановление к демо-данным
  it('should reset tasks to demo data', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Временная задача', '', 'low');
    });

    expect(result.current.tasks.length).toBe(demoTasks.length + 1);

    act(() => {
      result.current.resetTasks();
    });

    expect(result.current.tasks.length).toBe(demoTasks.length);
  });
});

describe('useTasks - localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // Тест 7: восстановление задач из localStorage
  it('should restore tasks from localStorage on init', () => {
    const savedTasks: Task[] = [
      {
        id: 'saved-1',
        title: 'Сохранённая задача',
        description: 'Описание',
        priority: 'high' as Priority,
        completed: false,
        createdAt: Date.now(),
      },
    ];
    localStorage.setItem('my-tasks-app', JSON.stringify(savedTasks));

    const { result } = renderHook(() => useTasks());

    expect(result.current.tasks.length).toBe(1);
    expect(result.current.tasks[0].title).toBe('Сохранённая задача');
  });

  // Тест 8: сохранение в localStorage при изменении
  it('should save tasks to localStorage on change', () => {
    localStorage.clear();
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Новая задача', 'Описание', 'medium');
    });

    const saved = localStorage.getItem('my-tasks-app');
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved!) as Task[];
    expect(parsed.find((t) => t.title === 'Новая задача')).toBeTruthy();
  });

  // Тест 9: приоритет по умолчанию medium
  it('should default priority to medium', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Задача без приоритета', '');
    });

    expect(result.current.tasks[0].priority).toBe('medium');
  });
});

describe('useTasks - storage error regressions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('keeps an intentionally empty saved list after remount', () => {
    localStorage.setItem('my-tasks-app', '[]');
    const first = renderHook(() => useTasks());
    expect(first.result.current.tasks).toEqual([]);
    first.unmount();
    expect(renderHook(() => useTasks()).result.current.tasks).toEqual([]);
  });

  it.each(['not-json', '[{"id":"broken"}]', '{}'])('preserves invalid saved data: %s', (saved) => {
    localStorage.setItem('my-tasks-app', saved);
    const { result } = renderHook(() => useTasks());
    expect(result.current.storageWarning).toBeTruthy();
    act(() => result.current.addTask('Временная задача', ''));
    expect(result.current.tasks).toHaveLength(1);
    expect(localStorage.getItem('my-tasks-app')).toBe(saved);
  });

  it('reports a storage write error while keeping the task in memory', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    const { result } = renderHook(() => useTasks());
    act(() => result.current.addTask('Останется в памяти', ''));
    expect(result.current.tasks[0].title).toBe('Останется в памяти');
    expect(result.current.storageWarning).toContain('до закрытия страницы');
  });

  it('writes the current list only after explicit permission to replace invalid storage', () => {
    localStorage.setItem('my-tasks-app', 'broken');
    const { result } = renderHook(() => useTasks());
    act(() => result.current.addTask('Новый список', ''));
    act(() => result.current.allowStorageOverwrite());
    expect(JSON.parse(localStorage.getItem('my-tasks-app')!)[0].title).toBe('Новый список');
    expect(result.current.storageWarning).toBe('');
  });
});
