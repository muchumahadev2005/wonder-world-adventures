import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit2, Trash2, Eye, Star, Crown, BookOpen, Filter, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi, AdminStory } from "@/lib/adminApi";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CATEGORIES = ["Fantasy", "Adventure", "Nature", "Animals", "Magic", "Inspiration", "Sharing", "Mystery"];
const AGE_GROUPS = ["3-5", "5-7", "7-10", "10+"];

const StoryForm = ({ story, onClose, onSave }: { story?: Partial<AdminStory> | null; onClose: () => void; onSave: (data: Partial<AdminStory>) => void }) => {
  const [form, setForm] = useState({
    title: story?.title || "",
    category: story?.category || "",
    ageGroup: story?.ageGroup || "",
    description: story?.description || "",
    content: story?.content || "",
    audioUrl: story?.audioUrl || "",
    readingTime: story?.readingTime || 5,
    isPremium: story?.isPremium ?? false,
    isPublished: story?.isPublished ?? true,
    starsReward: story?.starsReward ?? 2,
    author: story?.author || "",
    coverEmoji: story?.coverEmoji || "",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Title *</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Story title" />
        </div>
        <div>
          <Label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Author</Label>
          <Input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Author name" />
        </div>
        <div>
          <Label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Category</Label>
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Age Group</Label>
          <Select value={form.ageGroup || ""} onValueChange={v => setForm(f => ({ ...f, ageGroup: v }))}>
            <SelectTrigger><SelectValue placeholder="Select age group" /></SelectTrigger>
            <SelectContent>{AGE_GROUPS.map(a => <SelectItem key={a} value={a}>{a} years</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Description</Label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Short description..."
          rows={2}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      <div>
        <Label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Story Content *</Label>
        <textarea
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          placeholder="Write the story content here..."
          rows={6}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <Label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Audio URL</Label>
          <Input value={form.audioUrl} onChange={e => setForm(f => ({ ...f, audioUrl: e.target.value }))} placeholder="https://..." />
        </div>
        <div>
          <Label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Reading Time (min)</Label>
          <Input type="number" value={form.readingTime} onChange={e => setForm(f => ({ ...f, readingTime: Number(e.target.value) }))} />
        </div>
        <div>
          <Label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Stars Reward</Label>
          <Input type="number" value={form.starsReward} onChange={e => setForm(f => ({ ...f, starsReward: Number(e.target.value) }))} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Switch checked={form.isPremium} onCheckedChange={v => setForm(f => ({ ...f, isPremium: v }))} id="premium-toggle" />
          <Label htmlFor="premium-toggle" style={{ fontSize: 13, fontWeight: 500 }}>Premium Content</Label>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Switch checked={form.isPublished} onCheckedChange={v => setForm(f => ({ ...f, isPublished: v }))} id="publish-toggle" />
          <Label htmlFor="publish-toggle" style={{ fontSize: 13, fontWeight: 500 }}>Published</Label>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => onSave(form)}
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
        >
          {story?.id ? "Update Story" : "Create Story"}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default function StoriesAdmin() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterPremium, setFilterPremium] = useState<string>("all");
  const [editStory, setEditStory] = useState<Partial<AdminStory> | null | false>(false);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["admin-stories"],
    queryFn: adminApi.getStories,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteStory(id, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-stories"] }); toast.success("Story deleted"); },
    onError: () => toast.error("Delete failed"),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<AdminStory>) =>
      editStory && (editStory as AdminStory).id
        ? adminApi.updateStory((editStory as AdminStory).id, data, token)
        : adminApi.createStory(data, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-stories"] });
      toast.success(editStory && (editStory as AdminStory).id ? "Story updated!" : "Story created!");
      setEditStory(false);
    },
    onError: () => toast.error("Save failed"),
  });

  const filtered = stories.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || (s.author || "").toLowerCase().includes(search.toLowerCase());
    const matchPremium = filterPremium === "all" || (filterPremium === "premium" ? s.isPremium : !s.isPremium);
    return matchSearch && matchPremium;
  });

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <BookOpen size={24} color="#6366f1" /> Stories Management
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{stories.length} stories total</p>
          </div>
          <Button onClick={() => setEditStory({})} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", gap: 6 }}>
            <Plus size={16} /> Add Story
          </Button>
        </motion.div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", flex: 1, minWidth: 200 }}>
            <Search size={14} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stories..." style={{ border: "none", outline: "none", fontSize: 14, width: "100%" }} />
          </div>
          <Select value={filterPremium} onValueChange={setFilterPremium}>
            <SelectTrigger style={{ width: 160, background: "white" }}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stories</SelectItem>
              <SelectItem value="premium">Premium Only</SelectItem>
              <SelectItem value="free">Free Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Cover", "Title", "Category", "Age", "Stars", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} style={{ padding: "16px" }}>
                      <div style={{ height: 20, background: "#f1f5f9", borderRadius: 6, animation: "pulse 1.5s infinite" }} />
                    </td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>No stories found</td></tr>
                ) : (
                  filtered.map((story, i) => (
                    <motion.tr
                      key={story.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                      whileHover={{ background: "#fafafa" } as never}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                          📚
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{story.title}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{story.author || "Unknown"}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#ede9fe", color: "#6d28d9", fontWeight: 600 }}>
                          {story.category || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>{story.ageGroup || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                          <Star size={13} color="#f59e0b" fill="#f59e0b" /> {story.starsReward}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {story.isPremium && (
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#fef3c7", color: "#d97706", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                              <Crown size={10} /> Premium
                            </span>
                          )}
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: story.isPublished ? "#d1fae5" : "#fee2e2", color: story.isPublished ? "#059669" : "#dc2626", fontWeight: 700 }}>
                            {story.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Button variant="ghost" size="icon" style={{ width: 32, height: 32 }} onClick={() => setEditStory(story)}>
                            <Edit2 size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" style={{ width: 32, height: 32, color: "#ef4444" }} onClick={() => deleteMutation.mutate(story.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={editStory !== false} onOpenChange={() => setEditStory(false)}>
        <DialogContent style={{ maxWidth: 700, maxHeight: "90vh", overflow: "auto" }}>
          <DialogHeader>
            <DialogTitle>{editStory && (editStory as AdminStory).id ? "Edit Story" : "Create New Story"}</DialogTitle>
          </DialogHeader>
          {editStory !== false && (
            <StoryForm
              story={editStory as Partial<AdminStory>}
              onClose={() => setEditStory(false)}
              onSave={(data) => saveMutation.mutate(data)}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
