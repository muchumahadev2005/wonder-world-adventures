import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileCode, Layers, Languages, Globe } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminApi, AdminLanguage, AdminLesson } from "@/lib/adminApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonsList?: AdminLesson[];
}

export default function ExportDialog({ open, onOpenChange, lessonsList = [] }: ExportDialogProps) {
  const { token } = useAuth();
  const [format, setFormat] = useState<"excel" | "json">("excel");
  const [scope, setScope] = useState<"all" | "single" | "language" | "level">("all");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [exporting, setExporting] = useState(false);

  // Load languages
  const { data: languages = [] } = useQuery<AdminLanguage[]>({
    queryKey: ["admin-languages-list"],
    queryFn: adminApi.getLanguages,
    enabled: open,
  });

  // Extract unique levels from lessons list for simplicity
  const levels = Array.from(new Set(lessonsList.map((l) => l.level?.code).filter(Boolean)));

  const handleExport = async () => {
    const params: { language?: string; level?: string; lessonId?: string } = {};

    if (scope === "single") {
      if (!selectedLessonId) {
        toast.error("Please select a lesson to export");
        return;
      }
      params.lessonId = selectedLessonId;
    } else if (scope === "language") {
      if (!selectedLanguage) {
        toast.error("Please select a language");
        return;
      }
      params.language = selectedLanguage;
    } else if (scope === "level") {
      if (!selectedLevel) {
        toast.error("Please select a learning level");
        return;
      }
      params.level = selectedLevel;
    }

    setExporting(true);
    try {
      if (format === "json") {
        const res = await adminApi.exportJson(params, token);
        if (res.success && res.data) {
          const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `lessons-export-${Date.now()}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success("JSON exported successfully");
        } else {
          toast.error("Failed to generate JSON export data");
        }
      } else {
        // Excel download
        const url = adminApi.exportExcelUrl(params, token);
        window.open(url, "_blank");
        toast.success("Excel export initiated");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white rounded-2xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            📥 Export Lessons Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Format Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">1. Select Output Format</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("excel")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  format === "excel"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setFormat("json")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  format === "json"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <FileCode className="w-4 h-4" /> JSON (.json)
              </button>
            </div>
          </div>

          {/* Scope Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">2. Select Export Scope</Label>
            <RadioGroup
              value={scope}
              onValueChange={(val: any) => setScope(val)}
              className="grid grid-cols-2 gap-2"
            >
              {[
                { value: "all", label: "All Lessons", desc: "Complete backup" },
                { value: "single", label: "Single Lesson", desc: "Select one below" },
                { value: "language", label: "By Language", desc: "Filter language" },
                { value: "level", label: "By Level", desc: "Filter level" },
              ].map((item) => (
                <Label
                  key={item.value}
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all hover:bg-slate-50/50 ${
                    scope === item.value ? "border-indigo-500 bg-slate-50" : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={item.value} id={`scope-${item.value}`} />
                    <span className="font-bold text-slate-800 text-xs">{item.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 pl-6">{item.desc}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Conditional dropdowns based on scope */}
          {scope === "single" && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <Label className="text-xs font-bold text-slate-600">Choose Lesson *</Label>
              <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Select lesson..." />
                </SelectTrigger>
                <SelectContent>
                  {lessonsList.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.title} ({l.lessonCode || "No Code"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {scope === "language" && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <Label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Select Language *
              </Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Select language..." />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((l) => (
                    <SelectItem key={l.id} value={l.code}>
                      {l.name} ({l.code.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {scope === "level" && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <Label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Select Level *
              </Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Select level..." />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((lvl) => (
                    <SelectItem key={lvl} value={lvl!}>
                      <span className="capitalize">{lvl}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 mt-2">
          <Button
            variant="outline"
            disabled={exporting}
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-slate-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow shadow-indigo-100 flex items-center gap-1.5 font-bold"
          >
            <Download className="w-4 h-4" /> {exporting ? "Exporting..." : "Download File"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
