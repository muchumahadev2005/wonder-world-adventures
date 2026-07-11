import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet, Upload, CheckCircle2, AlertTriangle,
  RefreshCw, HelpCircle, X, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminApi } from "@/lib/adminApi";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Constants ─────────────────────────────────────────────────────
const REQUIRED_COLS = ["title", "content"];
const ALL_COLS = [
  "title", "subtitle", "description", "content", "author",
  "category", "language", "age_group", "difficulty",
  "reading_time", "listening_time", "premium", "published",
  "featured", "trending", "recommended", "read_aloud",
  "narrator_voice", "xp_reward", "star_reward", "tags", "cover_image_url",
];

// ── Types ─────────────────────────────────────────────────────────
interface PreviewRow {
  rowNum: number;
  title: string;
  category: string;
  language: string;
  premium: boolean;
  published: boolean;
  coverImage: string;
  errors: string[];
  raw: Record<string, unknown>;
}

interface ImportResult {
  total: number;
  success: Array<{ id: string; title: string; slug: string }>;
  errors: Array<{ rowNum?: number; title?: string; errors?: string[]; error?: string }>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getVal = (row: Record<string, unknown>, possibleKeys: string[]) => {
  for (const k of Object.keys(row)) {
    const cleanK = k.trim().toLowerCase().replace(/[\s_-]+/g, "");
    for (const pk of possibleKeys) {
      const cleanPk = pk.toLowerCase().replace(/[\s_-]+/g, "");
      if (cleanK === cleanPk) {
        return row[k];
      }
    }
  }
  return undefined;
};

const parseBool = (v: unknown, fallback = false): boolean => {
  if (typeof v === "boolean") return v;
  if (v === undefined || v === null) return fallback;
  const s = String(v).trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes" || s === "y") return true;
  if (s === "false" || s === "0" || s === "no" || s === "n") return false;
  return fallback;
};

const normalizeRow = (row: Record<string, unknown>) => {
  const get = (keys: string[], fallback: any = "") => {
    const val = getVal(row, keys);
    return val !== undefined && val !== null ? val : fallback;
  };

  return {
    title:            String(get(["title"])).trim(),
    subtitle:         String(get(["subtitle"])).trim(),
    description:      String(get(["description", "desc"])).trim(),
    content:          String(get(["content"])).trim(),
    author:           String(get(["author"])).trim(),
    category:         String(get(["category"])).trim(),
    language:         String(get(["language", "lang", "languageCode", "language_code"])).trim(),
    ageGroup:         String(get(["ageGroup", "age_group", "age group"])).trim(),
    difficulty:       String(get(["difficulty", "diff"])).trim(),
    readingTime:      get(["readingTime", "reading_time", "reading time"], null),
    listeningTime:    get(["listeningTime", "listening_time", "listening time"], null),
    premium:          get(["premium", "isPremium", "is_premium", "is premium"], false),
    published:        get(["published", "isPublished", "is_published", "is published"], false),
    featured:         get(["featured", "isFeatured", "is_featured", "is featured"], false),
    trending:         get(["trending", "isTrending", "is_trending", "is trending"], false),
    recommended:      get(["recommended", "isRecommended", "is_recommended", "is recommended"], false),
    readAloudEnabled: get(["readAloudEnabled", "read_aloud_enabled", "read_aloud", "read aloud"], false),
    narratorVoice:    String(get(["narratorVoice", "narrator_voice", "narrator voice"])).trim(),
    xpReward:         get(["xpReward", "xp_reward", "xp reward"], 0),
    starsReward:      get(["starsReward", "stars_reward", "stars reward", "starReward", "star_reward", "star reward"], 0),
    tags:             String(get(["tags"])).trim(),
    coverImageUrl:    String(get(["coverImageUrl", "cover_image_url", "cover image url", "coverImage", "cover_image", "cover image"])).trim(),
  };
};

// ── Component ─────────────────────────────────────────────────────
export default function ExcelImportStoriesDialog({ open, onOpenChange }: Props) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef  = useRef<HTMLDivElement>(null);

  const [file,        setFile]        = useState<File | null>(null);
  const [preview,     setPreview]     = useState<PreviewRow[] | null>(null);
  const [isDragging,  setIsDragging]  = useState(false);
  const [importResult,setImportResult]= useState<ImportResult | null>(null);

  // ── Import mutation ───────────────────────────────────────────
  const importMutation = useMutation({
    mutationFn: (f: File) => adminApi.importStoriesExcel(f, token),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-stories"] });
      setImportResult(res);
      if ((res.errors?.length ?? 0) === 0) {
        toast.success(`Successfully imported ${res.success?.length ?? 0} stories.`);
      } else {
        toast.warning(`Imported ${res.success?.length ?? 0} stories. ${res.errors?.length ?? 0} rows had errors.`);
      }
    },
    onError: (err: Error) => toast.error(err.message || "Import failed"),
  });

  // ── File parsing ──────────────────────────────────────────────
  const processFile = useCallback((f: File) => {
    if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }
    setFile(f);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data     = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet    = workbook.Sheets["Stories"] || workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, unknown>[] = sheet ? XLSX.utils.sheet_to_json(sheet) : [];

        const previewed: PreviewRow[] = rows.map((rawRow, idx) => {
          const row     = normalizeRow(rawRow);
          const errors: string[] = [];
          const title   = row.title;
          const content = row.content;
          if (!title)   errors.push("Title is required");
          if (!content) errors.push("Content is required");

          return {
            rowNum:    idx + 2,
            title:     title || `Row ${idx + 2}`,
            category:  row.category,
            language:  row.language,
            premium:   parseBool(row.premium),
            published: parseBool(row.published),
            coverImage:row.coverImageUrl,
            errors,
            raw: { ...rawRow, content: row.content }, // Keep normalized content for table display
          };
        });
        setPreview(previewed);
      } catch (err: any) {
        toast.error(`Could not read file: ${err.message}`);
        handleReset();
      }
    };
    reader.readAsArrayBuffer(f);
  }, []);

  // ── Drag & drop ───────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = () => {
    if (!file) return;
    importMutation.mutate(file);
  };

  const downloadTemplate = () => {
    window.open(adminApi.downloadStoriesTemplateUrl(token), "_blank");
  };

  const validRows   = preview?.filter((r) => r.errors.length === 0) ?? [];
  const invalidRows = preview?.filter((r) => r.errors.length > 0)   ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => { if (!importMutation.isPending) onOpenChange(v); }}
    >
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* ── Header ──────────────────────────────────────────── */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Bulk Import Stories from Excel
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadTemplate}
            className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg h-8 px-3 flex items-center gap-1 font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Download Template
          </Button>
        </DialogHeader>

        {/* ── Body ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">

          {/* Result view (after import) */}
          {importResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-sm font-semibold text-emerald-800">
                  {importResult.success?.length ?? 0} of {importResult.total} stories imported successfully.
                </p>
              </div>
              {(importResult.errors?.length ?? 0) > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-1 max-h-48 overflow-y-auto">
                  <p className="text-xs font-bold text-rose-700 mb-2">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {importResult.errors.length} rows failed:
                  </p>
                  {importResult.errors.map((e, i) => (
                    <div key={i} className="text-xs text-rose-700">
                      <span className="font-semibold">{e.title || `Row ${e.rowNum}`}:</span>{" "}
                      {(e.errors ?? [e.error ?? "Unknown error"]).join(", ")}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload zone — shown when no file selected yet */}
          {!preview && !importResult && (
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                flex flex-col items-center justify-center gap-4 p-12
                border-2 border-dashed rounded-2xl cursor-pointer
                transition-all duration-200
                ${isDragging
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-200 ${isDragging ? "scale-110 bg-indigo-100" : "bg-emerald-50"}`}>
                <Upload className={`w-7 h-7 ${isDragging ? "text-indigo-500" : "text-emerald-500"}`} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">
                  {isDragging ? "Drop your file here" : "Drag & drop your Excel file"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  or click to browse files
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                .xlsx · .xls · max 10 MB
              </span>
            </div>
          )}

          {/* Preview Table */}
          {preview && !importResult && (
            <div className="space-y-4">
              {/* Summary banners */}
              {invalidRows.length > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-amber-800">
                    {invalidRows.length} row{invalidRows.length > 1 ? "s" : ""} have validation errors.
                    Fix them in Excel and re-upload. Import will be aborted if any row is invalid.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs font-semibold text-emerald-800">
                    All {validRows.length} row{validRows.length !== 1 ? "s" : ""} passed client-side validation. Ready to import.
                  </p>
                </div>
              )}

              {/* File info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">{file?.name}</span>
                  <span>·</span>
                  <span>{preview.length} rows</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-slate-500 h-7 px-2">
                  <X className="w-3.5 h-3.5 mr-1" /> Remove
                </Button>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-600 w-8">#</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-600 w-16">Cover</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Title</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Content</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Category</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Language</th>
                        <th className="text-center px-4 py-2.5 font-semibold text-slate-600">Premium</th>
                        <th className="text-center px-4 py-2.5 font-semibold text-slate-600">Published</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preview.map((row) => (
                        <tr
                          key={row.rowNum}
                          className={row.errors.length > 0 ? "bg-rose-50/60" : "hover:bg-slate-50/60"}
                        >
                          <td className="px-4 py-2.5 text-slate-400 font-mono">{row.rowNum}</td>
                          <td className="px-4 py-2.5">
                            {row.coverImage ? (
                              <img
                                src={row.coverImage}
                                alt=""
                                className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-base">
                                📚
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-slate-800 max-w-[150px] truncate">{row.title}</td>
                          <td className="px-4 py-2.5 text-slate-500 max-w-[200px] truncate" title={String(row.raw.content ?? "")}>
                            {String(row.raw.content ?? "") || "—"}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">{row.category || "—"}</td>
                          <td className="px-4 py-2.5 text-slate-600 uppercase text-[11px] font-mono">{row.language || "—"}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${row.premium ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                              {row.premium ? "Premium" : "Free"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${row.published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                              {row.published ? "Yes" : "Draft"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            {row.errors.length > 0 ? (
                              <div className="flex items-start gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                <ul className="text-rose-600 space-y-0.5">
                                  {row.errors.map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                              </div>
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <DialogFooter className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div>
            {preview && !importResult && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={importMutation.isPending}
                className="text-slate-500 border-slate-200 rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Start Over
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { onOpenChange(false); handleReset(); }}
              disabled={importMutation.isPending}
              className="rounded-xl border-slate-200"
            >
              {importResult ? "Close" : "Cancel"}
            </Button>

            {preview && !importResult && (
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending || invalidRows.length > 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-200 flex items-center gap-1.5 font-bold"
              >
                {importMutation.isPending ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Importing…</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Import {validRows.length} Stories</>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
