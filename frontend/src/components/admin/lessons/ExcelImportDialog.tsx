import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Upload, AlertTriangle, CheckCircle2, AlertCircle, RefreshCw, HelpCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "@/context/AuthContext";
import { adminApi } from "@/lib/adminApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExcelImportDialog({ open, onOpenChange }: ExcelImportDialogProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{
    lessons: any[];
    cards: any[];
    quiz: any[];
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("preview");

  const importMutation = useMutation({
    mutationFn: (f: File) => adminApi.importExcel(f, token),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-import-history"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });

      const successMsg = `Successfully imported ${res.success?.length || 0} lessons.`;
      const failedMsg = res.errors?.length > 0 ? ` Failed to import ${res.errors.length} lessons.` : "";
      
      if (res.errors?.length > 0) {
        toast.warning(successMsg + failedMsg);
      } else {
        toast.success(successMsg);
      }
      
      handleReset();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to import Excel spreadsheet");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      toast.error("Please select a valid Excel spreadsheet (.xlsx or .xls)");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const lessonsSheet = workbook.Sheets["Lessons"] || workbook.Sheets[workbook.SheetNames[0]];
        const cardsSheet = workbook.Sheets["Cards"] || workbook.Sheets[workbook.SheetNames[1]];
        const quizSheet = workbook.Sheets["Quiz"] || workbook.Sheets[workbook.SheetNames[2]];

        const lessons = lessonsSheet ? XLSX.utils.sheet_to_json(lessonsSheet) : [];
        const cards = cardsSheet ? XLSX.utils.sheet_to_json(cardsSheet) : [];
        const quiz = quizSheet ? XLSX.utils.sheet_to_json(quizSheet) : [];

        // Simple validation checks
        const errors: string[] = [];
        if (lessons.length === 0) {
          errors.push("The 'Lessons' sheet is empty or missing.");
        }

        lessons.forEach((l: any, idx) => {
          const rowNum = idx + 2;
          const name = l.lesson_name || l.title || l.name;
          if (!name) errors.push(`Row ${rowNum} in Lessons sheet: Missing 'lesson_name' or 'title'.`);
          if (!l.language && !l.lang) errors.push(`Row ${rowNum} in Lessons sheet: Missing 'language' code (e.g., en, hi).`);
          if (!l.level) errors.push(`Row ${rowNum} in Lessons sheet: Missing 'level' code (e.g., beginner, expert).`);
        });

        setValidationErrors(errors);
        setParsedData({ lessons, cards, quiz });
      } catch (err: any) {
        toast.error(`Error reading file: ${err.message}`);
        handleReset();
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = () => {
    if (!file) return;
    importMutation.mutate(file);
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setValidationErrors([]);
    setActiveTab("preview");
  };

  const downloadTemplate = () => {
    // Direct link to download Excel template from backend
    const url = adminApi.downloadExcelTemplateUrl(token);
    window.open(url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!importMutation.isPending) onOpenChange(v); }}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-6 bg-white rounded-2xl shadow-2xl border border-slate-100">
        <DialogHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Excel Lesson Import
          </DialogTitle>
          <Button
            variant="ghost"
            onClick={downloadTemplate}
            className="text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg h-8 px-3 ml-auto mr-4 flex items-center gap-1 font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Download Template
          </Button>
        </DialogHeader>

        {!parsedData ? (
          /* File Upload Zone */
          <div className="flex-1 flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 my-6 transition-all hover:bg-slate-50 group">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              id="excel-uploader"
              className="hidden"
            />
            <label
              htmlFor="excel-uploader"
              className="flex flex-col items-center cursor-pointer text-center max-w-sm space-y-3"
            >
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Upload Excel Spreadsheet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Drag and drop your spreadsheet here or click to browse files
                </p>
              </div>
              <p className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded font-mono">
                Supports .xlsx and .xls
              </p>
            </label>
          </div>
        ) : (
          /* Verification & Preview Tabs */
          <div className="flex-1 flex flex-col min-h-[400px] overflow-hidden my-4">
            {validationErrors.length > 0 ? (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 flex items-start gap-2.5 max-h-[140px] overflow-y-auto">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-800">
                    Validation Warnings ({validationErrors.length})
                  </h4>
                  <ul className="text-[11px] text-rose-700 mt-1.5 list-disc list-inside space-y-0.5">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-4 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="text-xs text-emerald-800 font-semibold">
                  Client-side validation passed! Ready to import {parsedData.lessons.length} lessons,{" "}
                  {parsedData.cards.length} cards, and {parsedData.quiz.length} quiz questions.
                </div>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="bg-slate-100 p-1 rounded-xl self-start mb-3">
                <TabsTrigger value="preview" className="rounded-lg text-xs font-semibold">
                  Lessons ({parsedData.lessons.length})
                </TabsTrigger>
                <TabsTrigger value="cards" className="rounded-lg text-xs font-semibold">
                  Cards ({parsedData.cards.length})
                </TabsTrigger>
                <TabsTrigger value="quiz" className="rounded-lg text-xs font-semibold">
                  Quiz Questions ({parsedData.quiz.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto border border-slate-150 rounded-xl">
                <TabsContent value="preview" className="m-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-xs font-bold">Code</TableHead>
                        <TableHead className="text-xs font-bold">Lesson Name</TableHead>
                        <TableHead className="text-xs font-bold">Language</TableHead>
                        <TableHead className="text-xs font-bold">Level</TableHead>
                        <TableHead className="text-xs font-bold text-center">Premium</TableHead>
                        <TableHead className="text-xs font-bold">Tags</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.lessons.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-mono">{row.lesson_code || row.lessonCode || "—"}</TableCell>
                          <TableCell className="text-xs font-semibold text-slate-800">{row.lesson_name || row.title}</TableCell>
                          <TableCell className="text-xs">{row.language || row.lang}</TableCell>
                          <TableCell className="text-xs font-medium capitalize">{row.level}</TableCell>
                          <TableCell className="text-xs text-center">{String(row.premium).toLowerCase() === "true" ? "👑 Yes" : "No"}</TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-xs truncate">{row.tags || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="cards" className="m-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-xs font-bold">Lesson Code</TableHead>
                        <TableHead className="text-xs font-bold">Title (Word)</TableHead>
                        <TableHead className="text-xs font-bold">Subtitle</TableHead>
                        <TableHead className="text-xs font-bold">Description</TableHead>
                        <TableHead className="text-xs font-bold text-center">Emoji</TableHead>
                        <TableHead className="text-xs font-bold">Image URL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.cards.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-mono">{row.lesson_code || row.lessonCode || "—"}</TableCell>
                          <TableCell className="text-xs font-semibold text-slate-800">{row.title || row.word}</TableCell>
                          <TableCell className="text-xs">{row.subtitle || row.translit || "—"}</TableCell>
                          <TableCell className="text-xs text-slate-600 max-w-xs truncate">{row.description || row.meaning || "—"}</TableCell>
                          <TableCell className="text-xs text-center text-lg">{row.emoji || "—"}</TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-xs truncate">{row.image_url || row.imageUrl || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="quiz" className="m-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-xs font-bold">Lesson Code</TableHead>
                        <TableHead className="text-xs font-bold">Question</TableHead>
                        <TableHead className="text-xs font-bold">Options</TableHead>
                        <TableHead className="text-xs font-bold">Answer</TableHead>
                        <TableHead className="text-xs font-bold">Explanation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.quiz.map((row, idx) => {
                        const opts = [row.option_a, row.option_b, row.option_c, row.option_d].filter(Boolean);
                        return (
                          <TableRow key={idx}>
                            <TableCell className="text-xs font-mono">{row.lesson_code || row.lessonCode || "—"}</TableCell>
                            <TableCell className="text-xs font-semibold text-slate-800">{row.question}</TableCell>
                            <TableCell className="text-xs text-slate-600">{opts.join(" | ") || "—"}</TableCell>
                            <TableCell className="text-xs font-bold text-emerald-600">{row.correct_answer || row.answer}</TableCell>
                            <TableCell className="text-xs text-slate-500 max-w-xs truncate">{row.explanation || "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
          {parsedData ? (
            <Button
              variant="outline"
              disabled={importMutation.isPending}
              onClick={handleReset}
              className="rounded-xl border-slate-200 text-slate-500 flex items-center gap-1 mr-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Start Over
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={importMutation.isPending}
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            {parsedData && (
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow shadow-emerald-100 flex items-center gap-1.5 font-bold"
              >
                {importMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Import Spreadsheet
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
