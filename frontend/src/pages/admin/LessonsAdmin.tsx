import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Plus,
  FileSpreadsheet,
  FileCode,
  Download,
  Search,
  Filter,
  Eye,
  Edit2,
  Copy,
  Archive,
  RefreshCcw,
  Trash2,
  History,
  Crown,
  BookOpen,
  HelpCircle,
  BarChart3,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { adminApi, AdminLesson } from "@/lib/adminApi";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

// Import custom CMS Dialog components
import ExcelImportDialog from "@/components/admin/lessons/ExcelImportDialog";
import JsonImportDialog from "@/components/admin/lessons/JsonImportDialog";
import ExportDialog from "@/components/admin/lessons/ExportDialog";
import VersionHistory from "@/components/admin/lessons/VersionHistory";
import LessonPreview from "@/components/admin/lessons/LessonPreview";

const STATUS_BADGES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  review: "bg-blue-50 text-blue-700 border-blue-200",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-rose-50 text-rose-700 border-rose-200",
};

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  beginner: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  intermediate: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  expert: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

export default function LessonsAdmin() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filters state
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPremium, setFilterPremium] = useState("all");
  const [page, setPage] = useState(1);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Dialog open controls
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Focus resource items for modals
  const [selectedLessonForHistory, setSelectedLessonForHistory] = useState<AdminLesson | null>(null);
  const [selectedLessonForPreview, setSelectedLessonForPreview] = useState<AdminLesson | null>(null);

  // Load languages list for filters
  const { data: languages = [] } = useQuery({
    queryKey: ["admin-languages-list"],
    queryFn: adminApi.getLanguages,
  });

  // Query paginated lessons list
  const { data: lessonsData, isLoading } = useQuery({
    queryKey: ["admin-lessons", page, search, filterLang, filterLevel, filterStatus, filterPremium],
    queryFn: () =>
      adminApi.getAdminLessons(token, {
        page,
        limit: 10,
        search: search.trim() || undefined,
        language: filterLang === "all" ? undefined : filterLang,
        level: filterLevel === "all" ? undefined : filterLevel,
        status: filterStatus === "all" ? undefined : filterStatus,
        premium: filterPremium === "all" ? undefined : filterPremium === "premium",
      }),
  });

  // Load analytics counts & chart distributions
  const { data: analytics } = useQuery({
    queryKey: ["admin-content-analytics"],
    queryFn: () => adminApi.getContentAnalytics(token),
  });

  // Action mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteLesson(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-content-analytics"] });
      toast.success("Lesson deleted successfully");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete lesson"),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => adminApi.duplicateLesson(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-content-analytics"] });
      toast.success("Lesson duplicated as draft");
    },
    onError: (err: any) => toast.error(err.message || "Failed to duplicate lesson"),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => adminApi.publishLesson(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-content-analytics"] });
      toast.success("Lesson published successfully");
    },
    onError: (err: any) => toast.error(err.message || "Failed to publish lesson"),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => adminApi.archiveLesson(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-content-analytics"] });
      toast.success("Lesson archived");
    },
    onError: (err: any) => toast.error(err.message || "Failed to archive lesson"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => adminApi.restoreLesson(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-content-analytics"] });
      toast.success("Lesson restored to draft");
    },
    onError: (err: any) => toast.error(err.message || "Failed to restore lesson"),
  });

  const lessons = lessonsData?.lessons || [];
  const totalLessons = lessonsData?.total || 0;
  const totalPages = lessonsData?.pages || 1;

  const handleOpenVersions = (lesson: AdminLesson) => {
    setSelectedLessonForHistory(lesson);
    setShowVersionHistory(true);
  };

  const handleOpenPreview = async (lesson: AdminLesson) => {
    try {
      const fullRes = await adminApi.getAdminLesson(lesson.id, token);
      setSelectedLessonForPreview(fullRes.lesson);
      setShowPreview(true);
    } catch {
      toast.error("Failed to load preview details");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">📚</span>
              Lesson CMS Platform
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Author vocabulary flashcards, interactive multi-choice quizzes, track version releases, and perform bulk imports.
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`rounded-xl border-slate-200 flex items-center gap-1.5 ${
                showAnalytics ? "bg-slate-100 font-bold" : ""
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              {showAnalytics ? "Hide Analytics" : "Show Analytics"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowExcelImport(true)}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Import Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowJsonImport(true)}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <FileCode className="w-4 h-4 text-indigo-500" /> Import JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowExport(true)}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-500" /> Export Data
            </Button>
            <Button
              onClick={() => navigate("/admin/lessons/create")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 flex items-center gap-1.5 font-bold"
            >
              <Plus className="w-4 h-4" /> Create Lesson
            </Button>
          </div>
        </div>

        {/* Analytics Dashboard Panels */}
        <AnimatePresence>
          {showAnalytics && analytics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Lessons", value: analytics.totalLessons, color: "text-indigo-600", bg: "bg-indigo-50" },
                  { label: "Flashcards", value: analytics.totalCards, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Quiz Questions", value: analytics.totalQuizQuestions, color: "text-purple-600", bg: "bg-purple-50" },
                  { label: "Published Status", value: `${analytics.publishedLessons} / ${analytics.totalLessons}`, color: "text-sky-600", bg: "bg-sky-50" },
                  { label: "Premium Gated", value: `${analytics.premiumLessons} / ${analytics.totalLessons}`, color: "text-amber-600", bg: "bg-amber-50" },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
                    <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center font-black text-base ${stat.color}`}>
                      {stat.value}
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 leading-normal">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Charts distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Language chart */}
                <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lessons Distribution by Language</h3>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.byLanguage}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Level chart */}
                <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lessons Distribution by Level</h3>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.byLevel}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
          <div className="relative col-span-1 md:col-span-1 flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, code..."
              className="pl-11 h-10 border-slate-200 focus:border-indigo-500 bg-slate-50/30 rounded-xl text-xs"
            />
          </div>

          <Select
            value={filterLang}
            onValueChange={(val) => {
              setFilterLang(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 border-slate-200 bg-white rounded-xl text-xs">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌐 All Languages</SelectItem>
              {languages.map((l) => (
                <SelectItem key={l.id} value={l.code}>
                  {l.name} ({l.code.toUpperCase()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterLevel}
            onValueChange={(val) => {
              setFilterLevel(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 border-slate-200 bg-white rounded-xl text-xs">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🏆 All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterStatus}
            onValueChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 border-slate-200 bg-white rounded-xl text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📝 All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterPremium}
            onValueChange={(val) => {
              setFilterPremium(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 border-slate-200 bg-white rounded-xl text-xs">
              <SelectValue placeholder="All Pricing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">💎 All Pricing</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="premium">Premium Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content Table */}
        <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs font-bold text-slate-800">Lesson</TableHead>
                <TableHead className="text-xs font-bold text-slate-800">Code</TableHead>
                <TableHead className="text-xs font-bold text-slate-800">Language</TableHead>
                <TableHead className="text-xs font-bold text-slate-800">Level</TableHead>
                <TableHead className="text-xs font-bold text-slate-800 text-center">Cards</TableHead>
                <TableHead className="text-xs font-bold text-slate-800 text-center">Quiz</TableHead>
                <TableHead className="text-xs font-bold text-slate-800">Pricing</TableHead>
                <TableHead className="text-xs font-bold text-slate-800">Status</TableHead>
                <TableHead className="text-xs font-bold text-slate-800 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9} className="p-4">
                      <div className="h-6 bg-slate-100 rounded-lg animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : lessons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-20 text-center text-slate-400">
                    <span className="text-4xl mb-3">📚</span>
                    <p className="text-sm font-semibold">No lessons found matching filters</p>
                    <p className="text-xs text-slate-400 mt-1">Create a new lesson or adjust search query filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                lessons.map((lesson) => {
                  const levelStyle = LEVEL_COLORS[lesson.level?.code || ""] || {
                    bg: "bg-slate-50",
                    text: "text-slate-600",
                    border: "border-slate-100",
                  };

                  return (
                    <TableRow key={lesson.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Colored icon */}
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${lesson.color || "from-sky-400 to-indigo-500"} flex items-center justify-center text-xl text-white shadow flex-shrink-0`}>
                            {lesson.emoji || "📚"}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 text-sm truncate block">{lesson.title}</span>
                            <span className="text-[10px] text-slate-400 truncate max-w-xs block mt-0.5">
                              {lesson.intro || "No intro text declared"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">
                        {lesson.lessonCode || <span className="text-slate-300 italic">none</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 border text-[10px] rounded-full shadow-none font-bold uppercase">
                          {lesson.language?.name || lesson.language?.code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${levelStyle.bg} ${levelStyle.text} ${levelStyle.border} border text-[10px] rounded-full shadow-none font-bold capitalize`}>
                          {lesson.level?.name || lesson.level?.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-slate-100 text-slate-700 text-[10px] rounded-md shadow-none flex items-center gap-1 w-fit mx-auto border font-bold">
                          <BookOpen className="w-3 h-3 text-indigo-500" />
                          {lesson._count?.cards ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-slate-100 text-slate-700 text-[10px] rounded-md shadow-none flex items-center gap-1 w-fit mx-auto border font-bold">
                          <HelpCircle className="w-3 h-3 text-purple-500" />
                          {lesson._count?.quizQuestions ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lesson.isPremium ? (
                          <span className="text-amber-600 font-bold text-xs flex items-center gap-1">
                            <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Premium
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-xs">Free</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_BADGES[lesson.status || "draft"]} border text-[10px] rounded-full px-2 py-0.5 shadow-none font-bold uppercase`}>
                          {lesson.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenPreview(lesson)}
                            className="w-8 h-8 rounded-lg hover:bg-indigo-50 text-indigo-500"
                            title="Preview lesson simulator"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(`/admin/lessons/${lesson.id}/edit`)}
                            className="w-8 h-8 rounded-lg hover:bg-indigo-50 text-indigo-600"
                            title="Edit content"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenVersions(lesson)}
                            className="w-8 h-8 rounded-lg hover:bg-indigo-50 text-slate-600"
                            title="Version log history"
                          >
                            <History className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Duplicate this lesson?`)) {
                                duplicateMutation.mutate(lesson.id);
                              }
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-indigo-50 text-slate-500"
                            title="Duplicate lesson structure"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          {lesson.status !== "published" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Publish this lesson?`)) {
                                  publishMutation.mutate(lesson.id);
                                }
                              }}
                              className="w-8 h-8 rounded-lg hover:bg-emerald-50 text-emerald-600"
                              title="Publish lesson"
                            >
                              <RefreshCcw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {lesson.status !== "archived" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Archive this lesson?`)) {
                                  archiveMutation.mutate(lesson.id);
                                }
                              }}
                              className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-slate-700"
                              title="Archive lesson"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Restore this lesson to draft?`)) {
                                  restoreMutation.mutate(lesson.id);
                                }
                              }}
                              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-indigo-600 animate-pulse"
                              title="Restore lesson"
                            >
                              <RefreshCcw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`ARE YOU SURE you want to delete "${lesson.title}"? This cannot be undone.`)) {
                                deleteMutation.mutate(lesson.id);
                              }
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700"
                            title="Hard delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-150 mt-6 bg-white p-4 rounded-2xl shadow-sm border">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-9 rounded-xl text-slate-600 border-slate-200"
            >
              Previous
            </Button>
            <span className="text-xs font-semibold text-slate-500">
              Page {page} of {totalPages} (showing {lessons.length} of {totalLessons} items)
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 rounded-xl text-slate-600 border-slate-200"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Excel Import Dialog */}
      <ExcelImportDialog open={showExcelImport} onOpenChange={setShowExcelImport} />

      {/* JSON Import Dialog */}
      <JsonImportDialog open={showJsonImport} onOpenChange={setShowJsonImport} />

      {/* Export Dialog */}
      <ExportDialog open={showExport} onOpenChange={setShowExport} lessonsList={lessons} />

      {/* Version History Modal */}
      {selectedLessonForHistory && (
        <VersionHistory
          lessonId={selectedLessonForHistory.id}
          lessonTitle={selectedLessonForHistory.title}
          open={showVersionHistory}
          onOpenChange={setShowVersionHistory}
        />
      )}

      {/* Simulator Sandbox Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[420px] p-0 overflow-hidden bg-slate-900 border-slate-800 rounded-3xl shadow-2xl">
          {selectedLessonForPreview && (
            <LessonPreview lesson={selectedLessonForPreview} />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
