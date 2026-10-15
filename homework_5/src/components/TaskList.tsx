import { Search } from 'lucide-react';
import TaskItem from './TaskItem';
import type { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onResetFilters?: () => void;
}

export default function TaskList({ tasks, onToggle, onDelete, onResetFilters }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-14 px-4">
        <div className="w-14 h-14 rounded-xl bg-steel-100 flex items-center justify-center mb-3">
          <Search className="w-7 h-7 text-steel-300" />
        </div>
        <h3 className="text-sm font-semibold text-steel-700 mb-1">{onResetFilters ? 'Ничего не найдено' : 'Пока нет задач'}</h3>
        <p className="text-sm text-steel-400 mb-4 max-w-xs">
          {onResetFilters ? 'Нет задач, соответствующих выбранным фильтрам. Сбросьте фильтры, чтобы увидеть все задачи.' : 'Нажмите «Добавить», чтобы создать первую задачу.'}
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-navy-700 hover:bg-navy-800 rounded-lg transition-colors"
          >
            <RotateCcwIcon className="w-4 h-4" />
            Сбросить фильтры
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-steel-200 overflow-hidden">
      {/* Desktop table header */}
      <div className="hidden md:grid grid-cols-[120px_1fr_130px_90px] gap-4 px-4 py-3 bg-steel-50 border-b border-steel-200 text-xs font-semibold text-steel-500 uppercase tracking-wide">
        <div>Статус</div>
        <div>Название и описание</div>
        <div>Приоритет</div>
        <div className="text-right">Действия</div>
      </div>

      <div className="divide-y divide-steel-100">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function RotateCcwIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
