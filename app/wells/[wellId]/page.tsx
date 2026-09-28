import Link from "next/link";
import { Activity, ArrowUpRight, FileText, FlaskConical, Mountain, ShieldCheck, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout-shell";
import { PageHeader } from "@/components/page-header";
import { currentWell, documents, formationIntervals, wellEvents, wells } from "@/lib/nwis-data";

export function generateStaticParams() {
  return wells.map((well) => ({ wellId: well.id }));
}

export default async function WellPage({ params }: { params: Promise<{ wellId: string }> }) {
  const { wellId } = await params;
  const well = wells.find((item) => item.id === wellId) ?? currentWell;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title={well.id} subtitle={`${well.location} • ${well.wellType} • ${well.rig}`} backHref="/dashboard" />

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Well profile</div>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">{well.id}</h2>
            </div>
            <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-sky-700">{well.status}</div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <MetaTile label="Location" value={well.location} />
            <MetaTile label="Target TD" value={`${well.targetDepth} m`} />
            <MetaTile label="Actual TD" value={`${well.actualDepth} m`} />
            <MetaTile label="Formation" value={well.formation} />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500"><Mountain className="h-3.5 w-3.5" /> Formation profile</div>
              <div className="space-y-3">
                {formationIntervals.slice(0, 6).map((interval) => (
                  <div key={interval.name} className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                    <div className="font-medium text-slate-900">{interval.name}</div>
                    <div>{interval.top} - {interval.bottom} m</div>
                    <div>{interval.thickness} m</div>
                    <div>{interval.source}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500"><TrendingUp className="h-3.5 w-3.5" /> Drilling summary</div>
              <div className="space-y-3">
                {wellEvents.filter((event) => event.wellId === well.id).slice(0, 3).map((event) => (
                  <div key={event.id} className="rounded-2xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-900">{event.type}</div>
                      <div className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-amber-700">{event.severity}</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">{event.date} • {event.depth} m • {event.formation}</div>
                    <div className="mt-2 text-sm text-slate-500">{event.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500"><Activity className="h-3.5 w-3.5" /> Key metrics</div>
              <div className="grid gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{well.status}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Current formation</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{well.formation}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Last activity</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{well.lastActivity}</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500"><FileText className="h-3.5 w-3.5" /> Source documents</div>
              <div className="space-y-3">
                {documents.filter((doc) => doc.wellId === well.id).map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                    <div>
                      <div className="font-medium text-slate-900">{doc.name}</div>
                      <div className="text-xs text-slate-500">{doc.kind} • {doc.date}</div>
                    </div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-600">{doc.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-4">
          <NavTile href={`/wells/${well.id}/geology`} label="Geology" icon={Mountain} />
          <NavTile href={`/wells/${well.id}/drilling`} label="Drilling" icon={TrendingUp} />
          <NavTile href={`/wells/${well.id}/mud`} label="Mud" icon={FlaskConical} />
          <NavTile href={`/wells/${well.id}/events`} label="Events" icon={ShieldCheck} />
        </div>
      </div>
    </AppShell>
  );
}

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function NavTile({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Mountain }) {
  return (
    <Link href={href} className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:bg-sky-50">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold text-slate-900">{label}</div>
        <Icon className="h-5 w-5 text-slate-500 group-hover:text-sky-700" />
      </div>
      <div className="mt-3 inline-flex items-center gap-2 text-sm text-sky-700">
        Open view <ArrowUpRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
