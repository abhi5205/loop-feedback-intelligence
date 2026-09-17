"use client";

import { useState } from "react";
import { X, UploadCloud, FileText, AlertCircle, CheckCircle2, Download, AlertTriangle } from "lucide-react";

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CsvUploadModal({ isOpen, onClose, onSuccess }: CsvUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    successCount: number;
    failureCount: number;
    errors: Array<{ row: number; reason: string }>;
  } | null>(null);

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    const sampleCsv = `content,customerName,customerEmail,channel,status
"The real-time latency on webhooks is incredible. Sub 50ms!",Alex Rivera,alex@example.com,EMAIL,NEW
"CSV export for 50k rows times out with a 504 error.",Sophia Zhang,sophia@example.com,WEB_FORM,NEW
"Bad",Charlie Brown,charlie@example.com,SURVEY,NEW
"Dark mode contrast is really gentle on my eyes. Outstanding UI redesign.",Marcus Vance,marcus@example.com,INTERCOM,REVIEWED
"Invoice PDF has missing VAT tax breakdown for EU accounting.",Elena Rostova,elena@example.com,EMAIL,NEW`;

    const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "loop_sample_feedback.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const text = await file.text();
      const res = await fetch("/api/feedback/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to process CSV import");
      } else {
        setResult({
          successCount: data.successCount,
          failureCount: data.failureCount,
          errors: data.errors || [],
        });
        if (data.successCount > 0 && data.failureCount === 0) {
          setTimeout(() => {
            onClose();
            if (onSuccess) onSuccess();
            else window.location.reload();
          }, 1500);
        }
      }
    } catch {
      setError("Network error uploading CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-white max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Bulk CSV Ingestion</h2>
            <p className="text-xs text-slate-400">Fault-tolerant batch import with partial failure handling</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs text-slate-300">
          <span>Need a template to test?</span>
          <button
            onClick={handleDownloadSample}
            type="button"
            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            Download Sample CSV
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mb-4 space-y-3">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">{result.successCount} feedback rows imported successfully</span>
              </div>
            </div>

            {result.failureCount > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>{result.failureCount} rows skipped due to validation errors (partial success)</span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 pl-6">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-[11px] text-amber-200/80">
                      &bull; Row {err.row}: {err.reason}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/40 transition">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer block">
              <FileText className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              {file ? (
                <div>
                  <p className="text-sm font-semibold text-indigo-400">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-300">Click to browse or drop CSV file</p>
                  <p className="text-xs text-slate-500 mt-1">Supports content, customerName, customerEmail, channel, status</p>
                </div>
              )}
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-300 transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!file || loading}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing CSV...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Start Import</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
