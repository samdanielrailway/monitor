"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightLeft, CalendarDays, CircleAlert, Crosshair, Link2, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout-shell";
import { PageHeader } from "@/components/page-header";
import { useNwisWorkspace } from "@/components/nwis-workspace-context";
import { formationIntervals, wellEvents, wells } from "@/lib/nwis-data";
import type { Well } from "@/lib/nwis-data";

const maxDepth = 1200;
const formationColors = ["#d3c6aa", "#d5b27f", "#cfa16d", "#9bbcb5", "#a8baaa", "#b8aec0", "#82aaa0", "#6f978c", "#d5b37c", "#858d98"];

export default function ComparePage() {
  const { selectedWell, currentDepth, setCurrentDepth, setSelectedEventId } = useNwisWorkspace();
  const candidateWells = wells.filter((well) => well.id !== selectedWell.id);
  const [requestedOffsetWellId, setRequestedOffsetWellId] = useState(() => candidateWells[0]?.id ?? wells[0].id);
  const [syncDepth, setSyncDepth] = useState(true);
  const [offsetDepth, setOffsetDepth] = useState(currentDepth);
  const offsetWell = candidateWells.find((well) => well.id === requestedOffsetWellId) ?? candidateWells[0] ?? wells[0];
  const offsetWellId = offsetWell.id;
  const offsetEvents = useMemo(
    () => wellEvents.filter((event) => event.wellId === selectedWell.id || event.wellId === offsetWell.id),
    [offsetWell.id, selectedWell.id],
  );

  const selectOffsetWell = (wellId: string) => {
    setRequestedOffsetWellId(wellId);
    const nextWell = wells.find((well) => well.id === wellId);
    if (nextWell && !syncDepth) setOffsetDepth(nextWell.currentDepth);
  };

  const toggleDepthSync = () => {
    if (syncDepth) setOffsetDepth(currentDepth);
    setSyncDepth((enabled) => !enabled);
  };

  const selectEvent = (eventId: string, eventDepth: number) => {
    setCurrentDepth(eventDepth);
    setOffsetDepth(eventDepth);
    setSelectedEventId(eventId);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px] space-y-4">
        <PageHeader title="Well comparison" subtitle="Compare recorded well context and depth-anchored events. No unmatched drilling parameters are synthesized." />

        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-300 bg-[#e9eeeb] px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <div><span className="mr-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-500">Active well</span><strong className="text-slate-900">{selectedWell.id}</strong><span className="ml-2 text-slate-500">{selectedWell.location}</span></div>
            <div className="inline-flex items-center gap-1.5 text-slate-700"><Crosshair className="h-3.5 w-3.5 text-sky-800" />{Math.round(currentDepth)} m MD</div>
          </div>
          <label className="flex items-center gap-2 text-[10px] text-slate-600">
            <span className="font-semibold uppercase tracking-[0.1em]">Offset well</span>
            <select value={offsetWellId} onChange={(event) => selectOffsetWell(event.target.value)} className="h-8 rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/15">
              {candidateWells.map((well) => <option key={well.id} value={well.id}>{well.id} · {well.location}</option>)}
            </select>
          </label>
        </div>

        <section className="overflow-hidden rounded-lg border border-slate-300 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700"><ArrowRightLeft className="h-4 w-4 text-sky-800" /> Synchronized measured-depth workspace</div>
            <button type="button" aria-pressed={syncDepth} onClick={toggleDepthSync} className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${syncDepth ? "border-sky-200 bg-sky-50 text-sky-900" : "border-slate-200 bg-white text-slate-500"}`}><Link2 className="h-3 w-3" />Depth sync {syncDepth ? "on" : "off"}</button>
          </div>

          <div className="grid divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            <WellDepthTrack well={selectedWell} depth={currentDepth} roleLabel="Active well" events={offsetEvents.filter((event) => event.wellId === selectedWell.id)} />
            <WellDepthTrack well={offsetWell} depth={syncDepth ? currentDepth : offsetDepth} roleLabel="Offset well" events={offsetEvents.filter((event) => event.wellId === offsetWell.id)} />
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-[260px] flex-1 items-center gap-3">
                <label htmlFor="compare-depth" className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">Shared depth cursor</label>
                <input id="compare-depth" aria-label="Comparison measured depth" type="range" min="0" max={maxDepth} value={syncDepth ? currentDepth : offsetDepth} onChange={(event) => syncDepth ? setCurrentDepth(Number(event.target.value)) : setOffsetDepth(Number(event.target.value))} className="min-w-0 flex-1 accent-sky-800" />
                <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-800">{(syncDepth ? currentDepth : offsetDepth).toLocaleString()} m MD</span>
              </div>
              <span className="text-[9px] text-slate-500">{syncDepth ? "Cursor follows the selected well's global depth." : "Offset cursor is independent; active well keeps the global cursor."}</span>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-300 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-800">Depth-anchored event records</h2>
              <p className="mt-1 text-[9px] text-slate-500">Click a record to inspect its source evidence and move the shared cursor.</p>
            </div>
            <span className="rounded bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-800">{offsetEvents.length} source records</span>
          </div>
          <div className="divide-y divide-slate-100">
            {offsetEvents.length ? offsetEvents.map((event) => (
              <button key={event.id} type="button" onClick={() => selectEvent(event.id, event.depth)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500">
                <span className="inline-flex min-w-[108px] items-center gap-2 text-[11px] font-semibold text-slate-800"><CircleAlert className="h-3.5 w-3.5 text-amber-700" />{event.type}</span>
                <span className="text-[10px] font-semibold text-slate-700">{event.wellId} · {event.depth} m MD</span>
                <span className="text-[10px] text-slate-600">{event.formation}</span>
                <span className="inline-flex items-center gap-1 text-[9px] text-slate-500"><CalendarDays className="h-3 w-3" />{event.date}</span>
                <span className="ml-auto text-[9px] text-slate-500">{event.source} · {event.sourcePage}</span>
              </button>
            )) : <div className="px-4 py-5 text-[10px] text-slate-500">No event records exist for this well pair in the current fixture set.</div>}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] text-slate-500">
          <span>Only source-backed well-level facts and recorded events are shown. Detailed per-depth drilling/mud parameters are not available for both wells.</span>
          <Link href="/dashboard" className="inline-flex items-center gap-1 font-semibold text-sky-800 hover:text-sky-950"><MapPin className="h-3 w-3" />Return to command center</Link>
        </div>
      </div>
    </AppShell>
  );
}

function WellDepthTrack({ well, depth, roleLabel, events }: { well: Well; depth: number; roleLabel: string; events: typeof wellEvents }) {
  const hasFormationPicks = well.id === "WX-07";

  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="text-[8px] font-semibold uppercase tracking-[0.15em] text-slate-400">{roleLabel}</div>
          <div className="mt-1 text-base font-semibold text-slate-900">{well.id} <span className="text-[10px] font-normal text-slate-500">· {well.location}</span></div>
          <div className="mt-1 text-[9px] text-slate-500">{well.profile} · {well.rig} · {well.status}</div>
        </div>
        <div className="text-right">
          <div className="text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-400">{hasFormationPicks ? "Reference depth pick" : "Well record formation"}</div>
          <div className="mt-1 max-w-[160px] text-xs font-semibold text-slate-800">{hasFormationPicks ? formationIntervals.find((interval) => depth >= interval.top && depth < interval.bottom)?.name ?? "Outside reference picks" : well.formation}</div>
          <div className="mt-1 text-[9px] font-semibold tabular-nums text-sky-800">{depth.toLocaleString()} m MD</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[54px_minmax(0,1fr)] gap-2">
        <div className="relative h-[340px] border-r border-slate-200 text-[8px] tabular-nums text-slate-400">
          {[0, 200, 400, 600, 800, 1000, 1200].map((tick) => <span key={tick} className="absolute left-0 -translate-y-1/2" style={{ top: `${(tick / maxDepth) * 100}%` }}>{tick} m</span>)}
        </div>
        <div className="relative h-[340px] overflow-hidden border border-slate-200 bg-slate-50">
          {hasFormationPicks ? formationIntervals.map((interval, index) => (
            <div key={interval.name} className="absolute inset-x-0 flex items-center justify-between border-b border-slate-900/10 px-2" style={{ top: `${(interval.top / maxDepth) * 100}%`, height: `${(interval.thickness / maxDepth) * 100}%`, backgroundColor: formationColors[index % formationColors.length] }}>
              <span className="truncate text-[8px] font-semibold text-slate-800">{interval.name}</span>
              <span className="hidden text-[8px] text-slate-600 sm:inline">{interval.source}</span>
            </div>
          )) : (
            <div className="absolute inset-x-0 top-0 flex h-full items-center justify-center border-y border-dashed border-slate-400 bg-[repeating-linear-gradient(135deg,#f8fafc_0_10px,#eef2f1_10px_20px)] px-4 text-center">
              <span className="max-w-[190px] text-[9px] leading-4 text-slate-500">No validated depth-specific formation tops in this well fixture. Well-level record: <strong className="text-slate-700">{well.formation}</strong></span>
            </div>
          )}

          {events.map((event, index) => (
            <span key={event.id} title={`${event.type} · ${event.depth} m MD · ${event.source}`} className={`absolute z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ${event.severity === "Critical" ? "bg-red-600 ring-red-800/40" : "bg-amber-600 ring-amber-800/35"}`} style={{ left: `${32 + (index % 3) * 16}%`, top: `${(event.depth / maxDepth) * 100}%` }} />
          ))}

          <div className="absolute inset-x-0 z-30 border-t-2 border-dashed border-sky-900" style={{ top: `${Math.min((depth / maxDepth) * 100, 100)}%` }}><span className="absolute right-1 top-0 -translate-y-1/2 rounded bg-sky-950 px-1.5 py-0.5 text-[8px] font-semibold text-white">{well.id} · {Math.round(depth)} m</span></div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-[9px] text-slate-500">
        <span>Planned TD <strong className="text-slate-700">{well.projectedTD.toLocaleString()} m</strong></span>
        <span>Actual TD fixture <strong className="text-slate-700">{well.actualDepth.toLocaleString()} m</strong></span>
        <span>Target <strong className="text-slate-700">{well.targetFormation}</strong></span>
      </div>
    </div>
  );
}
