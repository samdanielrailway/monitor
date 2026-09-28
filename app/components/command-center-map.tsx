"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Activity, Layers3, MapPinned, Pause, Play, RotateCcw, SkipBack } from "lucide-react";
import { useNwisWorkspace } from "@/components/nwis-workspace-context";
import { FormationDepthView } from "@/components/formation-depth-view";
import type { SubsurfaceLayers } from "@/components/subsurface-scene";
import { wells } from "@/lib/nwis-data";
import type { EventRecord } from "@/lib/nwis-data";

const WellMapCanvas = dynamic(
  () => import("@/components/well-map-canvas").then((module) => module.WellMapCanvas),
  { ssr: false, loading: () => <div className="grid h-full place-items-center bg-[#e7eceb] text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Loading field map</div> },
);
const SubsurfaceScene = dynamic(
  () => import("@/components/subsurface-scene").then((module) => module.SubsurfaceScene),
  { ssr: false, loading: () => <div className="grid h-full place-items-center bg-[#101e25] text-xs font-medium uppercase tracking-[0.15em] text-teal-100">Preparing 3D well view…</div> },
);

const viewModes = [
  { id: "map", label: "2D MAP", icon: MapPinned },
  { id: "subsurface", label: "3D SUBSURFACE", icon: Layers3 },
  { id: "depth", label: "DEPTH SECTION", icon: Activity },
] as const;

type ViewMode = (typeof viewModes)[number]["id"];

export function CommandCenterMap() {
  const { selectedWell, setSelectedWellId, currentDepth, setCurrentDepth, setSelectedEventId } = useNwisWorkspace();
  const [focusKey, setFocusKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("subsurface");
  const [isPlaying, setIsPlaying] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [verticalExaggeration, setVerticalExaggeration] = useState(1);
  const [visibleLayers, setVisibleLayers] = useState<SubsurfaceLayers>({ surface: true, formations: true, drillstring: true, events: true });

  const selectWell = (wellId: string) => {
    const well = wells.find((item) => item.id === wellId);
    if (well) {
      setSelectedWellId(well.id);
      setCurrentDepth(well.currentDepth);
    }
  };

  useEffect(() => {
    if (!isPlaying) return;
    const playback = window.setInterval(() => {
      setCurrentDepth((depth) => (depth >= selectedWell.actualDepth ? 0 : Math.min(depth + 10, selectedWell.actualDepth)));
    }, 140);
    return () => window.clearInterval(playback);
  }, [isPlaying, selectedWell.actualDepth, setCurrentDepth]);

  const currentMode = viewModes.find((mode) => mode.id === viewMode) ?? viewModes[1];

  return (
    <section aria-label="Nearby well and subsurface workspace" className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-[0_10px_35px_-28px_rgba(15,23,42,0.45)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 sm:px-3.5">
        <div className="flex min-w-[128px] items-center gap-2">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded bg-[#e8f0ed] text-[#38695a]">
            <currentMode.icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-800">{currentMode.label}</div>
            <div className="truncate text-[9px] text-slate-500">{selectedWell.id} · {selectedWell.location} · {Math.round(currentDepth)} m MD</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1">
          <div role="group" aria-label="Command center view" className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
            {viewModes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={viewMode === id}
                onClick={() => setViewMode(id)}
                className={`inline-flex h-7 items-center gap-1 rounded px-1.5 text-[8px] font-semibold tracking-[0.04em] transition-colors sm:px-2 sm:text-[9px] ${viewMode === id ? "bg-[#173944] text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
              ><Icon className="h-3 w-3" /><span className="hidden sm:inline">{label}</span><span className="sm:hidden">{id === "subsurface" ? "3D" : id === "depth" ? "DEPTH" : "2D"}</span></button>
            ))}
          </div>

          <button
            type="button"
            aria-label={isPlaying ? "Pause depth playback" : "Start depth playback"}
            aria-pressed={isPlaying}
            title={isPlaying ? "Pause demo depth playback" : "Play demo depth playback"}
            onClick={() => setIsPlaying((playing) => !playing)}
            className={`inline-flex h-8 items-center gap-1 rounded-md border px-2 text-[9px] font-semibold uppercase tracking-[0.06em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${isPlaying ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >{isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}<span className="hidden sm:inline">{isPlaying ? "Pause" : "Play depth"}</span></button>

          <button
            type="button"
            aria-label="Reset depth playback"
            title="Reset depth cursor to surface"
            onClick={() => {
              setIsPlaying(false);
              setCurrentDepth(0);
            }}
            className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          ><SkipBack className="h-3.5 w-3.5" /></button>

          <button
            type="button"
            aria-label={viewMode === "subsurface" ? "Reset 3D camera" : "Reset view to selected well"}
            title="Reset view"
            onClick={() => {
              if (viewMode === "subsurface") setSceneKey((key) => key + 1);
              else setFocusKey((key) => key + 1);
            }}
            className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          ><RotateCcw className="h-3.5 w-3.5" /></button>
        </div>

        {viewMode === "subsurface" && (
          <div className="flex w-full flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
            <div role="group" aria-label="3D subsurface layers" className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-400">Layers</span>
              {([
                ["surface", "Surface"],
                ["formations", "WX-07 formations"],
                ["drillstring", "Drillstring + annulus"],
                ["events", "Historical events"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={visibleLayers[key]}
                  onClick={() => setVisibleLayers((current) => ({ ...current, [key]: !current[key] }))}
                  className={`rounded border px-1.5 py-1 text-[8px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${visibleLayers[key] ? "border-teal-200 bg-teal-50 text-teal-900" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                >{label}</button>
              ))}
              <span className="ml-1 text-[8px] text-slate-400">Casing: source data unavailable</span>
            </div>

            <div role="group" aria-label="Vertical exaggeration" className="flex items-center gap-1">
              <span className="mr-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-400">Vertical scale</span>
              {[1, 2, 4].map((value) => (
                <button key={value} type="button" aria-pressed={verticalExaggeration === value} onClick={() => setVerticalExaggeration(value)} className={`rounded px-1.5 py-1 text-[8px] font-semibold ${verticalExaggeration === value ? "bg-[#173944] text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{value}×</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative h-[350px] flex-none bg-[#e7eceb] xl:h-auto xl:min-h-0 xl:flex-1">
        {viewMode === "map" && (
          <>
            <WellMapCanvas
              wells={wells}
              activeWell={selectedWell}
              radiusKm={10}
              focusKey={focusKey}
              onWellSelect={(well) => {
                selectWell(well.id);
                setFocusKey((key) => key + 1);
              }}
            />
            <div className="pointer-events-none absolute left-3 top-3 z-[500] max-w-[250px] rounded-md border border-white/80 bg-white/95 px-3 py-2 shadow-md backdrop-blur">
              <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">Selected well</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{selectedWell.id} <span className="font-normal text-slate-500">· {selectedWell.location}</span></div>
              <div className="mt-0.5 text-[10px] text-slate-600">{selectedWell.formation}</div>
            </div>
            <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap gap-2 rounded-md border border-white/80 bg-white/95 px-3 py-2 shadow-md backdrop-blur">
              <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-700"><span className="h-2.5 w-2.5 rounded-full bg-sky-600 shadow" />Selected well</span>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-700"><span className="h-2 w-2 rounded-full bg-slate-600" />Offset well</span>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-700"><span className="h-2 w-4 rounded-full border border-dashed border-sky-600 bg-sky-100/60" />10 km context radius</span>
            </div>
            <div className="pointer-events-none absolute bottom-3 right-3 z-[500] rounded bg-slate-900/80 px-2 py-1 text-[8px] uppercase tracking-[0.1em] text-white">2D map · 3D mast locators · CARTO/OSM reference tiles</div>
          </>
        )}

        {viewMode === "subsurface" && (
          <SubsurfaceScene
            key={sceneKey}
            well={selectedWell}
            depth={currentDepth}
            isPlaying={isPlaying}
            verticalExaggeration={verticalExaggeration}
            layers={visibleLayers}
            onEventSelect={(event: EventRecord) => {
              setCurrentDepth(event.depth);
              setSelectedEventId(event.id);
            }}
            onDepthChange={setCurrentDepth}
          />
        )}

        {viewMode === "depth" && <FormationDepthView />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2 text-[9px] leading-4 text-slate-500 sm:px-4">
        <span>{viewMode === "map" ? "Fixture coordinates are for prototype navigation; no authoritative OIL GIS or geological layers are connected." : "WX-07 formations are depth-bounded reference picks. Bands are schematic—not spatial surfaces or WX-11 depth picks."}</span>
        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-medium uppercase tracking-[0.08em] text-slate-600">Demo data · no live feed</span>
      </div>
    </section>
  );
}
