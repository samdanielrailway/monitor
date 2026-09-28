import Link from "next/link";
import { ArrowUpRight, Drill, MapPin } from "lucide-react";
import type { Well } from "@/lib/nwis-data";

export function WellCard({ well }: { well: Well }) {
  return (
    <Link href={`/wells/${well.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{well.location}</div>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">{well.id}</h3>
        </div>
        <div className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-sky-700">
          {well.status}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {well.profile}</div>
        <div className="flex items-center gap-2"><Drill className="h-4 w-4" /> Target {well.targetDepth} m / Actual {well.actualDepth} m</div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
        <span className="text-slate-500">Formation</span>
        <span className="font-medium text-slate-900">{well.formation}</span>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-sky-700">
        <span>Open profile</span>
        <ArrowUpRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
