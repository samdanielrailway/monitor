type MetricCardProps = {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "warning" | "positive" | "critical";
};

const tones = {
  default: "border-slate-200 bg-white text-slate-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-900",
  critical: "border-rose-200 bg-rose-50 text-rose-900",
};

export function MetricCard({ label, value, hint, tone = "default" }: MetricCardProps) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone]}`}>
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-2 text-xs text-slate-500">{hint}</div>
    </div>
  );
}
