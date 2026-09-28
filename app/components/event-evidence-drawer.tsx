"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, ClipboardList, FileSearch, MapPin, X } from "lucide-react";
import { useNwisWorkspace } from "@/components/nwis-workspace-context";

export function EventEvidenceDrawer() {
  const { selectedEvent, setSelectedEventId } = useNwisWorkspace();

  useEffect(() => {
    if (!selectedEvent) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedEventId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedEvent, setSelectedEventId]);

  if (!selectedEvent) return null;

  const close = () => setSelectedEventId(null);

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end bg-slate-950/20 backdrop-blur-[1px]" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-evidence-title"
        className="flex h-full w-full max-w-[440px] flex-col border-l border-slate-300 bg-[#fbfcfb] shadow-2xl animate-in slide-in-from-right duration-200"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.17em] text-amber-800"><FileSearch className="h-3.5 w-3.5" /> Source evidence</div>
            <h2 id="event-evidence-title" className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{selectedEvent.type}</h2>
            <div className="mt-1 text-[11px] text-slate-500">Historical fixture record · {selectedEvent.id}</div>
          </div>
          <button type="button" aria-label="Close evidence panel" onClick={close} className="grid h-8 w-8 place-items-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">Event anchor</div>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-900"><MapPin className="h-3.5 w-3.5 text-amber-700" />{selectedEvent.wellId} · {selectedEvent.depth} m MD</div>
              <div className="mt-1 text-[11px] text-slate-600">{selectedEvent.formation} <span className="mx-1 text-slate-300">·</span> {selectedEvent.date}</div>
            </div>
            <span className={`shrink-0 rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${selectedEvent.severity === "Critical" || selectedEvent.severity === "High" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>{selectedEvent.severity}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-b border-slate-200 pb-4">
            <EvidenceField label="Source type" value={selectedEvent.source} />
            <EvidenceField label="Page / sheet / source locator" value={selectedEvent.sourcePage} />
            <EvidenceField label="Source confidence" value={selectedEvent.confidence} />
            <EvidenceField label="Validation" value={selectedEvent.demo ? "Demo fixture" : "Prototype record"} />
          </div>

          <div className="mt-4 space-y-4">
            <EvidenceSection label="Recorded description">{selectedEvent.description}</EvidenceSection>
            <EvidenceSection label="Recorded response">{selectedEvent.response}</EvidenceSection>
            <EvidenceSection label="Recorded outcome">{selectedEvent.outcome}</EvidenceSection>
          </div>

          <div className="mt-5 border-l-2 border-sky-700 bg-sky-50/80 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-sky-900"><ClipboardList className="h-3 w-3" /> Why is this shown?</div>
            <p className="mt-1.5 text-[10px] leading-4 text-slate-700">This event is surfaced as historical context because its recorded formation/depth interval is relevant to the selected well context. It is not a prediction or drilling instruction.</p>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" /> Source provenance fields are retained in the prototype record.</div>
          <p className="mt-2 text-[9px] leading-4 text-slate-500">The original source document is not embedded in this frontend fixture. The page/sheet value above is a source locator, not a rendered or independently verified document preview.</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-5 py-3">
          <Link href="/documents" onClick={close} className="inline-flex items-center gap-1.5 rounded bg-[#173944] px-3 py-2 text-[10px] font-semibold text-white hover:bg-[#24515e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"><FileSearch className="h-3.5 w-3.5" />Open document workspace</Link>
          <Link href="/compare" onClick={close} className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-slate-900">Compare well <ArrowUpRight className="h-3 w-3" /></Link>
        </div>
      </aside>
    </div>
  );
}

function EvidenceField({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[9px] uppercase tracking-[0.1em] text-slate-500">{label}</div><div className="mt-1 break-words text-[10px] font-medium leading-4 text-slate-800">{value}</div></div>;
}

function EvidenceSection({ label, children }: { label: string; children: string }) {
  return <section><h3 className="text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-500">{label}</h3><p className="mt-1.5 text-[11px] leading-[1.65] text-slate-700">{children}</p></section>;
}
