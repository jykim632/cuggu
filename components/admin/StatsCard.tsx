import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
}

export function StatsCard({ label, value, icon: Icon }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-stone-400" />
        <span className="text-sm text-stone-500">{label}</span>
      </div>
      <div className="text-2xl font-semibold tabular-nums text-stone-900">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
