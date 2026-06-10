import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GraduationCap, Search, Crown, BookOpen, HelpCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi, AdminLesson } from "@/lib/adminApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: "#d1fae5", text: "#059669" },
  intermediate: { bg: "#fef3c7", text: "#d97706" },
  expert: { bg: "#fee2e2", text: "#dc2626" },
};

export default function LessonsAdmin() {
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["admin-lessons"],
    queryFn: adminApi.getLessons,
  });

  const languages = Array.from(new Set(lessons.map(l => l.language?.code).filter(Boolean)));
  const levels = Array.from(new Set(lessons.map(l => l.level?.code).filter(Boolean)));

  const filtered = lessons.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase());
    const matchLang = filterLang === "all" || l.language?.code === filterLang;
    const matchLevel = filterLevel === "all" || l.level?.code === filterLevel;
    return matchSearch && matchLang && matchLevel;
  });

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200 }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <GraduationCap size={24} color="#6366f1" /> Lessons Management
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{lessons.length} lessons across {languages.length} languages</p>
        </motion.div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", flex: 1, minWidth: 200 }}>
            <Search size={14} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search lessons..." style={{ border: "none", outline: "none", fontSize: 14, width: "100%" }} />
          </div>
          <Select value={filterLang} onValueChange={setFilterLang}>
            <SelectTrigger style={{ width: 160, background: "white" }}><SelectValue placeholder="Language" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {languages.map(l => <SelectItem key={l} value={l!}>{l?.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger style={{ width: 160, background: "white" }}><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {levels.map(l => <SelectItem key={l} value={l!}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Lesson", "Language", "Level", "Cards", "Quiz", "Premium", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} style={{ padding: "14px 16px" }}>
                      <div style={{ height: 18, background: "#f1f5f9", borderRadius: 6, animation: "pulse 1.5s infinite" }} />
                    </td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>No lessons found</td></tr>
                ) : (
                  filtered.map((lesson, i) => {
                    const levelStyle = LEVEL_COLORS[lesson.level?.code || ""] || { bg: "#f1f5f9", text: "#64748b" };
                    return (
                      <motion.tr
                        key={lesson.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: lesson.color || "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                              {lesson.emoji || "📚"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{lesson.title}</div>
                              {lesson.intro && <div style={{ fontSize: 11, color: "#94a3b8", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lesson.intro}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#ede9fe", color: "#6d28d9", fontWeight: 700 }}>
                            {lesson.language?.name || lesson.language?.code?.toUpperCase() || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: levelStyle.bg, color: levelStyle.text, fontWeight: 700, textTransform: "capitalize" }}>
                            {lesson.level?.name || lesson.level?.code || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#374151" }}>
                            <BookOpen size={13} color="#6366f1" />
                            {(lesson as any).words?.length ?? (lesson._count?.cards ?? "—")}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#374151" }}>
                            <HelpCircle size={13} color="#8b5cf6" />
                            {lesson._count?.quizzes ?? "—"}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {lesson.isPremium ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "2px 10px", borderRadius: 20, background: "#fef3c7", color: "#d97706", fontWeight: 700, width: "fit-content" }}>
                              <Crown size={10} /> Premium
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: "#f1f5f9", color: "#64748b", fontWeight: 600 }}>Free</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: lesson.isPublished ? "#d1fae5" : "#fee2e2", color: lesson.isPublished ? "#059669" : "#dc2626", fontWeight: 700 }}>
                            {lesson.isPublished ? "Published" : "Draft"}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginTop: 24 }}>
          {[
            { label: "Total Lessons", value: lessons.length, color: "#6366f1", bg: "#ede9fe" },
            { label: "Beginner", value: lessons.filter(l => l.level?.code === "beginner").length, color: "#059669", bg: "#d1fae5" },
            { label: "Intermediate", value: lessons.filter(l => l.level?.code === "intermediate").length, color: "#d97706", bg: "#fef3c7" },
            { label: "Expert", value: lessons.filter(l => l.level?.code === "expert").length, color: "#dc2626", bg: "#fee2e2" },
            { label: "Premium", value: lessons.filter(l => l.isPremium).length, color: "#d97706", bg: "#fef3c7" },
          ].map(card => (
            <div key={card.label} style={{ background: "white", borderRadius: 12, padding: "16px 20px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: card.color }}>
                {card.value}
              </div>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{card.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
