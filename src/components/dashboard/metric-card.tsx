import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
};

export function MetricCard({ label, value, icon, color }: Props) {
  return (
    <div className="rounded-lg border bg-card p-5 hover:shadow-sm transition-shadow">
      <p className="font-heading font-bold text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </p>
      <div className="flex items-end justify-between">
        <p className="font-mono text-2xl font-semibold tracking-tight" data-number>
          {value}
        </p>
        <div className={`${color} opacity-50`}>{icon}</div>
      </div>
    </div>
  );
}
