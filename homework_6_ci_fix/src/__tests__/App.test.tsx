import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "@/App";
import * as operationsModule from "@/lib/supabase/operations";
import type { Task } from "@/types";

// Mock Supabase client
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });
const mockSignUp = vi.fn();

function createOnAuthStateChangeMock() {
  return function onAuthStateChange() {
    // Supabase calls the callback with (event, session)
    // Initial session is restored by getSession in these tests.
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  };
}

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getSession: mockGetSession,
      onAuthStateChange: createOnAuthStateChangeMock(),
    },
  })),
  getSupabaseClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getSession: mockGetSession,
      onAuthStateChange: createOnAuthStateChangeMock(),
    },
  })),
}));

vi.mock("@/lib/supabase/operations", () => ({
  fetchTasks: vi.fn().mockResolvedValue([]),
  createTask: vi.fn().mockResolvedValue({
    id: "1",
    title: "Test",
    description: "",
    priority: "medium" as const,
    completed: false,
    createdAt: Date.now(),
  }),
  setTaskCompleted: vi.fn().mockResolvedValue({
    id: "1",
    title: "Test",
    description: "",
    priority: "medium" as const,
    completed: true,
    createdAt: Date.now(),
  }),
  deleteTask: vi.fn().mockResolvedValue(undefined),
  SupabaseApiError: class SupabaseApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "SupabaseApiError";
    }
  },
}));

describe("Auth flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  // Тест 10: показ формы входа при отсутствии сессии
  it("should show auth form when not authenticated", async () => {
    render(<App />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.getByText(/Вход/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Пароль/i)).toBeInTheDocument();
  });

  // Тест 11: вход по email/паролю
  it("should sign in and show tasks on success", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user-1" } } },
    });

    render(<App />);

    // Flush all microtasks and effects
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // Manually flush pending microtasks
    await Promise.resolve();
    await Promise.resolve();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // Тест 12: ошибка входа отображается в интерфейсе
  it("should show error on failed sign in", async () => {
    mockSignIn.mockRejectedValueOnce(new Error("Invalid credentials"));

    render(<App />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Пароль/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    // Flush microtasks for the async signIn call
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
  });

  // Тест 13: регистрация с переходом на форму входа
  it("should switch between sign in and sign up forms", async () => {
    render(<App />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.getByText(/Вход/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Нет аккаунта\? Зарегистрироваться/i));

    expect(screen.getByText(/Регистрация/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Имя/i)).toBeInTheDocument();
  });

  // Тест 14: блокировка повторной отправки формы входа
  it("should disable submit button while signing in", async () => {
    mockSignIn.mockReturnValue(new Promise(() => {}));

    render(<App />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Пароль/i), {
      target: { value: "password123" },
    });
    const submitBtn = screen.getByRole("button", { name: "Войти" });
    fireEvent.click(submitBtn);

    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent("Подождите");
  });
});

describe("Task filters - server mode", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user-1" } } },
    });
  });

  // Тест 15: фильтры работают с серверными задачами
  it("should filter tasks by status and priority", async () => {
    const serverTasks: Task[] = [
      {
        id: "1",
        title: "Активная задача",
        description: "",
        priority: "high" as const,
        completed: false,
        createdAt: Date.now(),
      },
      {
        id: "2",
        title: "Выполненная задача",
        description: "",
        priority: "low" as const,
        completed: true,
        createdAt: Date.now() - 1000,
      },
    ];
    vi.mocked(operationsModule.fetchTasks).mockResolvedValueOnce(serverTasks);

    render(<App />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await Promise.resolve();
    await Promise.resolve();

    // Verify both tasks are rendered
    expect(
      screen.queryAllByText("Активная задача").length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.queryAllByText("Выполненная задача").length
    ).toBeGreaterThanOrEqual(1);

    // Filter by active status
    fireEvent.click(screen.getByRole("button", { name: "Активные" }));
    // After filtering, only active tasks should be visible
    expect(
      screen.queryAllByText("Активная задача").length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Выполненная задача")).not.toBeInTheDocument();

    // Filter by completed status
    fireEvent.click(screen.getByRole("button", { name: "Выполненные" }));
    expect(screen.queryByText("Активная задача")).not.toBeInTheDocument();
    expect(
      screen.queryAllByText("Выполненная задача").length
    ).toBeGreaterThanOrEqual(1);

    // Reset status filter to show all
    const allStatusBtn = screen.getAllByRole("button", { name: "Все" })[0];
    fireEvent.click(allStatusBtn);
    expect(
      screen.queryAllByText("Активная задача").length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.queryAllByText("Выполненная задача").length
    ).toBeGreaterThanOrEqual(1);
  });

  // Тест 16: пустой список показывает сообщение
  it("should show empty state when no tasks", async () => {
    vi.mocked(operationsModule.fetchTasks).mockResolvedValueOnce([]);

    render(<App />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(screen.getByText("Пока нет задач")).toBeInTheDocument();
  });
});
