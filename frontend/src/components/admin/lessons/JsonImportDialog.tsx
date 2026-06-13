import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileCode, Upload, Braces, Play, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminApi } from "@/lib/adminApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface JsonImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function JsonImportDialog({ open, onOpenChange }: JsonImportDialogProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [jsonText, setJsonText] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const importMutation = useMutation({
    mutationFn: (data: any) => adminApi.importJson(data, token),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-import-history"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });

      const msg = `Successfully imported ${res.successCount || 0} lessons.`;
      if (res.failureCount > 0) {
        toast.warning(`${msg} Failed to import ${res.failureCount} entries.`);
      } else {
        toast.success(msg);
      }

      handleReset();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to import JSON data");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Please select a valid JSON file (.json)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setJsonText(text);
      validateJsonString(text);
    };
    reader.readAsText(file);
  };

  const validateJsonString = (str: string) => {
    setErrorMsg(null);
    setParsedData(null);

    if (!str.trim()) {
      setErrorMsg("JSON content is empty");
      return;
    }

    try {
      const obj = JSON.parse(str);
      if (!obj.lessons || !Array.isArray(obj.lessons)) {
        setErrorMsg("Root object must contain a 'lessons' array.");
        return;
      }
      if (obj.lessons.length === 0) {
        setErrorMsg("'lessons' array cannot be empty.");
        return;
      }

      // Check fields of first item as simple validation
      const first = obj.lessons[0];
      if (!first.title) {
        setErrorMsg("Each lesson entry in the array must contain a 'title' field.");
        return;
      }
      if (!first.language) {
        setErrorMsg("Each lesson entry must contain a 'language' code.");
        return;
      }
      if (!first.level) {
        setErrorMsg("Each lesson entry must contain a 'level' code.");
        return;
      }

      setParsedData(obj);
    } catch (err: any) {
      setErrorMsg(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleImport = () => {
    if (!parsedData) return;
    importMutation.mutate(parsedData);
  };

  const handleReset = () => {
    setJsonText("");
    setParsedData(null);
    setErrorMsg(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!importMutation.isPending) onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 bg-white rounded-2xl shadow-2xl border border-slate-100">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-600" />
            JSON Lesson Import
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row gap-6 my-4 overflow-hidden min-h-[360px]">
          {/* Input Panel */}
          <div className="flex-1 flex flex-col gap-3 h-full">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600">Paste JSON Content</span>
              <label className="text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg font-semibold cursor-pointer flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" /> Upload JSON File
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            
            <Textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                validateJsonString(e.target.value);
              }}
              placeholder={`{\n  "lessons": [\n    {\n      "lessonCode": "ENG-001",\n      "title": "Numbers 1-5",\n      "language": "en",\n      "level": "beginner",\n      "cards": [],\n      "quiz": []\n    }\n  ]\n}`}
              className="font-mono text-[11px] leading-relaxed flex-1 bg-slate-900 text-indigo-200 border-none rounded-xl p-4 focus:ring-2 focus:ring-indigo-500/20 shadow-inner resize-none min-h-[250px]"
            />
          </div>

          {/* Validation & Preview Panel */}
          <div className="w-full md:w-80 flex flex-col bg-slate-50 border border-slate-100 rounded-2xl p-4 overflow-y-auto">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Braces className="w-4 h-4 text-slate-500" /> Verification Result
            </h3>

            {errorMsg ? (
              <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl flex gap-2 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="leading-normal">{errorMsg}</p>
              </div>
            ) : parsedData ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl flex gap-2 text-emerald-800 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p>JSON Syntax Validated</p>
                  </div>

                  <div className="bg-white border border-slate-200/60 p-4 rounded-xl space-y-3 text-xs shadow-sm">
                    <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1.5">Lessons Summary</h4>
                    <div className="space-y-2 text-slate-600">
                      <p className="flex justify-between">
                        <span>Total Lessons:</span>
                        <span className="font-bold text-slate-800">{parsedData.lessons.length}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Flashcards:</span>
                        <span className="font-bold text-slate-800">
                          {parsedData.lessons.reduce((sum: number, l: any) => sum + (l.cards?.length || 0), 0)}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>Quiz Questions:</span>
                        <span className="font-bold text-slate-800">
                          {parsedData.lessons.reduce((sum: number, l: any) => sum + (l.quiz?.length || 0), 0)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-200/60 pt-3">
                  ⚠️ Existing items with the same `lessonCode` will throw an error. Status will default to `draft`.
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10 text-center">
                <span className="text-2xl mb-2">💡</span>
                <p className="text-xs">Paste JSON text or upload a file to run the validator and view data.</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            disabled={importMutation.isPending}
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-slate-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsedData || importMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow shadow-indigo-100 flex items-center gap-1.5 font-bold"
          >
            {importMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Start Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
