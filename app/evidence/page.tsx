"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BookOpen, FileText, Filter, Layers3, Network, Search, Target } from "lucide-react";
import { AppShell } from "@/components/layout-shell";
import { PageHeader } from "@/components/page-header";
import { useNwisWorkspace } from "@/components/nwis-workspace-context";
import { documents, formationIntervals, wellEvents, wells } from "@/lib/nwis-data";
import type { EventRecord } from "@/lib/nwis-data";

type GraphNode = {
  id: string;
  kind: "well" | "formation" | "event" | "document";
  label: string;
  sublabel: string;
  column: number;
  row: number;
  meta: Record<string, string>;
  event?: EventRecord;
};

const columnTitles = ["Well", "Stratigraphy", "Event", "Source record"];
const nodeTone: Record<GraphNode["kind"], string> = {
  well: "border-sky-400 bg-sky-50",
  formation: "border-amber-400 bg-amber-50",
  event: "border-rose-400 bg-rose-50",
  document: "border-emerald-400 bg-emerald-50",
};
const nodeAccent: Record<GraphNode["kind"], string> = {
  well: "text-sky-700",
  formation: "text-amber-700",
  event: "text-rose-700",
  document: "text-emerald-700",
};

export default function EvidencePage() {
  const { setCurrentDepth, setSelectedEventId } = useNwisWorkspace();
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [selected, setSelected] = useState<string | null>(null);

  const { nodes, links } = useMemo(() => {
    const filteredEvents = wellEvents.filter((event) => {
      const matchesSeverity = severity === "All" || event.severity === severity;
      const text = `${event.type} ${event.formation} ${event.source} ${event.description}`.toLowerCase();
      return matchesSeverity && (query.trim() === "" || text.includes(query.trim().toLowerCase()));
    });

    const usedWells = new Set(filteredEvents.map((event) => event.wellId));
    const usedFormations = new Set(filteredEvents.map((event) => event.formation));
    const usedSources = new Set(filteredEvents.map((event) => event.source));

    const graphNodes: GraphNode[] = [];
    const graphLinks: { from: string; to: string; label: string }[] = [];

    wells
      .filter((well) => usedWells.has(well.id))
      .forEach((well, index) => {
        graphNodes.push({
          id: `well:${well.id}`,
          kind: "well",
          label: well.id,
          sublabel: well.formation,
          column: 0,
          row: index,
          meta: { Status: well.status, Rig: well.rig, TD: `${well.actualDepth} m` },
        });
      });

    [...usedFormations].forEach((name, index) => {
      const interval = formationIntervals.find((item) => item.name === name);
      graphNodes.push({
        id: `formation:${name}`,
        kind: "formation",
        label: name,
        sublabel: interval ? `${interval.top}–${interval.bottom} m` : "reference pick",
        column: 1,
        row: index,
        meta: interval ? { Lithology: interval.lithology, Source: interval.source, Confidence: interval.confidence } : {},
      });
    });

    filteredEvents.forEach((event, index) => {
      graphNodes.push({
        id: `event:${event.id}`,
        kind: "event",
        label: event.type,
        sublabel: `${event.depth} m · ${event.date}`,
        column: 2,
        row: index,
        meta: { Severity: event.severity, Formation: event.formation, Source: event.source, Page: event.sourcePage, Confidence: event.confidence },
        event,
      });
      graphLinks.push({ from: `well:${event.wellId}`, to: `formation:${event.formation}`, label: event.wellId });
      graphLinks.push({ from: `formation:${event.formation}`, to: `event:${event.id}`, label: `${event.depth} m` });
    });

    documents
      .filter((doc) => usedSources.has(doc.kind) || usedSources.has("WCR") || usedSources.has("DDR"))
      .forEach((doc, index) => {
        graphNodes.push({
          id: `document:${doc.name}`,
          kind: "document",
          label: doc.name,
          sublabel: `${doc.kind} · ${doc.wellId} · ${doc.pages} pages`,
          column: 3,
          row: index,
          meta: { Status: doc.status, Date: doc.date, Pages: String(doc.pages) },
        });
      });

    filteredEvents.forEach((event) => {
      const match = documents.find((doc) => doc.kind === event.source) ?? documents[0];
      if (match) graphLinks.push({ from: `event:${event.id}`, to: `document:${match.name}`, label: event.sourcePage });
    });

    return { nodes: graphNodes, links: graphLinks };
  }, [query, severity]);

  const rows = useMemo(() => {
    const perColumn = new Map<number, number>();
    return nodes.map((node) => {
      const index = perColumn.get(node.column) ?? 0;
      perColumn.set(node.column, index + 1);
      return { node, index };
    });
  }, [nodes]);

  const positionOf = (id: string) => {
    const column = nodes.filter((node) => node.column === nodes.find((node) => node.id === id)?.column);
    const index = column.findIndex((node) => node.id === id);
    return index;
  };

  const selectedNode = nodes.find((node) => node.id === selected);

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Evidence & Provenance Graph"
          subtitle="Trace every reference event from well, through stratigraphy, to the source record it came from."
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter events, formations, sources…"
                  aria-label="Filter evidence graph"
                  className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-2 text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                {(["All", "High", "Medium", "Low"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSeverity(option)}
                    aria-pressed={severity === option}
                    className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                      severity === option ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </header>

            <div className="grid grid-cols-4 gap-px border-b border-slate-200 bg-slate-200 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              {columnTitles.map((title) => (
                <div key={title} className="bg-slate-50 px-2 py-1.5">
                  {title}
                </div>
              ))}
            </div>

            <div className="min-h-[420px] p-4">
              {rows.length === 0 ? (
                <div className="grid h-64 place-items-center text-sm text-slate-500">No evidence matches the current filter.</div>
              ) : (
                <div className="relative">
                  <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                    {links.map((link, index) => {
                      const from = nodes.find((node) => node.id === link.from);
                      const to = nodes.find((node) => node.id === link.to);
                      if (!from || !to) return null;
                      const fromIndex = positionOf(from.id);
                      const toIndex = positionOf(to.id);
                      if (fromIndex < 0 || toIndex < 0) return null;
                      const x1 = ((from.column + 1) / 4) * 100;
                      const x2 = ((to.column + 1) / 4) * 100;
                      const y1 = ((fromIndex + 0.5) / Math.max(1, nodes.filter((node) => node.column === from.column).length)) * 100;
                      const y2 = ((toIndex + 0.5) / Math.max(1, nodes.filter((node) => node.column === to.column).length)) * 100;
                      const isActive = selected === from.id || selected === to.id;
                      return (
                        <path
                          key={`${link.from}-${link.to}-${index}`}
                          d={`M ${x1}% ${y1}% C ${(x1 + x2) / 2}% ${y1}%, ${(x1 + x2) / 2}% ${y2}%, ${x2}% ${y2}%`}
                          fill="none"
                          stroke={isActive ? "#0f172a" : "#cbd5e1"}
                          strokeWidth={isActive ? 2 : 1.2}
                        />
                      );
                    })}
                  </svg>

                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((column) => (
                      <div key={column} className="flex flex-col gap-2">
                        {rows
                          .filter(({ node }) => node.column === column)
                          .map(({ node }) => (
                            <button
                              key={node.id}
                              type="button"
                              onClick={() => {
                                setSelected(node.id);
                                if (node.event) {
                                  setCurrentDepth(node.event.depth);
                                  setSelectedEventId(node.event.id);
                                }
                              }}
                              className={`relative z-10 rounded-xl border px-2 py-1.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                                nodeTone[node.kind]
                              } ${selected === node.id ? "ring-2 ring-slate-900" : ""}`}
                            >
                              <span className={`block truncate text-[11px] font-bold ${nodeAccent[node.kind]}`}>{node.label}</span>
                              <span className="block truncate text-[10px] text-slate-600">{node.sublabel}</span>
                            </button>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <footer className="flex flex-wrap items-center gap-3 border-t border-slate-200 px-3 py-2 text-[10px] text-slate-500">
              {(["well", "formation", "event", "document"] as const).map((kind) => (
                <span key={kind} className="inline-flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded border ${nodeTone[kind]}`} />
                  {columnTitles[({ well: 0, formation: 1, event: 2, document: 3 })[kind]]}
                </span>
              ))}
              <span className="ml-auto">{nodes.length} nodes · {links.length} links</span>
            </footer>
          </section>

          <aside className="space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <Network className="h-3.5 w-3.5" />
                Node detail
              </h2>
              {selectedNode ? (
                <div className="mt-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <div className="text-sm font-bold text-slate-900">{selectedNode.label}</div>
                    <div className="mt-0.5 text-[11px] text-slate-600">{selectedNode.sublabel}</div>
                    <dl className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                      {Object.entries(selectedNode.meta).map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-2 text-[11px]">
                          <dt className="text-slate-500">{label}</dt>
                          <dd className="truncate font-semibold text-slate-800">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  {selectedNode.event && (
                    <div className="mt-2 space-y-2">
                      <div className="rounded-xl border border-slate-200 p-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                          What happened
                        </div>
                        <p className="mt-1 text-[11px] leading-4 text-slate-600">{selectedNode.event.description}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                          <Target className="h-3.5 w-3.5 text-sky-600" />
                          Response
                        </div>
                        <p className="mt-1 text-[11px] leading-4 text-slate-600">{selectedNode.event.response}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                          <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                          Outcome
                        </div>
                        <p className="mt-1 text-[11px] leading-4 text-slate-600">{selectedNode.event.outcome}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-slate-500">Select a node to inspect its provenance chain. Clicking an event also moves the shared depth cursor.</p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <FileText className="h-3.5 w-3.5" />
                Corpus coverage
              </h2>
              <ul className="mt-2 space-y-1.5">
                {documents.map((doc) => (
                  <li key={doc.name} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-2 py-1.5">
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-semibold text-slate-800">{doc.name}</span>
                      <span className="block text-[10px] text-slate-500">
                        {doc.kind} · {doc.wellId} · {doc.pages} pages
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-600">{doc.status}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <Layers3 className="h-3.5 w-3.5" />
                Reading the graph
              </h2>
              <ul className="mt-2 space-y-1.5 text-[11px] leading-4 text-slate-600">
                <li>Each edge is a recorded relationship, not an inferred one.</li>
                <li>Every event resolves to a source page you can open in the evidence drawer.</li>
                <li>Historical offset events are reference context, never predictions.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
