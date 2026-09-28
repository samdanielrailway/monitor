import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function PageHeader({ title, subtitle, backHref }: { title: string; subtitle?: string; backHref?: string }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-sky-700">
          {backHref ? (
            <Link href={backHref} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          ) : null}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}
