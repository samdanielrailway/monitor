import { Sparkles, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout-shell";
import { PageHeader } from "@/components/page-header";
import { similarWells } from "@/lib/nwis-data";

export default function SimilarWellsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Similar Wells Engine" subtitle="Prototype similarity scoring using explainable formation, depth, and offset correlations." />

        <div className="grid gap-4">
          {similarWells.map((well) => (
            <div key={well.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Well {well.id}</div>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-900">Prototype similarity score {well.score}%</h3>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-emerald-700">
                  <Sparkles className="mr-1 inline h-3.5 w-3.5" /> Explainable
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3 text-sm text-slate-600">
                <div><span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Formation</span>{well.formation}</div>
                <div><span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Target depth</span>{well.targetDepth} m</div>
                <div><span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Distance</span>{well.distanceKm} km</div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500"><TrendingUp className="h-3.5 w-3.5" /> Why it matches</div>
                <div className="flex flex-wrap gap-2">
                  {well.reasons.map((reason) => (
                    <span key={reason} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">{reason}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
