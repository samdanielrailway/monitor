import { Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/layout-shell";
import { PageHeader } from "@/components/page-header";
import { searchResults } from "@/lib/nwis-data";

export default function SearchPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Historical Knowledge Search" subtitle="Search structured well context and evidence-linked historical records." />

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-700"
                value="Mud loss in Upper Carbonate"
                readOnly
              />
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white">
              <SlidersHorizontal className="h-4 w-4" /> Search
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {searchResults.map((result) => (
            <div key={`${result.wellId}-${result.date}-${result.eventType}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{result.wellId}</div>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">{result.eventType}</h3>
                </div>
                <div className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.14em] text-sky-700">
                  Relevance {result.relevance}%
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4 text-sm text-slate-600">
                <div><span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Date</span>{result.date}</div>
                <div><span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Depth</span>{result.depth} m</div>
                <div><span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Formation</span>{result.formation}</div>
                <div><span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Source</span>{result.source}</div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">{result.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
