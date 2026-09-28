"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CalendarDays, CircleAlert, Crosshair, Drill, MapPin, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout-shell";
import { CommandCenterMap } from "@/components/command-center-map";
import { DepthEventStrip } from "@/components/depth-event-strip";
import { useNwisWorkspace } from "@/components/nwis-workspace-context";
import { alerts, formationAtReferenceDepth, offsetEventsForFormation, wells } from "@/lib/nwis-data";

export default function DashboardPage() {
  const { selectedWell, currentDepth, setCurrentDepth, setSelectedEventId } = useNwisWorkspace();
  const offsetEvents = offsetEventsForFormation(selectedWell.id, selectedWell.formation);
  const depthFormationPick = selectedWell.id === "WX-07" ? formationAtReferenceDepth(currentDepth) : undefined;
  const primaryAlert = alerts.find((alert) => alert.wellId === selectedWell.id);
  const relevantOffsetWells = wells.filter((well) => well.id !== selectedWell.id && selectedWell.formation.toLowerCase().split(/[\/,&]+/).some((token) => token.trim() && well.formation.toLowerCase().includes(token.trim())));

  const inspectEvent = (depth: number) => {
    setCurrentDepth(depth);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1760px] space-y-3.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#507567]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Operations workspace <span className="text-slate-300">/</span> OIL INDIA LIMITED
            </div>
            <h1 className="mt-1 text-[23px] font-semibold tracking-[-0.03em] text-[#19272d] sm:text-[26px]">Command center</h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="rounded border border-slate-200 bg-white px-2.5 py-1.5 font-medium uppercase tracking-[0.1em]">Prototype · fixture records</span>
            <span className="hidden rounded border border-slate-200 bg-white px-2.5 py-1.5 sm:inline">No live drilling feed</span>
          </div>
        </div>

        <section aria-label="Current well context" className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-slate-300 bg-[#e9eeeb] px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">Current well</span>
            <span className="text-sm font-bold tracking-wide text-[#19342f]">{selectedWell.id}</span>
          </div>
          <span className="hidden h-5 w-px bg-slate-300 sm:block" />
          <div className="flex items-center gap-1.5 text-xs text-slate-700"><Crosshair className="h-3.5 w-3.5 text-[#507567]" /><span className="font-semibold tabular-nums">{currentDepth.toLocaleString()} m MD</span></div>
          <div title={depthFormationPick ? `WX-07 reference depth pick at ${currentDepth} m` : "Well-level formation record; depth-specific pick unavailable"} className="flex min-w-0 items-center gap-1.5 text-xs text-slate-700"><MapPin className="h-3.5 w-3.5 shrink-0 text-[#507567]" /><span className="truncate">{depthFormationPick?.name ?? selectedWell.formation}</span>{!depthFormationPick && <span className="shrink-0 text-[9px] text-slate-500">(well record)</span>}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{relevantOffsetWells.length} relevant offset fixture{relevantOffsetWells.length === 1 ? "" : "s"}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600"><CircleAlert className="h-3.5 w-3.5 text-amber-700" />{offsetEvents.length} historical event{offsetEvents.length === 1 ? "" : "s"}</div>
          <div className="ml-auto flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600"><ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />Secure environment</div>
        </section>

        <div className="grid h-auto items-stretch gap-3 lg:h-[460px] lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[190px_minmax(0,1fr)_280px] xl:h-[min(52vh,520px)] xl:min-h-[460px]">
          <aside aria-label="Current well profile" className="hidden h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-300 bg-white xl:flex">
            <div className="border-b border-slate-200 px-3.5 py-3">
              <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">Current well</div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-[#1b2b31]">{selectedWell.id}</h2>
                <span className={`rounded-sm px-1.5 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] ${selectedWell.status === "Active" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{selectedWell.status}</span>
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500">{selectedWell.location} · {selectedWell.profile}</div>
            </div>

            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto px-3.5">
              <div className="py-3">
                <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-500"><Crosshair className="h-3 w-3" /> Current context</div>
                <div className="mt-2 text-[25px] font-semibold tabular-nums tracking-tight text-slate-900">{currentDepth.toLocaleString()} <span className="text-xs font-medium text-slate-500">m MD</span></div>
                <div className="mt-1 text-[10px] leading-4 text-slate-600">{depthFormationPick ? "Reference depth pick:" : "Well record formation:"} <span className="font-medium text-slate-800">{depthFormationPick?.name ?? selectedWell.formation}</span></div>
                {!depthFormationPick && <div className="mt-1 text-[9px] leading-4 text-slate-500">Depth-specific formation pick is not available for this well fixture.</div>}
              </div>

              <dl className="space-y-2.5 py-3 text-[10px]">
                <div className="flex items-start justify-between gap-2"><dt className="text-slate-500">Rig</dt><dd className="text-right font-medium text-slate-800">{selectedWell.rig}</dd></div>
                <div className="flex items-start justify-between gap-2"><dt className="text-slate-500">Well profile</dt><dd className="text-right font-medium text-slate-800">{selectedWell.wellType}</dd></div>
                <div className="flex items-start justify-between gap-2"><dt className="text-slate-500">Target formation</dt><dd className="max-w-[125px] text-right font-medium leading-4 text-slate-800">{selectedWell.targetFormation}</dd></div>
                <div className="flex items-start justify-between gap-2"><dt className="text-slate-500">Planned / projected TD</dt><dd className="text-right font-semibold tabular-nums text-slate-800">{selectedWell.projectedTD.toLocaleString()} m</dd></div>
                <div className="flex items-start justify-between gap-2"><dt className="text-slate-500">Actual depth fixture</dt><dd className="text-right font-semibold tabular-nums text-slate-800">{selectedWell.actualDepth.toLocaleString()} m</dd></div>
                <div className="flex items-start justify-between gap-2"><dt className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Spud date</dt><dd className="text-right font-medium text-slate-800">{selectedWell.spudDate}</dd></div>
              </dl>

              <div className="py-3">
                <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-500"><Drill className="h-3 w-3" /> Offset context</div>
                <div className="mt-2 text-[11px] font-semibold text-slate-800">{relevantOffsetWells.length} formation-related offset{relevantOffsetWells.length === 1 ? "" : "s"}</div>
                <div className="mt-1 text-[9px] leading-4 text-slate-500">Fixture-level formation match; review original records before interpretation.</div>
              </div>
            </div>

            <Link href={`/wells/${selectedWell.id}`} className="flex items-center justify-between border-t border-slate-200 px-3.5 py-3 text-[10px] font-semibold text-sky-800 hover:bg-slate-50">
              Open well workspace <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </aside>

          <div className="h-[460px] min-w-0 lg:h-full">
            <CommandCenterMap />
          </div>

          <aside aria-label="Historical context intelligence" className="flex h-[460px] flex-col overflow-hidden rounded-lg border border-slate-300 bg-white lg:h-full">
            <div className="flex items-center justify-between border-b border-slate-200 px-3.5 py-3">
              <div>
                <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-amber-800"><CircleAlert className="h-3 w-3" /> Historical context</div>
                <div className="mt-1 text-[11px] text-slate-600">{primaryAlert?.formation ?? selectedWell.formation} · source-linked records</div>
              </div>
              <span className="rounded bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-800">{offsetEvents.length} records</span>
            </div>

            {primaryAlert && (
              <div className="mx-3 mt-3 border-l-2 border-amber-500 bg-[#fffaf2] px-3 py-2.5">
                <div className="text-[10px] font-semibold text-slate-800">{primaryAlert.title}</div>
                <p className="mt-1 text-[10px] leading-4 text-slate-600">{primaryAlert.context}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {primaryAlert.reasons.slice(0, 3).map((reason) => <span key={reason} className="rounded bg-white px-1.5 py-1 text-[8px] text-slate-600 ring-1 ring-inset ring-slate-200">{reason}</span>)}
                </div>
              </div>
            )}

            <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto px-3">
              {offsetEvents.slice(0, 4).map((event) => (
                <button
                  key={event.id}
                  type="button"
                    aria-label={`Open source evidence for ${event.type} in ${event.wellId} at ${event.depth} meters`}
                    onClick={() => {
                      inspectEvent(event.depth);
                      setSelectedEventId(event.id);
                    }}
                  className="group flex w-full gap-2.5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500"
                >
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded bg-amber-50 text-amber-800"><Drill className="h-3.5 w-3.5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-semibold text-slate-800 group-hover:text-amber-900">{event.type} <span className="font-normal text-slate-500">· {event.wellId}</span></span>
                      <span className="shrink-0 text-[10px] font-semibold tabular-nums text-slate-700">{event.depth} m</span>
                    </span>
                    <span className="mt-1 block truncate text-[9px] text-slate-500">{event.formation} <span className="mx-1 text-slate-300">·</span> {event.source} / {event.sourcePage}</span>
                    <span className="mt-1.5 flex items-center gap-1 text-[9px] text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${event.confidence === "HIGH" ? "bg-emerald-600" : "bg-amber-500"}`} />{event.confidence} confidence <span className="mx-0.5 text-slate-300">·</span>{event.date}</span>
                  </span>
                </button>
              ))}
              {!offsetEvents.length && <div className="py-5 text-[10px] leading-4 text-slate-500">No source-linked offset events match the selected well’s recorded formation context in the available fixture set.</div>}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-3.5 py-3">
              <span className="text-[9px] text-slate-500">Evidence retained in source fixture</span>
              <Link href="/compare" className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 hover:text-slate-950">Compare <ArrowDownRight className="h-3 w-3" /></Link>
            </div>
          </aside>
        </div>

        <DepthEventStrip />

        <div className="flex flex-wrap items-center justify-between gap-2 pb-1 text-[9px] text-slate-400">
          <span>Historical records are decision-support references, not drilling instructions.</span>
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3 w-3" />Fixture source dates retained</span>
        </div>
      </div>
    </AppShell>
  );
}
