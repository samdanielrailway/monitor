"use client";

import { useMemo } from "react";
import { ArrowUpRight, Crosshair, LocateFixed } from "lucide-react";
import Link from "next/link";
import { useNwisWorkspace } from "@/components/nwis-workspace-context";
import { formationAtReferenceDepth, offsetEventsForFormation } from "@/lib/nwis-data";
import type { EventRecord } from "@/lib/nwis-data";

const maxDepth = 1200;

export function DepthEventStrip() {
  const { selectedWell, currentDepth, setCurrentDepth, setSelectedEventId } = useNwisWorkspace();
  const currentInterval = selectedWell.id === "WX-07" ? formationAtReferenceDepth(currentDepth) : undefined;
  const relevantEvents = useMemo(() => offsetEventsForFormation(selectedWell.id, selectedWell.formation), [selectedWell]);

  const selectEvent = (event: EventRecord) => {
    setCurrentDepth(event.depth);
    setSelectedEventId(event.id);
  };

  return (
    <section className="rounded-lg border border-slate-300 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded bg-[#f4eee3] text-[#8a6a36]"><Crosshair className="h-3.5 w-3.5" /></div>
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-800">Depth & historical events</h2>
            <p className="text-[10px] text-slate-500">Move the cursor to inspect depth context and historical offset records</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
          <span className="inline-flex items-center gap-1.5 text-slate-600"><span className="h-2 w-2 rounded-full bg-sky-700" />Current depth cursor</span>
          <span className="inline-flex items-center gap-1.5 text-slate-600"><span className="h-2 w-2 rounded-full bg-amber-600" />Historical event</span>
          <span className="text-slate-400">Depth picks available for WX-07 fixture only</span>
        </div>
      </div>

      <div className="px-4 pb-3 pt-4">
        <div className="relative mx-1 h-[46px]">
          <div className="absolute inset-x-0 top-[20px] h-px bg-slate-300" />
          {relevantEvents.map((event, index) => (
            <button
              key={event.id}
              type="button"
              aria-label={`Inspect ${event.type} at ${event.depth} meters in ${event.wellId}`}
              title={`${event.wellId} · ${event.type} · ${event.depth} m MD · ${event.formation}`}
              onClick={() => selectEvent(event)}
              className="group absolute top-[14px] z-10 grid h-3.5 w-3.5 -translate-x-1/2 place-items-center rounded-full border-2 border-white bg-amber-600 shadow ring-1 ring-amber-700/30 transition hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              style={{ left: `${(event.depth / maxDepth) * 100}%`, transform: `translateX(-50%) translateY(${index % 2 === 0 ? 0 : 5}px)` }}
            >
              <span className="sr-only">{event.type}</span>
            </button>
          ))}
          <div className="absolute top-0 z-20 h-[34px] w-px bg-sky-800" style={{ left: `${(currentDepth / maxDepth) * 100}%` }}>
            <div className="absolute -left-[5px] top-[16px] h-[11px] w-[11px] rounded-full border-2 border-white bg-sky-800 shadow ring-1 ring-sky-800/30" />
            <div className="absolute left-2 top-0 whitespace-nowrap rounded bg-sky-900 px-1.5 py-0.5 text-[9px] font-semibold text-white">{currentDepth} m</div>
          </div>
          {[0, 400, 800, maxDepth].map((depth) => (
            <span key={depth} className="absolute top-[30px] -translate-x-1/2 text-[9px] tabular-nums text-slate-400" style={{ left: `${(depth / maxDepth) * 100}%` }}>{depth.toLocaleString()} m</span>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex min-w-[240px] flex-1 items-center gap-3">
            <label htmlFor="global-depth-cursor" className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Depth cursor</label>
            <input
              id="global-depth-cursor"
              aria-label="Current measured depth in meters"
              type="range"
              min={0}
              max={maxDepth}
              step={1}
              value={currentDepth}
              onChange={(event) => setCurrentDepth(Number(event.target.value))}
              className="min-w-0 flex-1 accent-sky-800"
            />
            <span className="w-[58px] shrink-0 text-right text-xs font-semibold tabular-nums text-slate-800">{currentDepth.toLocaleString()} m MD</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-[#f4f6f5] px-3 py-2">
            <LocateFixed className="h-3.5 w-3.5 text-[#477463]" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">{currentInterval ? "WX-07 formation pick" : "Depth-specific pick"}</span>
            <span className="text-xs font-semibold text-slate-800">{currentInterval?.name ?? "Unavailable for selected well"}</span>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {relevantEvents.length ? relevantEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              aria-label={`Open source evidence for ${event.type} in ${event.wellId} at ${event.depth} meters`}
              onClick={() => selectEvent(event)}
              className="flex min-w-[190px] items-center justify-between gap-3 rounded-md border border-amber-200/80 bg-[#fffaf2] px-3 py-2 text-left transition hover:border-amber-400 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <span className="min-w-0">
                <span className="block truncate text-[10px] font-semibold text-slate-800">{event.type} <span className="font-normal text-slate-500">· {event.wellId}</span></span>
                <span className="mt-0.5 block truncate text-[9px] text-slate-500">{event.depth} m MD · {event.formation} · {event.source}</span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-amber-700" />
            </button>
          )) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-500">No fixture events are correlated to this well context.</div>
          )}
          <Link href="/map" className="ml-auto inline-flex shrink-0 items-center gap-1 self-center px-2 text-[10px] font-medium text-sky-800 hover:text-sky-950">Open well map <ArrowUpRight className="h-3 w-3" /></Link>
        </div>
      </div>
    </section>
  );
}
