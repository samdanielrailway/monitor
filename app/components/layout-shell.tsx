"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  BookOpen,
  ChevronDown,
  CircleDot,
  Compass,
  Database,
  FileText,
  Gauge,
  Hammer,
  Layers3,
  Map,
  Network,
  Search,
  ShieldCheck,
  UserRound,
  Workflow,
} from "lucide-react";
import { useNwisWorkspace } from "@/components/nwis-workspace-context";
import { EventEvidenceDrawer } from "@/components/event-evidence-drawer";
import { formationAtReferenceDepth, wells } from "@/lib/nwis-data";

const navigationGroups = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Command center", icon: Gauge },
      { href: "/map", label: "Nearby wells", icon: Map },
      { href: "/subsurface", label: "3D subsurface", icon: Layers3 },
    ],
  },
  {
    label: "Well intelligence",
    items: [
      { href: "/wells", label: "Wells", icon: Compass, selectedWellPath: true },
      { href: "/compare", label: "Compare wells", icon: Workflow },
      { href: "/similar-wells", label: "Similar wells", icon: CircleDot },
      { label: "Events & timeline", icon: Activity, planned: true },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { href: "/search", label: "Search knowledge", icon: Search },
      { href: "/documents", label: "Documents", icon: FileText },
      { href: "/evidence", label: "Evidence & graph", icon: Network },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/alerts", label: "Historical context", icon: Bell },
      { href: "/engineer", label: "Engineer notes", icon: BookOpen },
      { href: "/planning", label: "Plan new well", icon: Hammer },
      { label: "Shift handover", icon: UserRound, planned: true },
    ],
  },
  {
    label: "Data",
    items: [
      { label: "Ingestion", icon: Database, planned: true },
      { label: "Data quality", icon: ShieldCheck, planned: true },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { selectedWell, setSelectedWellId, currentDepth, setCurrentDepth } = useNwisWorkspace();
  const depthFormationPick = selectedWell.id === "WX-07" ? formationAtReferenceDepth(currentDepth) : undefined;
  const formationContext = depthFormationPick?.name ?? selectedWell.formation;

  return (
    <div className="min-h-screen bg-[#f3f5f4] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-[68px] shrink-0 flex-col border-r border-slate-800 bg-[#101b23] text-slate-100 lg:w-[244px]">
          <Link href="/dashboard" className="flex h-[76px] items-center gap-3 border-b border-white/[0.08] px-4 lg:px-5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-500/15 text-sm font-bold tracking-wide text-sky-300 ring-1 ring-sky-300/20">N</div>
            <div className="hidden min-w-0 lg:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">NWIS</div>
              <div className="mt-0.5 truncate text-sm font-semibold text-white">Well Intelligence</div>
            </div>
          </Link>

          <nav aria-label="Primary navigation" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 py-4 lg:px-3">
            {navigationGroups.map((group) => (
              <section key={group.label}>
                <h2 className="hidden px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.19em] text-slate-500 lg:block">{group.label}</h2>
                <div className="space-y-0.5">
                  {group.items.map(({ href, label, icon: Icon, planned, selectedWellPath }) => {
                    const target = selectedWellPath ? `/wells/${selectedWell.id}` : href;
                    const isActive = Boolean(target && (pathname === target || (target !== "/dashboard" && pathname.startsWith(target))));
                    const classes = `group flex min-h-9 items-center gap-3 rounded-md px-2.5 text-left text-[12px] font-medium transition-colors lg:px-3 ${
                      isActive
                        ? "bg-sky-400/10 text-sky-200 ring-1 ring-inset ring-sky-300/15"
                        : planned
                          ? "cursor-default text-slate-600"
                          : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
                    }`;
                    const content = (
                      <>
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-sky-300" : ""}`} />
                        <span className="hidden flex-1 truncate lg:block">{label}</span>
                        {planned && <span className="hidden text-[9px] uppercase tracking-wider text-slate-600 lg:block">Later</span>}
                      </>
                    );

                    return target ? (
                      <Link key={label} href={target} aria-current={isActive ? "page" : undefined} title={label} className={classes}>
                        {content}
                      </Link>
                    ) : (
                      <div key={label} aria-disabled="true" title={`${label} · planned milestone`} className={classes}>
                        {content}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>

          <div className="border-t border-white/[0.08] p-2 lg:p-3">
            <div className="flex items-center gap-2 rounded-md bg-white/[0.04] p-2.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-20" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
              </span>
              <div className="hidden min-w-0 lg:block">
                <div className="text-[10px] font-medium text-slate-300">Prototype environment</div>
                <div className="mt-0.5 text-[9px] text-slate-500">Sanitized fixture data</div>
              </div>
            </div>
            <div className="mt-2 hidden px-2 text-[9px] tracking-wide text-slate-600 lg:block">FLUID FUSION · OIL INDIA LIMITED</div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-[600] border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
            <div className="flex min-h-[62px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6 xl:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:block">Selected well</div>
                <label className="relative">
                  <span className="sr-only">Select current well</span>
                  <select
                    value={selectedWell.id}
                    onChange={(event) => {
                      const well = wells.find((item) => item.id === event.target.value);
                      if (well) {
                        setSelectedWellId(well.id);
                        setCurrentDepth(well.currentDepth);
                      }
                    }}
                    className="h-9 appearance-none rounded-md border border-slate-200 bg-slate-50 py-1 pl-3 pr-8 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15"
                  >
                    {wells.map((well) => <option key={well.id} value={well.id}>{well.id}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </label>
                <span className="hidden text-xs text-slate-500 sm:block">{selectedWell.location} <span className="mx-1 text-slate-300">/</span> {selectedWell.rig}</span>
                <span className="hidden h-4 w-px bg-slate-200 md:block" />
                <span className="hidden text-xs text-slate-500 md:block">{currentDepth.toLocaleString()} m MD</span>
                <span title={depthFormationPick ? `WX-07 reference depth pick at ${currentDepth} m` : "Well-level formation record; depth-specific pick unavailable"} className="hidden max-w-[200px] truncate rounded bg-[#eaf2ef] px-2 py-1 text-[10px] font-medium text-[#3a6759] xl:block">{depthFormationPick ? `PICK · ${formationContext}` : `WELL RECORD · ${formationContext}`}</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden items-center gap-2 rounded border border-slate-200 bg-white px-2.5 py-1.5 lg:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">Secure environment</span>
                </div>
                <span className="hidden rounded bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-slate-500 sm:block">Prototype data</span>
                <button aria-label="Notifications" className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-[#e9edea] text-[10px] font-semibold text-slate-700">EN</div>
                  <div className="hidden sm:block">
                    <div className="text-[11px] font-medium text-slate-800">Engineer</div>
                    <div className="text-[9px] uppercase tracking-[0.1em] text-slate-400">Role</div>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 xl:px-8">{children}</main>
        </div>
      </div>
      <EventEvidenceDrawer />
    </div>
  );
}
