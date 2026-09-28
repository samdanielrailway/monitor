"use client";

import { useCallback, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, FileText, FileType2, Loader2, Scan, Table2, Trash2, UploadCloud, X } from "lucide-react";
import { AppShell } from "@/components/layout-shell";
import { PageHeader } from "@/components/page-header";
import { useNwisWorkspace } from "@/components/nwis-workspace-context";
import { documents } from "@/lib/nwis-data";
import { parseDocumentFile } from "@/lib/document-parser";
import type { ParsedDocument } from "@/lib/document-parser";

const ACCEPT = ".pdf,.xlsx,.xls,.csv,.tsv,.docx,.txt,.md,.tif,.tiff,.png,.jpg,.jpeg";

const kindIcon = (kind: ParsedDocument["kind"]) => {
  if (kind === "Excel") return FileSpreadsheet;
  if (kind === "Word" || kind === "Text") return FileType2;
  if (kind === "Scan") return Scan;
  return FileText;
};

const statusTone: Record<string, string> = {
  Validated: "bg-emerald-100 text-emerald-700",
  Prototype: "bg-sky-100 text-sky-700",
  Pending: "bg-amber-100 text-amber-700",
};

export default function DocumentsPage() {
  const { ingestedDocuments, ingestDocuments, clearIngestedDocuments } = useNwisWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ name: string; index: number; total: number } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setError(null);
      setBusy(true);
      const files = Array.from(fileList);
      const parsed: ParsedDocument[] = [];

      for (const [index, file] of files.entries()) {
        setProgress({ name: file.name, index: index + 1, total: files.length });
        try {
          parsed.push(await parseDocumentFile(file));
        } catch (parseError) {
          setError(`${file.name}: ${parseError instanceof Error ? parseError.message : "could not be read"}`);
        }
      }

      if (parsed.length > 0) {
        ingestDocuments(
          parsed.map((item) => ({
            id: item.id,
            name: item.name,
            kind: item.kind === "Word" || item.kind === "Text" || item.kind === "Other" ? "PDF" : (item.kind as "WCR" | "DDR" | "Excel" | "PDF" | "Scan"),
            wellId: item.wellId,
            date: item.date,
            status: item.warnings.length === 0 ? "Validated" : "Pending",
            pages: item.pages,
            size: item.parser.split("·").pop()?.trim() ?? "",
            rows: item.rows,
            columns: item.columns,
            parser: item.parser,
            preview: item.preview,
            cells: item.cells,
            fields: item.fields,
            warnings: item.warnings,
            uploadedAt: new Date().toISOString(),
          })),
        );
        setOpenId(parsed[0].id);
      }

      setProgress(null);
      setBusy(false);
    },
    [ingestDocuments],
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Document Intelligence Center" subtitle="Prototype extraction and normalization workflow for well reports and daily drilling records." />

        {/* Upload */}
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void handleFiles(event.dataTransfer.files);
          }}
          className={`rounded-3xl border-2 border-dashed bg-white p-6 shadow-sm transition ${isDragging ? "border-sky-500 bg-sky-50/70" : "border-slate-300"}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-slate-700">
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${busy ? "bg-sky-100" : "bg-sky-50"}`}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin text-sky-700" /> : <UploadCloud className="h-5 w-5 text-sky-700" />}
              </span>
              <div>
                <div className="text-lg font-medium">Upload document set</div>
                <div className="mt-0.5 text-sm text-slate-500">
                  Drop files or browse · PDF · Excel · Word · CSV · TXT · scans — parsed in your browser, nothing is uploaded to a server
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPT}
                className="sr-only"
                onChange={(event) => {
                  void handleFiles(event.target.files);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Choose files
              </button>
              {ingestedDocuments.length > 0 && (
                <button
                  type="button"
                  onClick={clearIngestedDocuments}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {progress && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span className="min-w-0 flex-1 truncate">
                Parsing {progress.name} ({progress.index}/{progress.total})
              </span>
              <span className="h-1.5 w-32 overflow-hidden rounded-full bg-sky-200">
                <span className="block h-full rounded-full bg-sky-600 transition-all" style={{ width: `${(progress.index / progress.total) * 100}%` }} />
              </span>
            </div>
          )}

          {error && (
            <p className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Pipeline: <span className="font-semibold text-slate-700">read bytes</span> → unzip (XLSX/DOCX) or inflate content streams (PDF) → extract text/table rows → normalise
            fields (well, date, depth, mud weight, ROP, WOB) → validate → register in the workspace. Extraction is a prototype heuristic, not certified OCR.
          </p>
        </div>

        {/* Ingested this session */}
        {ingestedDocuments.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Ingested this session
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{ingestedDocuments.length}</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {ingestedDocuments.map((doc) => {
                const isOpen = openId === doc.id;
                return (
                  <div key={doc.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{doc.name}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {doc.kind} · {doc.wellId} · {doc.date}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusTone[doc.status]}`}>{doc.status}</span>
                    </div>

                    <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                      {[
                        ["Size", doc.size],
                        ["Rows", String(doc.rows)],
                        ["Cols", String(doc.columns)],
                        ["Units", String(doc.pages)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-slate-50 px-1 py-1.5">
                          <dt className="text-[9px] uppercase tracking-wide text-slate-500">{label}</dt>
                          <dd className="text-[12px] font-semibold tabular-nums text-slate-800">{value}</dd>
                        </div>
                      ))}
                    </dl>

                    <p className="mt-2 truncate font-mono text-[10px] text-slate-400" title={doc.parser}>
                      {doc.parser}
                    </p>

                    {doc.warnings.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {doc.warnings.map((warning) => (
                          <li key={warning} className="flex items-start gap-1.5 text-[11px] text-amber-800">
                            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    )}

                    {doc.fields.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {doc.fields.map((field) => (
                          <span key={field.label} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px]">
                            <span className="font-semibold text-slate-500">{field.label}</span>
                            <span className="font-bold text-slate-800">{field.value}</span>
                            <span
                              className={`text-[8px] font-bold uppercase ${
                                field.confidence === "HIGH" ? "text-emerald-600" : field.confidence === "MEDIUM" ? "text-amber-600" : "text-rose-600"
                              }`}
                            >
                              {field.confidence}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : doc.id)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    >
                      {isOpen ? <X className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
                      {isOpen ? "Hide extracted data" : "Show extracted data"}
                    </button>

                    {isOpen && (
                      <div className="mt-2 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                        {doc.cells.length > 1 ? (
                          <table className="w-full border-collapse text-left text-[10px]">
                            <tbody>
                              {doc.cells.slice(0, 40).map((row, rowIndex) => (
                                <tr key={rowIndex} className={rowIndex === 0 ? "bg-slate-200/70 font-semibold" : "border-t border-slate-200"}>
                                  {row.slice(0, 8).map((cell, cellIndex) => (
                                    <td key={cellIndex} className="max-w-[120px] truncate px-1.5 py-1 align-top text-slate-700" title={cell}>
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <pre className="whitespace-pre-wrap break-words font-mono text-[10px] leading-4 text-slate-700">{doc.preview || "No text layer extracted."}</pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Fixture corpus */}
        <section>
          <div className="mb-3 text-sm font-semibold text-slate-800">
            Reference corpus
            <span className="ml-2 text-xs font-normal text-slate-500">sanitized fixture documents bundled with the prototype</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {documents.map((doc) => {
              const Icon = kindIcon(doc.kind as ParsedDocument["kind"]);
              return (
                <div key={doc.name} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-sky-700" />
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-700">{doc.status}</span>
                  </div>
                  <div className="mt-4 text-lg font-semibold text-slate-900">{doc.name}</div>
                  <div className="mt-2 text-sm text-slate-500">{doc.kind} • {doc.wellId}</div>
                  <div className="mt-3 text-sm text-slate-600">Pages: {doc.pages}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
