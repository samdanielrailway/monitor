import { AlertTriangle, BarChart3, Layers3, Mountain } from "lucide-react";
import { currentWell, formationIntervals, wells, wellEvents } from "@/lib/nwis-data";

const maxDepth = 1200;

function layerColor(lithology: string) {
  const description = lithology.toLowerCase();
  if (description.includes("basement")) return "#737b88";
  if (description.includes("evaporitic")) return "#c8b8d6";
  if (description.includes("carbonate") || description.includes("limestone") || description.includes("dolomite")) return "#a8cbca";
  if (description.includes("sandstone") || description.includes("siltstone")) return "#d8b37e";
  return "#d8d0bf";
}

function layerPattern(lithology: string) {
  const description = lithology.toLowerCase();
  if (description.includes("sandstone") || description.includes("siltstone")) {
    return "repeating-linear-gradient(135deg, transparent 0 7px, rgb(120 83 41 / 18%) 7px 8px)";
  }
  if (description.includes("carbonate") || description.includes("limestone") || description.includes("dolomite")) {
    return "repeating-linear-gradient(0deg, transparent 0 8px, rgb(15 77 76 / 15%) 8px 9px)";
  }
  if (description.includes("evaporitic")) {
    return "repeating-linear-gradient(45deg, transparent 0 9px, rgb(91 63 113 / 16%) 9px 10px)";
  }
  if (description.includes("basement")) {
    return "repeating-linear-gradient(135deg, transparent 0 7px, rgb(255 255 255 / 20%) 7px 8px), repeating-linear-gradient(45deg, transparent 0 7px, rgb(15 23 42 / 14%) 7px 8px)";
  }
  return "repeating-linear-gradient(0deg, transparent 0 9px, rgb(71 85 105 / 13%) 9px 10px)";
}

export function FormationCrossSection() {
  const referenceWell = wells.find((well) => well.id === "WX-07") ?? currentWell;
  const referenceEvents = wellEvents.filter((event) => event.wellId === referenceWell.id);
  const eventStart = Math.min(...referenceEvents.map((event) => event.depth));
  const eventEnd = Math.max(...referenceEvents.map((event) => event.depth));
  const eventMidpoint = (eventStart + eventEnd) / 2;
  const markerPct = (currentWell.currentDepth / maxDepth) * 100;
  const eventPct = (eventMidpoint / maxDepth) * 100;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-sky-700">
            <Layers3 className="h-3.5 w-3.5" /> Formation architecture
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Lithology & depth model</h2>
          <p className="mt-1 text-sm text-slate-500">Depth-aligned offset reference for the active well context</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-slate-600">
          Reference offset · {referenceWell.id}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between pl-[68px] pr-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-500 sm:pl-[76px]">
          <span>Reference stratigraphy</span>
          <span className="hidden sm:inline">Lithology & source confidence</span>
        </div>

        <div className="relative h-[390px] overflow-hidden rounded-xl border border-slate-300 bg-[#e9edf0]">
          <div className="absolute inset-y-0 left-0 z-10 w-[58px] border-r border-slate-300 bg-white/90 sm:w-[68px]">
            <div className="absolute left-2 top-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:left-3">MD</div>
            {[0, 400, 800, 1200].map((depth) => (
              <div
                key={depth}
                className={`absolute left-2 flex items-center gap-1 text-[10px] tabular-nums text-slate-600 sm:left-3 sm:text-[11px] ${depth === 0 ? "translate-y-0" : depth === maxDepth ? "-translate-y-full" : "-translate-y-1/2"}`}
                style={{ top: `${(depth / maxDepth) * 100}%` }}
              >
                <span className="h-px w-2 bg-slate-400" />{depth.toLocaleString()} m
              </div>
            ))}
            <div className="absolute inset-y-0 right-0 w-px bg-[repeating-linear-gradient(to_bottom,#94a3b8_0_1px,transparent_1px_8px)]" />
          </div>

          <div className="absolute inset-y-0 left-[58px] right-0 overflow-hidden sm:left-[68px]">
            {formationIntervals.map((interval) => {
              const topPct = (interval.top / maxDepth) * 100;
              const heightPct = (interval.thickness / maxDepth) * 100;
              const color = layerColor(interval.lithology);

              return (
                <div
                  key={interval.name}
                  title={`${interval.name} · ${interval.top}–${interval.bottom} m · ${interval.lithology} · ${interval.source} · ${interval.confidence} confidence`}
                  className="absolute inset-x-0 border-b border-slate-700/20"
                  style={{
                    top: `${topPct}%`,
                    height: `${heightPct}%`,
                    backgroundColor: color,
                    backgroundImage: layerPattern(interval.lithology),
                  }}
                >
                  {heightPct >= 6.5 && (
                    <div className="flex h-full items-center justify-between gap-2 px-2 sm:px-3">
                      <div className="min-w-0">
                        <div className="truncate text-[9px] font-medium uppercase tracking-[0.12em] text-slate-700/75">{interval.source} · {interval.confidence}</div>
                        <div className="truncate text-[11px] font-semibold text-slate-900 sm:text-sm">{interval.name}</div>
                      </div>
                      <div className="hidden shrink-0 text-right text-[10px] text-slate-700 sm:block">
                        <div>{interval.top}–{interval.bottom} m</div>
                        <div>{interval.lithology}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {formationIntervals.filter((interval) => interval.thickness / maxDepth * 100 < 6.5).map((interval) => (
              <div
                key={`${interval.name}-label`}
                className="absolute right-2 z-[2] rounded-md border border-slate-400/60 bg-white/85 px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 shadow-sm"
                style={{ top: `${(interval.top / maxDepth) * 100}%` }}
              >
                {interval.name}
              </div>
            ))}

            <div
              className="absolute inset-x-0 z-[3] border-t-2 border-dashed border-sky-800"
              style={{ top: `${markerPct}%` }}
            >
              <span className="absolute right-2 top-0 -translate-y-1/2 rounded-md bg-sky-800 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white shadow sm:text-[10px]">
                {currentWell.id} · {currentWell.currentDepth} m MD
              </span>
            </div>

            {referenceEvents.length > 0 && (
              <div
                className="absolute inset-x-0 z-[4] border-t border-amber-700"
                style={{ top: `${eventPct}%` }}
              >
                <span className="absolute left-2 top-0 -translate-y-1/2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-900 shadow sm:text-[10px]">
                  {referenceWell.id} event cluster · {eventStart}–{eventEnd} m
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-sky-800"><Mountain className="h-3.5 w-3.5" /> Active formation</div>
          <div className="mt-2 text-sm font-semibold text-slate-900">{currentWell.formation}</div>
          <div className="mt-1 text-xs text-slate-600">Current MD {currentWell.currentDepth.toLocaleString()} m · interpretation overlay</div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-amber-800"><AlertTriangle className="h-3.5 w-3.5" /> Offset event corridor</div>
          <div className="mt-2 text-sm font-semibold text-slate-900">{eventStart}–{eventEnd} m · {referenceEvents.length} records</div>
          <div className="mt-1 text-xs text-slate-600">{referenceEvents[0]?.type} and operational response in {referenceEvents[0]?.formation}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-600"><BarChart3 className="h-3.5 w-3.5" /> Evidence status</div>
          <div className="mt-2 text-sm font-semibold text-slate-900">Source-attributed intervals</div>
          <div className="mt-1 text-xs text-slate-600">Prognosed, sample, and wireline records retain confidence labels.</div>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-4 text-slate-500">
        Prototype depth alignment only. Confirm datum and formation picks against validated well records before operational use.
      </p>
    </section>
  );
}
