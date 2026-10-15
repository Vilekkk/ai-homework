import { ClipboardList, Circle, CheckCircle2 } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="min-w-0 bg-white rounded-xl border border-steel-200 px-3 py-3 sm:px-4 sm:py-3.5">
      <div className="flex items-start gap-1.5 text-steel-400 mb-1">
        {icon}
        <span className="min-w-0 break-words text-xs font-medium">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-navy-800">{value}</p>
    </div>
  );
}

interface TaskStatsProps {
  total: number;
  active: number;
  completed: number;
}

export default function TaskStats({
  total,
  active,
  completed,
}: TaskStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      <StatCard
        label="Всего задач"
        value={total}
        icon={<ClipboardList className="w-4 h-4 shrink-0" />}
      />
      <StatCard
        label="Активные"
        value={active}
        icon={<Circle className="w-4 h-4 shrink-0" />}
      />
      <StatCard
        label="Выполненные"
        value={completed}
        icon={<CheckCircle2 className="w-4 h-4 shrink-0" />}
      />
    </div>
  );
}
