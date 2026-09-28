"use client";

import { useMemo, useRef } from "react";
import type { Well } from "@/lib/nwis-data";
import type { LatLng, OffsetClearance } from "@/lib/well-planning";
import { distanceKm, projectPoint } from "@/lib/well-planning";

const VIEW_KM = 3.2;

export function PlanningMap({
  site,
  pathEnd,
  offsets,
  clearances,
  radiusM,
  onSiteChange,
  onPick,
  suggestions,
}: {
  site: LatLng;
  pathEnd: LatLng;
  offsets: Well[];
  clearances: OffsetClearance[];
  radiusM: number;
  onSiteChange: (site: LatLng) => void;
  onPick: (site: LatLng) => void;
  suggestions: LatLng[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const size = 460;

  const project = (point: LatLng) => {
    const east = (point.lng - site.lng) * 111.32 * Math.cos((site.lat * Math.PI) / 180);
    const north = (point.lat - site.lat) * 110.574;
    return { x: size / 2 + (east / VIEW_KM) * (size / 2), y: size / 2 - (north / VIEW_KM) * (size / 2) };
  };

  const clearanceColor = (clearance: OffsetClearance) => (clearance.marginM < 0 ? "#ef4444" : clearance.marginM < 100 ? "#f59e0b" : "#0ea5e9");

  const rings = useMemo(() => [0.5, 1, 1.5, 2, 2.5, 3], []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Plan view · site selection</h3>
        <span className="text-[10px] text-slate-400">{VIEW_KM.toFixed(1)} km span</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full touch-none rounded-xl border border-slate-200 bg-[#f7faf8]"
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const scale = size / bounds.width;
          const x = (event.clientX - bounds.left) * scale;
          const y = (event.clientY - bounds.top) * scale;
          const east = ((x - size / 2) / (size / 2)) * VIEW_KM;
          const north = -((y - size / 2) / (size / 2)) * VIEW_KM;
          const point = projectPoint(site, east, north);
          onPick(point);
        }}
      >
        <defs>
          <pattern id="plan-grid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M26 0 H0 V26" fill="none" stroke="#c9d6cf" strokeWidth="0.7" />
          </pattern>
          <radialGradient id="pad-glow">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={size} height={size} fill="url(#plan-grid)" />

        {rings.map((ringKm) => {
          const radius = (ringKm / VIEW_KM) * (size / 2);
          return (
            <g key={ringKm}>
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#b6c8bf" strokeWidth="0.8" strokeDasharray="3 4" />
              <text x={size / 2 + 3} y={size / 2 - radius - 2} fontSize="7" fill="#8aa096">
                {ringKm} km
              </text>
            </g>
          );
        })}

        {/* Suggested alternative sites */}
        {suggestions.map((suggestion, index) => {
          const position = project(suggestion);
          return (
            <g key={index} onClick={(event) => { event.stopPropagation(); onPick(suggestion); }} className="cursor-pointer">
              <circle cx={position.x} cy={position.y} r="5" fill="none" stroke="#16a34a" strokeWidth="1.2" strokeDasharray="2 2" />
              <text x={position.x} y={position.y - 7} fontSize="6.5" fill="#16a34a" textAnchor="middle">
                {index + 1}
              </text>
            </g>
          );
        })}

        {/* Offset wells */}
        {offsets.map((well) => {
          const position = project(well.coordinates);
          const clearance = clearances.find((item) => item.well.id === well.id);
          const color = clearance ? clearanceColor(clearance) : "#64748b";
          return (
            <g key={well.id}>
              <line x1={position.x} y1={position.y} x2={position.x} y2={position.y + 22} stroke={color} strokeWidth="1" />
              <rect x={position.x - 3} y={position.y - 3} width="6" height="6" fill={color} transform={`rotate(45 ${position.x} ${position.y})`} />
              <text x={position.x + 6} y={position.y + 3} fontSize="8" fontWeight="600" fill="#334155">
                {well.id}
              </text>
              {clearance && (
                <text x={position.x + 6} y={position.y + 12} fontSize="7" fill="#64748b">
                  {(clearance.horizontalAtTargetM / 1000).toFixed(2)} km
                </text>
              )}
            </g>
          );
        })}

        {/* Proposed target point and tie line */}
        {(() => {
          const end = project(pathEnd);
          return (
            <g>
              <line x1={size / 2} y1={size / 2} x2={end.x} y2={end.y} stroke="#16a34a" strokeWidth="1.4" strokeDasharray="4 3" />
              <circle cx={end.x} cy={end.y} r={(radiusM / 1000 / VIEW_KM) * (size / 2)} fill="url(#pad-glow)" />
              <circle cx={end.x} cy={end.y} r={(radiusM / 1000 / VIEW_KM) * (size / 2)} fill="none" stroke="#16a34a" strokeWidth="1.2" />
              <circle cx={end.x} cy={end.y} r="2.4" fill="#16a34a" />
            </g>
          );
        })()}

        {/* Proposed pad — draggable */}
        <g
          className="cursor-grab"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
            if (!bounds) return;
            const scale = size / bounds.width;
            const x = (event.clientX - bounds.left) * scale;
            const y = (event.clientY - bounds.top) * scale;
            const east = ((x - size / 2) / (size / 2)) * VIEW_KM;
            const north = -((y - size / 2) / (size / 2)) * VIEW_KM;
            onSiteChange(projectPoint(site, east, north));
          }}
        >
          <circle cx={size / 2} cy={size / 2} r="26" fill="url(#pad-glow)" />
          <rect x={size / 2 - 5} y={size / 2 - 5} width="10" height="10" fill="#16a34a" />
          <circle cx={size / 2} cy={size / 2} r="9" fill="none" stroke="#16a34a" strokeWidth="1.4" />
          <text x={size / 2} y={size / 2 + 20} fontSize="7.5" fontWeight="700" fill="#15803d" textAnchor="middle">
            PROPOSED
          </text>
        </g>

        {/* North arrow + scale bar */}
        <g transform={`translate(${size - 34}, 26)`}>
          <path d="M0 14 L5 0 L10 14 L5 11 Z" fill="#334155" />
          <text x="5" y="24" fontSize="8" fontWeight="700" fill="#334155" textAnchor="middle">
            N
          </text>
        </g>
        <g transform={`translate(16, ${size - 18})`}>
          <line x1="0" y1="0" x2={(1 / VIEW_KM) * (size / 2)} y2="0" stroke="#334155" strokeWidth="1.6" />
          <text x="0" y="-4" fontSize="7.5" fill="#334155">
            1 km
          </text>
        </g>
      </svg>

      <p className="mt-2 text-[10px] leading-4 text-slate-500">
        Click anywhere to place the pad, drag the green square to fine-tune, or pick a numbered alternative. Distances are great-circle surface distances from the fixture
        coordinates; target distances are horizontal at planned TD.
        {(() => {
          const nearest = clearances[0];
          return nearest ? ` Nearest offset ${nearest.well.id} at ${distanceKm(site, nearest.well.coordinates).toFixed(2)} km surface.` : "";
        })()}
      </p>
    </div>
  );
}
