import { RotateCcw } from 'lucide-react';
import type { Priority } from '@/types';

type StatusFilter = 'all' | 'active' | 'completed';
type PriorityFilter = Priority | 'all';

interface FilterGroupProps<T extends string> {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterGroupProps<T>) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-steel-400 uppercase tracking-wide flex-shrink-0">
        {label}
      </span>
      <div className="flex gap-1 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all whitespace-nowrap ${
              value === opt.key
                ? 'bg-navy-700 text-white border-navy-700'
                : 'bg-white border-steel-200 text-steel-500 hover:border-steel-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const STATUSES: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'active', label: 'Активные' },
  { key: 'completed', label: 'Выполненные' },
];

const PRIORITIES: { key: PriorityFilter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'high', label: 'Высокий' },
  { key: 'medium', label: 'Средний' },
  { key: 'low', label: 'Низкий' },
];

interface TaskFiltersProps {
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  onStatusChange: (v: StatusFilter) => void;
  onPriorityChange: (v: PriorityFilter) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export default function TaskFilters({
  statusFilter,
  priorityFilter,
  onStatusChange,
  onPriorityChange,
  onReset,
  hasActiveFilters,
}: TaskFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-steel-200 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 border-b border-steel-100">
        <FilterGroup
          label="Статус"
          options={STATUSES}
          value={statusFilter}
          onChange={onStatusChange}
        />
        <div className="hidden sm:block w-px h-5 bg-steel-200" />
        <FilterGroup
          label="Приоритет"
          options={PRIORITIES}
          value={priorityFilter}
          onChange={onPriorityChange}
        />
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="sm:ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-steel-500 hover:text-navy-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Сбросить
          </button>
        )}
      </div>
    </div>
  );
}
