import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTasks } from "@/hooks/useTasks";
import * as operations from "@/lib/supabase/operations";
import type { Task } from "@/types";

// Mock the operations module
vi.mock("@/lib/supabase/operations", () => ({
  fetchTasks: vi.fn(),
  createTask: vi.fn(),
  setTaskCompleted: vi.fn(),
  deleteTask: vi.fn(),
  SupabaseApiError: class SupabaseApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "SupabaseApiError";
    }
  },
}));

const mockFetchTasks = vi.mocked(operations.fetchTasks);
const mockCreateTask = vi.mocked(operations.createTask);
const mockSetTaskCompleted = vi.mocked(operations.setTaskCompleted);
const mockDeleteTask = vi.mocked(operations.deleteTask);

describe("useTasks - server mode", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  // Тест 1: успешная загрузка задач
  it("should load tasks from API on init", async () => {
    const serverTasks: Task[] = [
      {
        id: "1",
        title: "Задача 1",
        description: "Описание",
        priority: "high",
        completed: false,
        createdAt: Date.now(),
      },
    ];
    mockFetchTasks.mockResolvedValueOnce(serverTasks);

    const { result } = renderHook(() => useTasks("user-1"));

    await act(async () => {
      vi.runAllTimers();
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe("Задача 1");
  });

  // Тест 2: отклонение пустого названия при создании
  it("should not add a task with empty title", async () => {
    mockFetchTasks.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useTasks("user-1"));
    await act(async () => {
      vi.runAllTimers();
    });

    await act(async () => {
      await result.current.addTask("   ", "");
    });

    // Validation happens in the hook, API is never called
    expect(mockCreateTask).not.toHaveBeenCalled();
    expect(result.current.tasks).toHaveLength(0);
    expect(result.current.errorMessage).toContain("название");
  });

  // Тест 3: успешное создание задачи
  it("should add a task via API", async () => {
    mockFetchTasks.mockResolvedValueOnce([]);
    const newTask: Task = {
      id: "new-1",
      title: "Новая задача",
      description: "Описание",
      priority: "high",
      completed: false,
      createdAt: Date.now(),
    };
    mockCreateTask.mockResolvedValueOnce(newTask);

    const { result } = renderHook(() => useTasks("user-1"));
    await act(async () => {
      vi.runAllTimers();
    });

    await act(async () => {
      await result.current.addTask("Новая задача", "Описание", "high");
    });

    expect(mockCreateTask).toHaveBeenCalledWith(
      "Новая задача",
      "Описание",
      "high"
    );
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe("Новая задача");
  });

  // Тест 4: переключение статуса
  it("should toggle task status via API", async () => {
    const serverTasks: Task[] = [
      {
        id: "1",
        title: "Задача",
        description: "",
        priority: "medium",
        completed: false,
        createdAt: Date.now(),
      },
    ];
    mockFetchTasks.mockResolvedValueOnce(serverTasks);
    const updatedTask: Task = {
      ...serverTasks[0],
      completed: true,
    };
    mockSetTaskCompleted.mockResolvedValueOnce(updatedTask);

    const { result } = renderHook(() => useTasks("user-1"));
    await act(async () => {
      vi.runAllTimers();
    });

    await act(async () => {
      await result.current.toggleTask("1", false);
    });

    expect(mockSetTaskCompleted).toHaveBeenCalledWith("1", true);
    expect(result.current.tasks[0].completed).toBe(true);
  });

  // Тест 5: удаление задачи
  it("should delete a task via API", async () => {
    const serverTasks: Task[] = [
      {
        id: "1",
        title: "Задача",
        description: "",
        priority: "medium",
        completed: false,
        createdAt: Date.now(),
      },
    ];
    mockFetchTasks.mockResolvedValueOnce(serverTasks);
    mockDeleteTask.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useTasks("user-1"));
    await act(async () => {
      vi.runAllTimers();
    });

    await act(async () => {
      await result.current.removeTask("1");
    });

    expect(mockDeleteTask).toHaveBeenCalledWith("1");
    expect(result.current.tasks).toHaveLength(0);
  });

  // Тест 6: обработка ошибки API при загрузке
  it("should show error message when fetch fails", async () => {
    mockFetchTasks.mockRejectedValueOnce(
      new operations.SupabaseApiError("Network error")
    );

    const { result } = renderHook(() => useTasks("user-1"));
    await act(async () => {
      vi.runAllTimers();
    });

    expect(result.current.errorMessage).toContain("Network error");
  });

  // Тест 7: обработка ошибки API при создании
  it("should show error message when create fails", async () => {
    mockFetchTasks.mockResolvedValueOnce([]);
    mockCreateTask.mockRejectedValueOnce(
      new operations.SupabaseApiError("Validation failed")
    );

    const { result } = renderHook(() => useTasks("user-1"));
    await act(async () => {
      vi.runAllTimers();
    });

    await act(async () => {
      await result.current.addTask("Задача", "", "low").catch(() => {});
    });

    expect(result.current.errorMessage).toContain("Validation failed");
  });

  // Тест 8: блокировка повторной отправки
  it("should set isSubmitting during operations", async () => {
    mockFetchTasks.mockResolvedValueOnce([]);
    // Make createTask return a promise that doesn't resolve immediately
    mockCreateTask.mockImplementation(
      () =>
        new Promise<Task>((resolve) =>
          setTimeout(
            () =>
              resolve({
                id: "new-1",
                title: "Задача",
                description: "",
                priority: "low" as const,
                completed: false,
                createdAt: Date.now(),
              }),
            0
          )
        )
    );

    const { result } = renderHook(() => useTasks("user-1"));
    await act(async () => {
      vi.runAllTimers();
    });

    expect(result.current.isSubmitting).toBe(false);

    // Start the async operation
    let promise!: Promise<void>;
    act(() => {
      promise = result.current.addTask("Задача", "", "low");
    });
    // Flush microtasks to trigger setState for setIsSubmitting(true)
    await act(async () => {
      await Promise.resolve();
    });
    // isSubmitting should be true immediately
    expect(result.current.isSubmitting).toBe(true);

    // Resolve the pending promise
    await act(async () => {
      vi.runAllTimers();
      await promise;
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  // Тест 9: приоритет по умолчанию medium
  it("should default priority to medium", async () => {
    mockFetchTasks.mockResolvedValueOnce([]);
    const newTask: Task = {
      id: "1",
      title: "Задача",
      description: "",
      priority: "medium",
      completed: false,
      createdAt: Date.now(),
    };
    mockCreateTask.mockResolvedValueOnce(newTask);

    const { result } = renderHook(() => useTasks("user-1"));
    await act(async () => {
      vi.runAllTimers();
    });

    await act(async () => {
      await result.current.addTask("Задача", "");
    });

    expect(mockCreateTask).toHaveBeenCalledWith("Задача", "", "medium");
  });
});

describe("Task session isolation regressions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });
  it("does not request tasks for an anonymous user", async () => {
    const { result } = renderHook(() => useTasks(null));
    await act(async () => {});
    expect(mockFetchTasks).not.toHaveBeenCalled();
    expect(result.current.tasks).toEqual([]);
  });
  it("discards a delayed response from a previous user", async () => {
    let resolveOld!: (tasks: Task[]) => void;
    mockFetchTasks.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolveOld = r;
        })
    );
    mockFetchTasks.mockResolvedValueOnce([]);
    const { result, rerender } = renderHook(({ user }) => useTasks(user), {
      initialProps: { user: "user-a" },
    });
    rerender({ user: "user-b" });
    await act(async () => {
      resolveOld([
        {
          id: "old",
          title: "Private A",
          description: "",
          priority: "low",
          completed: false,
          createdAt: 0,
        },
      ]);
    });
    expect(mockFetchTasks).toHaveBeenCalledTimes(2);
    expect(result.current.tasks).toEqual([]);
  });
});
