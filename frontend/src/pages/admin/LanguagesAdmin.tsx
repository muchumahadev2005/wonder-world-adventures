import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Languages, Globe, Plus, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi, AdminLanguage } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const FLAG_EMOJIS: Record<string, string> = {
  en: "🇬🇧", te: "🇮🇳", hi: "🇮🇳", ta: "🇮🇳", kn: "🇮🇳", ml: "🇮🇳",
};

export default function LanguagesAdmin() {
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", native: "", flag: "", isActive: true });

  const { data: languages = [], isLoading } = useQuery({
    queryKey: ["admin-languages"],
    queryFn: adminApi.getLanguages,
  });

  const LANG_COLORS = ["#ede9fe", "#d1fae5", "#fef3c7", "#fee2e2", "#e0f2fe", "#fce7f3"];
  const LANG_TEXT_COLORS = ["#6d28d9", "#059669", "#d97706", "#dc2626", "#0284c7", "#be185d"];

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <Languages size={24} color="#6366f1" /> Languages Management
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{languages.length} languages configured</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ display: "flex", background: "white", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              {(["cards", "table"] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: "8px 16px", background: viewMode === mode ? "#6366f1" : "transparent", color: viewMode === mode ? "white" : "#64748b", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s" }}>
                  {mode === "cards" ? "🃏 Cards" : "📋 Table"}
                </button>
              ))}
            </div>
            <Button onClick={() => setShowAdd(true)} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", gap: 6 }}>
              <Plus size={16} /> Add Language
            </Button>
          </div>
        </motion.div>

        {/* Cards View */}
        {viewMode === "cards" && (
          <motion.div
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            initial="hidden" animate="show"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}
          >
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ height: 180, background: "#f1f5f9", borderRadius: 16, animation: "pulse 1.5s infinite" }} />
              ))
            ) : languages.map((lang, i) => (
              <motion.div
                key={lang.id}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}
              >
                <div style={{ height: 80, background: `linear-gradient(135deg, ${LANG_COLORS[i % LANG_COLORS.length]}, white)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
                  {FLAG_EMOJIS[lang.code] || <Globe size={32} />}
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{lang.name}</div>
                      <div style={{ fontSize: 13, color: "#94a3b8" }}>{lang.native || lang.code.toUpperCase()}</div>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: LANG_COLORS[i % LANG_COLORS.length], color: LANG_TEXT_COLORS[i % LANG_TEXT_COLORS.length] }}>
                      {lang.code.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                      {lang.isActive ? <CheckCircle size={14} color="#10b981" /> : <XCircle size={14} color="#ef4444" />}
                      <span style={{ color: lang.isActive ? "#10b981" : "#ef4444", fontWeight: 600 }}>{lang.isActive ? "Active" : "Inactive"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Button variant="ghost" size="icon" style={{ width: 30, height: 30 }}><Edit2 size={13} /></Button>
                      <Button variant="ghost" size="icon" style={{ width: 30, height: 30, color: "#ef4444" }}><Trash2 size={13} /></Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Flag", "Name", "Native", "Code", "Sort", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {languages.map((lang, i) => (
                  <motion.tr
                    key={lang.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 24 }}>{FLAG_EMOJIS[lang.code] || "🌐"}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{lang.name}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>{lang.native || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "2px 10px", borderRadius: 20, background: "#ede9fe", color: "#6d28d9", fontSize: 12, fontWeight: 700 }}>{lang.code.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>{lang.sortOrder}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, background: lang.isActive ? "#d1fae5" : "#fee2e2", color: lang.isActive ? "#059669" : "#dc2626", fontSize: 12, fontWeight: 700 }}>
                        {lang.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Button variant="ghost" size="icon" style={{ width: 32, height: 32 }}><Edit2 size={14} /></Button>
                        <Button variant="ghost" size="icon" style={{ width: 32, height: 32, color: "#ef4444" }}><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Language</DialogTitle></DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Code</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. en, hi, te" />
              </div>
              <div>
                <Label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. English" />
              </div>
              <div>
                <Label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Native Name</Label>
                <Input value={form.native} onChange={e => setForm(f => ({ ...f, native: e.target.value }))} placeholder="e.g. हिंदी" />
              </div>
              <div>
                <Label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Flag Code</Label>
                <Input value={form.flag} onChange={e => setForm(f => ({ ...f, flag: e.target.value }))} placeholder="e.g. IN, GB" />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
              <Label style={{ fontSize: 13 }}>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }} onClick={() => { toast.info("Language management coming soon!"); setShowAdd(false); }}>
              Add Language
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
