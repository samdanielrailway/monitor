import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout-shell";
import { PageHeader } from "@/components/page-header";
import { engineerNotes } from "@/lib/nwis-data";

export default function EngineerPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Engineer Knowledge Workspace" subtitle="Capture operational observations, lessons, and field notes tied to evidence and depth context." />

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">
            <Plus className="h-4 w-4" /> Add observation
          </button>
        </div>

        <div className="grid gap-4">
          {engineerNotes.map((note) => (
            <div key={note.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{note.wellId}</div>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">{note.title}</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-700">{note.status}</span>
              </div>
              <div className="mt-4 text-sm text-slate-600">{note.summary}</div>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                <span>{note.date}</span>
                <span>{note.depth} m</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
