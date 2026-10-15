import { useCallback, useMemo, useState } from "react";
import { Plus, ClipboardList, LogOut } from "lucide-react";
import { AuthProvider } from "@/lib/supabase/AuthProvider";
import { useAuth } from "@/lib/supabase/useAuth";
import type { Priority } from "@/types";
import AddTaskModal from "@/components/AddTaskModal";
import { useTasks } from "@/hooks/useTasks";
import TaskStats from "@/components/TaskStats";
import TaskFilters from "@/components/TaskFilters";
import TaskList from "@/components/TaskList";
import AuthForm from "@/components/AuthForm";
import LoadingSpinner from "@/components/LoadingSpinner";

type StatusFilter = "all" | "active" | "completed";
type PriorityFilter = Priority | "all";

/**
 * Inner component that has access to the auth context.
 */
function TaskApp() {
  const {
    userId,
    signOut,
    isLoading: authLoading,
    error: authError,
  } = useAuth();
  const {
    tasks,
    errorMessage,
    isLoading: tasksLoading,
    isSubmitting,
    addTask,
    toggleTask,
    removeTask,
  } = useTasks(userId);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const closeModal = useCallback(() => setModalOpen(false), []);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      active: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
    }),
    [tasks]
  );

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => {
        if (statusFilter === "active" && t.completed) return false;
        if (statusFilter === "completed" && !t.completed) return false;
        return true;
      })
      .filter((t) => priorityFilter === "all" || t.priority === priorityFilter)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return b.createdAt - a.createdAt || a.id.localeCompare(b.id);
      });
  }, [tasks, statusFilter, priorityFilter]);

  const hasActiveFilters = statusFilter !== "all" || priorityFilter !== "all";

  const resetFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  const handleAdd = useCallback(
    async (title: string, description: string, priority: Priority) => {
      try {
        await addTask(title, description, priority);
        setNotice(
          hasActiveFilters
            ? "Задача добавлена. Если она не видна, сбросьте фильтры."
            : "Задача добавлена"
        );
      } catch {
        throw new Error(
          "Не удалось добавить задачу. Проверьте сообщение об ошибке."
        );
      }
    },
    [addTask, hasActiveFilters]
  );

  const handleToggle = useCallback(
    async (id: string, currentCompleted: boolean) => {
      try {
        await toggleTask(id, currentCompleted);
        setNotice(
          currentCompleted ? "Задача возвращена в активные" : "Задача выполнена"
        );
      } catch {
        // Error already shown in errorMessage
      }
    },
    [toggleTask]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (task && window.confirm(`Удалить задачу «${task.title}»?`)) {
        removeTask(id)
          .then(() => setNotice("Задача удалена"))
          .catch(() => {
            // Error already shown
          });
      }
    },
    [tasks, removeTask]
  );

  // Not authenticated: show auth form
  if (!userId && !authLoading) {
    return <AuthForm />;
  }

  // Loading: show spinner
  if (authLoading || !userId) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-steel-50 flex flex-col">
      <header className="bg-navy-800 flex-shrink-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-navy-600 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  Мои задачи
                </h1>
                <p className="text-xs text-navy-200 leading-tight">
                  Корпоративный учёт задач
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-navy-600 hover:bg-navy-500 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Добавить задачу"
                title="Добавить задачу"
                disabled={isSubmitting}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Добавить задачу</span>
                <span className="sm:hidden">Добавить</span>
              </button>
              <button
                onClick={() => {
                  void signOut().catch(() => {});
                }}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-navy-200 hover:text-white hover:bg-navy-700 rounded-lg transition-colors"
                aria-label="Выйти"
                title="Выйти"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-5 flex-1">
        {(errorMessage || authError) && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {errorMessage || authError}
          </div>
        )}
        {notice && (
          <p role="status" className="mb-4 text-sm text-navy-700">
            {notice}
          </p>
        )}
        <TaskStats
          total={stats.total}
          active={stats.active}
          completed={stats.completed}
        />

        <TaskFilters
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {tasksLoading ? (
          <LoadingSpinner />
        ) : errorMessage && tasks.length === 0 ? null : (
          <TaskList
            tasks={filtered}
            onToggle={(id) => {
              const task = tasks.find((t) => t.id === id);
              if (task) {
                handleToggle(id, task.completed);
              }
            }}
            onDelete={handleDelete}
            onResetFilters={hasActiveFilters ? resetFilters : undefined}
          />
        )}
      </div>

      <AddTaskModal
        open={modalOpen}
        onClose={closeModal}
        onAdd={handleAdd}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

/**
 * Root component that wraps TaskApp with AuthProvider.
 * AuthProvider restores the session on mount.
 */
export default function App() {
  return (
    <AuthProvider>
      <TaskApp />
    </AuthProvider>
  );
}
