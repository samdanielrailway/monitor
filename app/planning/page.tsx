"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Compass, Hammer, MapPin, Route, Save, Sparkles, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout-shell";
import { PageHeader } from "@/components/page-header";
import { useNwisWorkspace } from "@/components/nwis-workspace-context";
import { PlanningMap } from "@/components/planning-map";
import { formationIntervals, wells } from "@/lib/nwis-data";
import type { Well } from "@/lib/nwis-data";
import {
  CasingProgram,
  buildWellPath,
  distanceKm,
  evaluateOffsets,
  projectPoint,
  runPlanningChecks,
  suggestedSites,
  targetRadius,
} from "@/lib/well-planning";
import type { LatLng } from "@/lib/well-planning";

const Planning3DGuidance = dynamic(() => import("@/components/planning-3d-guidance").then((module) => module.Planning3DGuidance), {
  ssr: false,
  loading: () => <div className="grid h-full min-h-[420px] place-items-center rounded-2xl bg-[#0d1a20] text-sm text-slate-300">Preparing 3D placement guidance…</div>,
});

const reference = wells[0].coordinates;

const statusStyle = {
  PASS: { icon: CheckCircle2, className: "border-emerald-200 bg-emerald-50 text-emerald-900", badge: "bg-emerald-600 text-white" },
  WARN: { icon: AlertTriangle, className: "border-amber-200 bg-amber-50 text-amber-900", badge: "bg-amber-500 text-white" },
  FAIL: { icon: XCircle, className: "border-rose-300 bg-rose-50 text-rose-900", badge: "bg-rose-600 text-white" },
} as const;

export default function PlanningPage() {
  const { selectedWell, ingestPlannedWell, plannedWells } = useNwisWorkspace();
  const [site, setSite] = useState<LatLng>(projectPoint(reference, 0.9, 0.7));
  const [wellName, setWellName] = useState("WX-31");
  const [targetFormation, setTargetFormation] = useState("Upper Carbonate");
  const [targetDepth, setTargetDepth] = useState(520);
  const [kickOffDepth, setKickOffDepth] = useState(320);
  const [buildRate, setBuildRate] = useState(2.1);
  const [inclination, setInclination] = useState(45);
  const [azimuth, setAzimuth] = useState(35);
  const [surveyUncertainty, setSurveyUncertainty] = useState(40);
  const [rig, setRig] = useState("Rig-04");
  const [spudDate, setSpudDate] = useState("2026-01-12");
  const [created, setCreated] = useState<Well | null>(null);

  const plan = useMemo(
    () => ({ kickOffDepth, buildRate, inclination, azimuth, targetDepth, surveyUncertainty }),
    [azimuth, buildRate, inclination, kickOffDepth, surveyUncertainty, targetDepth],
  );

  const path = useMemo(() => buildWellPath(plan, site), [plan, site]);
  const clearances = useMemo(() => evaluateOffsets(site, plan, path.end, wells), [path.end, plan, site]);
  const checks = useMemo(() => runPlanningChecks(site, plan, path.end, clearances), [clearances, path.end, plan, site]);
  const radius = useMemo(() => targetRadius(plan), [plan]);
  const suggestions = useMemo(() => suggestedSites(reference), []);

  const blocking = checks.filter((check) => check.status === "FAIL");
  const warnings = checks.filter((check) => check.status === "WARN");
  const canCreate = blocking.length === 0 && wellName.trim().length > 0;

  const createWell = () => {
    if (!canCreate) return;
    const newWell: Well = {
      id: wellName.trim().toUpperCase(),
      location: "Rajasthan · planned prospect",
      wellType: targetFormation.includes("Carbonate") ? "Appraisal" : "Exploration",
      profile: `Directional · KO ${Math.round(kickOffDepth)} m · ${buildRate}°/100 m`,
      rig,
      status: "Standby",
      targetFormation,
      targetDepth: Math.round(targetDepth),
      actualDepth: 0,
      projectedTD: Math.round(targetDepth),
      spudDate,
      coordinates: { lat: site.lat, lng: site.lng },
      formation: targetFormation,
      currentDepth: 0,
      lastActivity: `Planned ${spudDate}`,
      nearbyWells: clearances.length,
    };
    ingestPlannedWell(newWell);
    setCreated(newWell);
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="New Well Placement Planner"
          subtitle="Choose a site against offset wells, validate separation in 3D, and register the planned well into the workspace."
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2">
                <Compass className="h-4 w-4 text-emerald-700" />
                <span className="text-sm font-semibold text-slate-800">3D placement guidance</span>
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {blocking.length === 0 ? (warnings.length > 0 ? "Conditional" : "Clear to drill") : "Blocked"}
                </span>
              </header>
              <div className="h-[520px]">
                <Planning3DGuidance site={site} plan={plan} pathPoints={path.points} offsets={wells} clearances={clearances} pathEnd={path.end} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Engineering checks
              </h3>
              <ul className="mt-2 grid gap-2 md:grid-cols-2">
                {checks.map((check) => {
                  const tone = statusStyle[check.status];
                  const Icon = tone.icon;
                  return (
                    <li key={check.id} className={`rounded-xl border px-3 py-2 ${tone.className}`}>
                      <div className="flex items-start gap-2">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold">{check.label}</span>
                            <span className={`ml-auto shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white ${tone.badge}`}>{check.status}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] leading-4 opacity-90">{check.detail}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide opacity-70">{check.value}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <Route className="h-3.5 w-3.5" />
                Offset clearance at planned TD
              </h3>
              <table className="mt-2 w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[9px] uppercase tracking-wide text-slate-500">
                    <th className="py-1 pr-2 font-semibold">Offset</th>
                    <th className="py-1 pr-2 font-semibold">Surface</th>
                    <th className="py-1 pr-2 font-semibold">At TD</th>
                    <th className="py-1 pr-2 font-semibold">Margin</th>
                    <th className="py-1 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clearances.map((clearance) => (
                    <tr key={clearance.well.id} className="border-b border-slate-100">
                      <td className="py-1.5 pr-2 font-semibold text-slate-800">{clearance.well.id}</td>
                      <td className="py-1.5 pr-2 tabular-nums text-slate-600">{clearance.surfaceDistanceKm.toFixed(2)} km</td>
                      <td className="py-1.5 pr-2 tabular-nums text-slate-600">{(clearance.horizontalAtTargetM / 1000).toFixed(2)} km</td>
                      <td className="py-1.5 pr-2 tabular-nums font-semibold text-slate-700">{Math.round(clearance.marginM)} m</td>
                      <td className="py-1.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            clearance.marginM < 0 ? "bg-rose-100 text-rose-700" : clearance.marginM < 100 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {clearance.marginM < 0 ? `conflict @ ${Math.round(clearance.crossesAtDepth ?? 0)} m` : clearance.marginM < 100 ? "tight" : "clear"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <aside className="space-y-3">
            <PlanningMap site={site} pathEnd={path.end} offsets={wells} clearances={clearances} radiusM={radius} onSiteChange={setSite} onPick={setSite} suggestions={suggestions} />

            <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <Hammer className="h-3.5 w-3.5" />
                Well design
              </h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  { label: "Well name", value: wellName, set: setWellName, type: "text" },
                  { label: "Target formation", value: targetFormation, set: setTargetFormation, type: "select" },
                ].map((field) => (
                  <label key={field.label} className="col-span-1 text-[10px] font-semibold text-slate-600">
                    {field.label}
                    {field.type === "select" ? (
                      <select
                        value={field.value}
                        onChange={(event) => {
                          field.set(event.target.value);
                          const interval = formationIntervals.find((item) => item.name === event.target.value);
                          if (interval) setTargetDepth(Math.round((interval.top + interval.bottom) / 2));
                        }}
                        className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-medium"
                      >
                        {formationIntervals.map((interval) => (
                          <option key={interval.name}>{interval.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={field.value}
                        onChange={(event) => field.set(event.target.value)}
                        className="mt-0.5 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[11px] font-medium"
                      />
                    )}
                  </label>
                ))}

                {[
                  { label: "Planned TD (m)", value: targetDepth, set: setTargetDepth, min: 200, max: 1150, step: 10 },
                  { label: "Kick-off (m)", value: kickOffDepth, set: setKickOffDepth, min: 100, max: 900, step: 10 },
                  { label: "Build rate (°/100 m)", value: buildRate, set: setBuildRate, min: 0.5, max: 4, step: 0.1 },
                  { label: "Final inclination (°)", value: inclination, set: setInclination, min: 15, max: 90, step: 5 },
                ].map((field) => (
                  <label key={field.label} className="text-[10px] font-semibold text-slate-600">
                    {field.label}
                    <input
                      type="number"
                      value={field.value}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      onChange={(event) => field.set(Number(event.target.value))}
                      className="mt-0.5 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[11px] font-medium"
                    />
                  </label>
                ))}

                <label className="text-[10px] font-semibold text-slate-600">
                  Azimuth (°)
                  <input type="number" value={azimuth} min={0} max={359} onChange={(event) => setAzimuth(Number(event.target.value))} className="mt-0.5 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[11px] font-medium" />
                </label>
                <label className="text-[10px] font-semibold text-slate-600">
                  Survey uncertainty (m)
                  <input type="number" value={surveyUncertainty} min={5} max={200} onChange={(event) => setSurveyUncertainty(Number(event.target.value))} className="mt-0.5 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[11px] font-medium" />
                </label>
                <label className="text-[10px] font-semibold text-slate-600">
                  Rig
                  <input value={rig} onChange={(event) => setRig(event.target.value)} className="mt-0.5 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[11px] font-medium" />
                </label>
                <label className="text-[10px] font-semibold text-slate-600">
                  Spud date
                  <input type="date" value={spudDate} onChange={(event) => setSpudDate(event.target.value)} className="mt-0.5 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[11px] font-medium" />
                </label>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Derived survey</div>
                <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  {[
                    ["Target radius", `${Math.round(radius)} m`],
                    ["Horizontal run", `${Math.round(path.horizontalRun)} m`],
                    ["Lateral offset", `${(distanceKm(site, path.end) * 1000).toFixed(0)} m`],
                    ["Nearest offset", clearances[0] ? `${(clearances[0].horizontalAtTargetM / 1000).toFixed(2)} km` : "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-2">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="font-semibold tabular-nums text-slate-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Casing program</h3>
              <ul className="mt-2 space-y-1.5">
                {CasingProgram.map((run) => (
                  <li key={run.size} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5">
                    <span className="w-12 shrink-0 text-[11px] font-bold text-slate-800">{run.size}</span>
                    <span className="w-14 shrink-0 text-[10px] tabular-nums text-slate-500">{run.depth} m</span>
                    <span className="min-w-0 flex-1 truncate text-[10px] text-slate-600">{run.purpose}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-slate-400">Casing depths are schematic until a design basis is issued.</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <button
                type="button"
                onClick={createWell}
                disabled={!canCreate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Save className="h-4 w-4" />
                Create planned well
              </button>
              {blocking.length > 0 && (
                <p className="mt-2 text-[10px] leading-4 text-rose-700">Resolve {blocking.length} blocking check{blocking.length === 1 ? "" : "s"} before registering the well.</p>
              )}

              {created && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5">
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-900">
                    <Sparkles className="h-3.5 w-3.5" />
                    {created.id} registered
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-emerald-800">
                    Added to the workspace with status Standby. It now appears in the well selector, 3D subsurface workspace and evidence graph. Reference well for this session was{" "}
                    {selectedWell.id}.
                  </p>
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-900">
                    <MapPin className="h-3 w-3" />
                    {created.coordinates.lat.toFixed(4)}, {created.coordinates.lng.toFixed(4)}
                  </p>
                </div>
              )}

              {plannedWells.length > 0 && (
                <div className="mt-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Planned this session</div>
                  <ul className="mt-1.5 space-y-1">
                    {plannedWells.map((well) => (
                      <li key={well.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px]">
                        <span className="font-semibold text-slate-800">{well.id}</span>
                        <span className="text-slate-500">TD {well.targetDepth} m</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
