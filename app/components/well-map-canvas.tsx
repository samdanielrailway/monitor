"use client";

import L from "leaflet";
import { useEffect, useState } from "react";
import { Circle, LayersControl, MapContainer, Marker, Polygon, Popup, ScaleControl, TileLayer, Tooltip, useMap } from "react-leaflet";
import { wellEvents } from "@/lib/nwis-data";
import type { Well } from "@/lib/nwis-data";

const statusColors: Record<string, string> = {
  Active: "#34d399",
  Monitor: "#fbbf24",
  "Drilling Complete": "#7dd3fc",
  Completed: "#cbd5e1",
  Standby: "#f87171",
};

const makeDerrickIcon = (well: Well, active: boolean) => {
  const statusColor = statusColors[well.status] ?? "#cbd5e1";
  const blockBottom = active ? 30 : 26;

  return L.divIcon({
    className: "nwis-map-icon",
    html: `<span class="nwis-derrick ${active ? "nwis-derrick--active" : "nwis-derrick--offset"}">
      <span class="nwis-derrick__shadow"></span>
      <span class="nwis-derrick__pulse"></span>
      <span class="nwis-derrick__mast"></span>
      <span class="nwis-derrick__crown"></span>
      <span class="nwis-derrick__block" style="bottom:${blockBottom}px"></span>
      <span class="nwis-derrick__block" style="bottom:${blockBottom - 11}px"></span>
      <span class="nwis-derrick__base"></span>
      <span class="nwis-derrick__status" style="background:${statusColor}"></span>
      <span class="nwis-derrick__label">${well.id}</span>
    </span>`,
    iconSize: [34, 52],
    iconAnchor: [17, 48],
    popupAnchor: [0, -46],
  });
};

type BaseLayerId = "dark" | "light" | "terrain";

const baseLayers: Record<BaseLayerId, { name: string; url: string; attribution: string; maxZoom: number; subdomains?: string }> = {
  dark: {
    name: "Dark ops",
    url: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  light: {
    name: "Light reference",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  terrain: {
    name: "Terrain relief",
    url: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
};

const fallbackLayer = baseLayers.light;

function SafeBaseLayer({ layerId }: { layerId: BaseLayerId }) {
  const [useFallback, setUseFallback] = useState(false);
  const layer = useFallback ? fallbackLayer : baseLayers[layerId];

  return (
    <TileLayer
      key={useFallback ? "fallback" : layerId}
      attribution={layer.attribution}
      url={layer.url}
      maxZoom={layer.maxZoom}
      eventHandlers={{ tileerror: () => setUseFallback(true) }}
    />
  );
}

function distanceKm(from: Well, to: Well) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = radians(to.coordinates.lat - from.coordinates.lat);
  const deltaLng = radians(to.coordinates.lng - from.coordinates.lng);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(from.coordinates.lat)) * Math.cos(radians(to.coordinates.lat)) * Math.sin(deltaLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingPolygon(center: [number, number], radiusKm: number) {
  const points: [number, number][] = [];
  for (let step = 0; step <= 24; step += 1) {
    const bearing = (step / 24) * 360;
    const radians = (bearing * Math.PI) / 180;
    const latOffset = (radiusKm / 110.574) * Math.cos(radians);
    const lngOffset = (radiusKm / (111.32 * Math.cos((center[0] * Math.PI) / 180))) * Math.sin(radians);
    points.push([center[0] + latOffset, center[1] + lngOffset]);
  }
  return points;
}

function MapFocus({ well, focusKey }: { well: Well; focusKey?: number }) {
  const map = useMap();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      map.flyTo([well.coordinates.lat, well.coordinates.lng], map.getZoom(), { duration: 0.55 });
    });

    return () => cancelAnimationFrame(frame);
  }, [focusKey, map, well.coordinates.lat, well.coordinates.lng]);

  return null;
}

function ViewportReadout({ wells }: { wells: Well[] }) {
  const map = useMap();
  const [readout, setReadout] = useState({ center: map.getCenter(), zoom: map.getZoom() });

  useEffect(() => {
    const update = () => setReadout({ center: map.getCenter(), zoom: map.getZoom() });
    map.on("moveend zoomend", update);
    return () => {
      map.off("moveend zoomend", update);
    };
  }, [map]);

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-md border border-white/10 bg-[#0b1418]/85 px-2.5 py-1.5 font-mono text-[9px] leading-4 text-slate-300 backdrop-blur">
      <div>
        {readout.center.lat.toFixed(4)}° N · {readout.center.lng.toFixed(4)}° E
      </div>
      <div className="text-slate-400">
        Z{readout.zoom} · {wells.length} locators · fixture coords
      </div>
    </div>
  );
}

export function WellMapCanvas({
  wells,
  activeWell,
  radiusKm,
  onWellSelect,
  focusKey,
}: {
  wells: Well[];
  activeWell: Well;
  radiusKm: number;
  onWellSelect?: (well: Well) => void;
  focusKey?: number;
}) {
  return (
    <MapContainer
      center={[activeWell.coordinates.lat, activeWell.coordinates.lng]}
      zoom={11}
      scrollWheelZoom
      zoomControl
      className="nwis-map-container nwis-map-wells h-full w-full"
      style={{ height: "100%", width: "100%" }}
    >
      <MapFocus well={activeWell} focusKey={focusKey} />
      <LayersControl position="topright" collapsed={false}>
        <LayersControl.BaseLayer checked name="Light reference (keyless)">
          <SafeBaseLayer layerId="light" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Dark ops (CARTO)">
          <SafeBaseLayer layerId="dark" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Terrain relief (CARTO)">
          <SafeBaseLayer layerId="terrain" />
        </LayersControl.BaseLayer>
        <LayersControl.Overlay checked name="Context radius">
          <Polygon
            positions={bearingPolygon([activeWell.coordinates.lat, activeWell.coordinates.lng], radiusKm)}
            pathOptions={{ color: "#38bdf8", fillColor: "#38bdf8", fillOpacity: 0.06, weight: 1.4, dashArray: "8 8" }}
          />
        </LayersControl.Overlay>
        <LayersControl.Overlay checked name="Offset links">
          {wells.filter((well) => well.id !== activeWell.id).length >= 2 ? (
            <Polygon
              positions={[
                [activeWell.coordinates.lat, activeWell.coordinates.lng],
                ...wells
                  .filter((well) => well.id !== activeWell.id)
                  .map((well) => [well.coordinates.lat, well.coordinates.lng] as [number, number]),
              ]}
              pathOptions={{ color: "#f59e0b", weight: 1, opacity: 0.55, dashArray: "3 6" }}
            />
          ) : (
            <span className="hidden" />
          )}
        </LayersControl.Overlay>
      </LayersControl>

      <Circle
        center={[activeWell.coordinates.lat, activeWell.coordinates.lng]}
        radius={radiusKm * 1000}
        pathOptions={{ color: "#0ea5e9", fillColor: "#38bdf8", fillOpacity: 0.12, weight: 1.5, dashArray: "7 7" }}
      />

      {wells.map((well) => {
        const isActive = well.id === activeWell.id;
        const eventCount = wellEvents.filter((event) => event.wellId === well.id).length;

        return (
          <Marker
            key={well.id}
            position={[well.coordinates.lat, well.coordinates.lng]}
            icon={makeDerrickIcon(well, isActive)}
            zIndexOffset={isActive ? 1000 : 0}
            eventHandlers={{ click: () => onWellSelect?.(well) }}
          >
            <Tooltip direction="top" offset={[0, -30]}>
              <div className="min-w-[168px]">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-900">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColors[well.status] ?? "#cbd5e1" }} />
                  {well.id} · {well.location}
                </div>
                <div className="mt-1 text-[10px] text-slate-600">{isActive ? "Selected well" : `${distanceKm(activeWell, well).toFixed(1)} km from ${activeWell.id}`}</div>
                <div className="mt-1 text-[10px] text-slate-600">{well.profile} · {well.status} · {well.rig}</div>
                <div className="mt-1 text-[10px] text-slate-600">Target: {well.targetFormation}</div>
                <div className="mt-1 text-[10px] text-slate-600">{well.actualDepth.toLocaleString()} m MD · {eventCount} recorded event{eventCount === 1 ? "" : "s"}</div>
              </div>
            </Tooltip>
            <Popup>
              <div className="min-w-48">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                  {isActive ? "Selected well" : "Offset well"}
                </div>
                <div className="mt-1 text-base font-semibold text-slate-900">{well.id} · {well.location}</div>
                <div className="mt-2 text-xs text-slate-600">{well.formation}</div>
                <div className="mt-2 flex justify-between gap-4 border-t border-slate-200 pt-2 text-xs text-slate-600">
                  <span>{well.status}</span>
                  <span>{well.currentDepth.toLocaleString()} m MD</span>
                </div>
                <dl className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
                  <div className="flex justify-between gap-4"><dt>Coordinates</dt><dd className="font-mono">{well.coordinates.lat.toFixed(3)}, {well.coordinates.lng.toFixed(3)}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Target TD</dt><dd className="tabular-nums">{well.targetDepth.toLocaleString()} m</dd></div>
                  <div className="flex justify-between gap-4"><dt>Nearby wells</dt><dd className="tabular-nums">{well.nearbyWells}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Last activity</dt><dd>{well.lastActivity}</dd></div>
                </dl>
                <p className="mt-2 text-[10px] leading-4 text-slate-500">Fixture coordinates — confirm against authoritative GIS before operational use.</p>
              </div>
            </Popup>
          </Marker>
        );
      })}

      <ScaleControl position="bottomright" metric imperial={false} />
      <ViewportReadout wells={wells} />
    </MapContainer>
  );
}
