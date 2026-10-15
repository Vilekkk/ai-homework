import { useCallback, useMemo, useState } from 'react';
import { Plus, ClipboardList } from 'lucide-react';
import AddTaskModal from '@/components/AddTaskModal';
import { useTasks } from '@/hooks/useTasks';
import TaskStats from '@/components/TaskStats';
import TaskFilters from '@/components/TaskFilters';
import TaskList from '@/components/TaskList';
import type { Priority } from '@/types';

type StatusFilter = 'all' | 'active' | 'completed';
type PriorityFilter = Priority | 'all';

export default function App() {
  const { tasks, addTask, toggleTask, deleteTask, storageWarning, storageBlocked, allowStorageOverwrite } = useTasks();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState('');
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
        if (statusFilter === 'active' && t.completed) return false;
        if (statusFilter === 'completed' && !t.completed) return false;
        return true;
      })
      .filter((t) => priorityFilter === 'all' || t.priority === priorityFilter)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return b.createdAt - a.createdAt || a.id.localeCompare(b.id);
      });
  }, [tasks, statusFilter, priorityFilter]);

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all';

  const resetFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
  };

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
                <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Мои задачи</h1>
                <p className="text-xs text-navy-200 leading-tight">Корпоративный учёт задач</p>
              </div>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-navy-600 hover:bg-navy-500 rounded-lg transition-colors"
              aria-label="Добавить задачу"
              title="Добавить задачу"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Добавить задачу</span>
              <span className="sm:hidden">Добавить</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-5 flex-1">
        {storageWarning && <div role="alert" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          {storageWarning}
          {storageBlocked && <button className="ml-2 underline" onClick={() => {
            if (window.confirm('Заменить исходное сохранение текущим списком? Исходные данные будут перезаписаны.')) allowStorageOverwrite();
          }}>Сохранить текущий список</button>}
        </div>}
        {notice && <p role="status" className="mb-4 text-sm text-navy-700">{notice}</p>}
        <TaskStats total={stats.total} active={stats.active} completed={stats.completed} />

        <TaskFilters
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <TaskList
          tasks={filtered}
          onToggle={toggleTask}
          onDelete={(id) => {
            const task = tasks.find(t => t.id === id);
            if (task && window.confirm(`Удалить задачу «${task.title}»?`)) { deleteTask(id); setNotice('Задача удалена'); }
          }}
          onResetFilters={hasActiveFilters ? resetFilters : undefined}
        />
      </div>

      <AddTaskModal open={modalOpen} onClose={closeModal} onAdd={(title, description, priority) => {
        addTask(title, description, priority);
        setNotice(hasActiveFilters ? 'Задача добавлена. Если она не видна, сбросьте фильтры.' : 'Задача добавлена');
      }} />
    </div>
  );
}
