import { useState, useEffect, useRef, useCallback } from "react";
import { X, ClipboardList } from "lucide-react";
import type { Priority } from "@/types";
import { PRIORITY_LABELS } from "@/types";

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    title: string,
    description: string,
    priority: Priority
  ) => Promise<void>;
  isSubmitting: boolean;
}

const PRIORITIES: Priority[] = ["low", "medium", "high"];

const PRIORITY_ACTIVE: Record<Priority, string> = {
  low: "border-steel-500 bg-steel-500 text-white",
  medium: "border-amber-500 bg-amber-500 text-white",
  high: "border-red-600 bg-red-600 text-white",
};

export default function AddTaskModal({
  open,
  onClose,
  onAdd,
  isSubmitting,
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setError("");
  }, []);

  useEffect(() => {
    if (open) {
      resetForm();
      const t = setTimeout(() => titleRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open, resetForm]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const elements = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button, input, textarea"
      );
      if (!elements?.length) return;
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = title.trim();
      if (!trimmed) {
        setError("Введите название задачи — это поле обязательно");
        titleRef.current?.focus();
        return;
      }
      if (trimmed.length > 200) {
        setError("Название должно содержать не более 200 символов");
        titleRef.current?.focus();
        return;
      }
      if (description.trim().length > 2000) {
        setError("Описание должно содержать не более 2000 символов");
        return;
      }
      // Block re-submission while operation is in progress
      if (isSubmitting) return;

      try {
        await onAdd(trimmed, description.trim(), priority);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось добавить задачу");
      }
    },
    [title, description, priority, isSubmitting, onAdd, onClose]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-navy-950/50"
        onClick={isSubmitting ? undefined : onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-title"
        className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-modalIn"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-navy-800 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <h2
              id="new-task-title"
              className="text-base font-semibold text-white"
            >
              Новая задача
            </h2>
          </div>
          <button
            onClick={isSubmitting ? undefined : onClose}
            className="text-navy-200 hover:text-white transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-6 py-5 space-y-5 overflow-y-auto"
        >
          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-steel-700 mb-1.5"
            >
              Название <span className="text-red-600">*</span>
            </label>
            <input
              ref={titleRef}
              id="task-title"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "task-form-error" : undefined}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              placeholder="Что нужно сделать?"
              disabled={isSubmitting}
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white outline-none transition-all ${
                error
                  ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                  : "border-steel-200 focus:border-navy-500 focus:ring-1 focus:ring-navy-100"
              }`}
            />
            {error && (
              <p
                id="task-form-error"
                role="alert"
                className="mt-1.5 text-xs text-red-600 font-medium"
              >
                {error}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="block text-sm font-medium text-steel-700 mb-1.5"
            >
              Описание
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Дополнительные детали (необязательно)"
              rows={3}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-steel-200 bg-white outline-none transition-all focus:border-navy-500 focus:ring-1 focus:ring-navy-100 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-steel-700 mb-1.5">
              Приоритет
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  disabled={isSubmitting}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                    priority === p
                      ? PRIORITY_ACTIVE[p]
                      : "border-steel-200 text-steel-500 hover:border-steel-300 bg-white"
                  }`}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-steel-200 text-steel-600 hover:bg-steel-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-white bg-navy-700 hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Добавляю…" : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
