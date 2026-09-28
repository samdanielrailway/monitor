"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Activity, Crosshair, MapPinned, Search, SlidersHorizontal } from "lucide-react";
import { alerts, currentWell, wells, wellEvents } from "@/lib/nwis-data";
import type { Well } from "@/lib/nwis-data";

const statusColors: Record<string, string> = {
  Active: "#34d399",
  Monitor: "#fbbf24",
  "Drilling Complete": "#7dd3fc",
  Completed: "#cbd5e1",
  Standby: "#f87171",
};

const WellMapCanvas = dynamic(
  () => import("@/components/well-map-canvas").then((module) => module.WellMapCanvas),
  {
    ssr: false,
    loading: () => <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-500">Loading spatial layers…</div>,
  },
);

function distanceKm(from: Well, to: Well) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDistance = radians(to.coordinates.lat - from.coordinates.lat);
  const lngDistance = radians(to.coordinates.lng - from.coordinates.lng);
  const a =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(radians(from.coordinates.lat)) *
      Math.cos(radians(to.coordinates.lat)) *
      Math.sin(lngDistance / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function WellMapExplorer() {
  const [radiusKm, setRadiusKm] = useState(15);
  const [formation, setFormation] = useState("All formations");
  const [eventType, setEventType] = useState("All events");
  const [activeWellId, setActiveWellId] = useState(currentWell.id);
  const [focusKey, setFocusKey] = useState(0);

  const activeWell = useMemo(() => wells.find((well) => well.id === activeWellId) ?? currentWell, [activeWellId]);

  const visibleWells = useMemo(
    () =>
      wells.filter((well) => {
        const withinRadius = distanceKm(activeWell, well) <= radiusKm || well.id === activeWell.id;
        const matchesFormation =
          formation === "All formations" || well.formation.toLowerCase().includes(formation.toLowerCase());
        const matchesEvent =
          eventType === "All events" ||
          wellEvents.some(
            (event) =>
              event.wellId === well.id &&
              event.type.toLowerCase().includes(eventType.toLowerCase().replace(" event", "")),
          );

        return withinRadius && matchesFormation && matchesEvent;
      }),
    [activeWell, eventType, formation, radiusKm],
  );

  const selectWell = (well: Well) => {
    setActiveWellId(well.id);
    setFocusKey((key) => key + 1);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
      <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Spatial filters
        </div>

        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="well-radius" className="text-sm font-medium text-slate-700">Search radius</label>
              <span className="text-sm font-semibold text-sky-700">{radiusKm} km</span>
            </div>
            <input
              id="well-radius"
              type="range"
              min="1"
              max="30"
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
              className="w-full accent-sky-600"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-400"><span>1 km</span><span>30 km</span></div>
          </div>

          <div>
            <label htmlFor="formation-filter" className="mb-2 block text-sm font-medium text-slate-700">Formation</label>
            <select
              id="formation-filter"
              value={formation}
              onChange={(event) => setFormation(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              <option>All formations</option>
              <option>Upper Carbonate</option>
              <option>Jodhpur</option>
              <option>Bilara</option>
            </select>
          </div>

          <div>
            <label htmlFor="event-filter" className="mb-2 block text-sm font-medium text-slate-700">Event type</label>
            <select
              id="event-filter"
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              <option>All events</option>
              <option>Mud Loss</option>
              <option>Tight Pull</option>
              <option>Casing Event</option>
            </select>
          </div>

          <div className="rounded-2xl bg-sky-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-800">
              <Search className="h-3.5 w-3.5" /> Search context
            </div>
            <div className="mt-2 text-sm leading-5 text-sky-900">{alerts[0].context}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
              <Activity className="h-3.5 w-3.5" /> Visible records
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{visibleWells.length}</div>
            <div className="text-xs text-slate-500">well locations match current filters</div>
            <ul className="mt-3 space-y-1.5">
              {visibleWells.map((well) => (
                <li key={well.id}>
                  <button
                    type="button"
                    onClick={() => selectWell(well)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-left transition ${
                      well.id === activeWell.id
                        ? "border-sky-300 bg-sky-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: statusColors[well.status] ?? "#cbd5e1" }} />
                      <span className="truncate text-xs font-semibold text-slate-800">{well.id}</span>
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-slate-500">{well.actualDepth.toLocaleString()} m</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
            <MapPinned className="h-3.5 w-3.5" />
            Rajasthan · active well area
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-600" />Selected well</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-500" />Offset well</span>
            {Object.entries(statusColors)
              .filter(([status]) => wells.some((well) => well.status === status))
              .map(([status, color]) => (
                <span key={status} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  {status}
                </span>
              ))}
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">CARTO / OSM tiles</span>
          </div>
        </div>

        <div className="relative h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <WellMapCanvas wells={visibleWells} activeWell={activeWell} radiusKm={radiusKm} onWellSelect={selectWell} focusKey={focusKey} />
          <div className="pointer-events-none absolute left-3 top-3 z-[500] max-w-[230px] rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-md backdrop-blur-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Selected context</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{activeWell.id} · {activeWell.formation}</div>
            <div className="mt-0.5 text-xs text-slate-600">{visibleWells.length} locations · {radiusKm} km radius</div>
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 z-[500] hidden max-w-[240px] rounded-xl border border-white/10 bg-[#0b1418]/85 px-3 py-2 text-[10px] leading-4 text-slate-300 shadow-md backdrop-blur sm:block">
            <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-200">
              <Crosshair className="h-3 w-3" /> Locator legend
            </div>
            <div className="mt-1.5">3D mast height is indicative of well status, not depth.</div>
            <div className="mt-1">Dashed ring = {radiusKm} km context radius from {activeWell.id}.</div>
            <div className="mt-1 text-slate-400">Basemap layers available in the layer control (top right).</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4 text-[11px] leading-4 text-slate-500">
          <span>Well points are prototype fixture coordinates. Confirm against the authoritative GIS source before operational use.</span>
          <span className="shrink-0">Map tiles © OpenStreetMap contributors · © CARTO</span>
        </div>
      </section>
    </div>
  );
}
