"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f5f4] p-6 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">NWIS</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Opening the command center…</h1>
        <p className="mt-2 text-sm text-slate-500">Nearby Wells Intelligence System</p>
        <Link
          href="/dashboard"
          className="mt-5 inline-block rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
