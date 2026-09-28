import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout-shell";
import { PageHeader } from "@/components/page-header";
import { alerts } from "@/lib/nwis-data";

export default function AlertsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Historical Context Alerts" subtitle="Decision-support alerts based on nearby well evidence, depth correlation, and formation context." />

        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> {alert.title}</div>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">{alert.wellId} • {alert.formation} • {alert.depth} m</h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-700">{alert.context}</p>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-white/60 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Evidence</div>
                <div className="mt-1">{alert.evidence}</div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {alert.reasons.map((reason) => (
                  <span key={reason} className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs text-amber-800">{reason}</span>
                ))}
              </div>

              <div className="mt-5 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Recommended review:</span> {alert.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
