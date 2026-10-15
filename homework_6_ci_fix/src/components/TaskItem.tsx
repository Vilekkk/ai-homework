import { CheckCircle2, Circle, Trash2, RotateCcw } from "lucide-react";
import type { Task, Priority } from "@/types";
import { PRIORITY_LABELS } from "@/types";

const PRIORITY_BADGE: Record<Priority, string> = {
  low: "bg-steel-100 text-steel-600",
  medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  high: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <>
      {/* Desktop table row */}
      <div className="hidden md:grid grid-cols-[120px_1fr_130px_90px] gap-4 px-4 py-3.5 items-center hover:bg-steel-50/50 transition-colors animate-rowIn">
        <div>
          <button
            onClick={() => onToggle(task.id)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
              task.completed
                ? "text-steel-500 bg-steel-100 hover:bg-steel-200"
                : "text-navy-600 bg-navy-50 hover:bg-navy-100"
            }`}
            aria-label={
              task.completed ? "Вернуть в активные" : "Отметить выполненной"
            }
            title={
              task.completed ? "Вернуть в активные" : "Отметить выполненной"
            }
          >
            {task.completed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Выполнен
              </>
            ) : (
              <>
                <Circle className="w-3.5 h-3.5" />
                Активен
              </>
            )}
          </button>
        </div>

        <div className="min-w-0">
          <p
            className={`text-sm font-medium truncate ${task.completed ? "text-steel-400 line-through" : "text-steel-800"}`}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-steel-400 truncate mt-0.5">
              {task.description}
            </p>
          )}
        </div>

        <div>
          <span
            className={`inline-block text-xs font-medium px-2.5 py-1 rounded-md ${PRIORITY_BADGE[task.priority]}`}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>

        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onToggle(task.id)}
            className="p-1.5 rounded-md text-steel-400 hover:text-navy-600 hover:bg-navy-50 transition-colors"
            aria-label={
              task.completed ? "Вернуть в активные" : "Отметить выполненной"
            }
            title={
              task.completed ? "Вернуть в активные" : "Отметить выполненной"
            }
          >
            {task.completed ? (
              <RotateCcw className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-md text-steel-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            aria-label="Удалить"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile card */}
      <div className="md:hidden px-4 py-3.5 border-b border-steel-100 last:border-b-0 animate-rowIn">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p
            className={`min-w-0 break-words text-sm font-medium leading-snug ${task.completed ? "text-steel-400 line-through" : "text-steel-800"}`}
          >
            {task.title}
          </p>
          <span
            className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-md ${PRIORITY_BADGE[task.priority]}`}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>
        {task.description && (
          <p
            className={`break-words text-xs leading-relaxed mb-2.5 ${task.completed ? "text-steel-300" : "text-steel-500"}`}
          >
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(task.id)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
              task.completed
                ? "text-steel-500 bg-steel-100 hover:bg-steel-200"
                : "text-navy-600 bg-navy-50 hover:bg-navy-100"
            }`}
            aria-label={
              task.completed ? "Вернуть в активные" : "Отметить выполненной"
            }
            title={
              task.completed ? "Вернуть в активные" : "Отметить выполненной"
            }
          >
            {task.completed ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />В активные
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Выполнить
              </>
            )}
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="ml-auto inline-flex items-center justify-center w-8 h-8 rounded-md text-steel-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            aria-label="Удалить"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
