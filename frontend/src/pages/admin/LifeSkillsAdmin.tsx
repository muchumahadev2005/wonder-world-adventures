/**
 * LifeSkillsAdmin — Admin management page for Life Skill Scenarios.
 *
 * Allows admins to:
 * - View all scenarios (active & inactive)
 * - Edit title, description, icon, character, system prompt,
 *   cover gradient, dedicated OpenRouter model, and API key
 * - Create new scenarios
 * - Delete scenarios
 * - Toggle active/inactive
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import { useAuth } from "@/context/AuthContext";
import { lifeSkillsAdminApi, type LifeSkillScenario } from "@/lib/lifeSkillsApi";
import {
  MessageSquare, Plus, Pencil, Trash2, X, CheckCircle2, AlertCircle, Loader2, RefreshCw, Cpu, Key, Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

// Popular free OpenRouter models for quick selection
const QUICK_MODELS = [
  { label: "Gemma 2 9B (Free)", value: "google/gemma-2-9b-it:free" },
  { label: "Llama 3.1 8B (Free)", value: "meta-llama/llama-3.1-8b-instruct:free" },
  { label: "Qwen 2.5 72B (Free)", value: "qwen/qwen-2.5-72b-instruct:free" },
  { label: "Mistral 7B (Free)", value: "mistralai/mistral-7b-instruct:free" },
  { label: "DeepSeek R1 (Free)", value: "deepseek/deepseek-r1:free" },
  { label: "Gemma 3 27B (Free)", value: "google/gemma-3-27b-it:free" },
  { label: "Use Global Active Model", value: "" },
];

// ── Form state ────────────────────────────────────────────────────

interface FormState {
  title: string;
  slug: string;
  description: string;
  icon: string;
  characterName: string;
  characterAvatar: string;
  coverGradient: string;
  systemPrompt: string;
  modelName: string;
  apiKey: string;
  maxWords: number;
  isActive: boolean;
  sortOrder: number;
}

const blankForm = (): FormState => ({
  title: "",
  slug: "",
  description: "",
  icon: "✨",
  characterName: "",
  characterAvatar: "",
  coverGradient: "linear-gradient(135deg, #1A6B5A 0%, #2E9E80 55%, #72D6B0 100%)",
  systemPrompt: "",
  modelName: "",
  apiKey: "",
  maxWords: 60,
  isActive: true,
  sortOrder: 0,
});

// ── Helper ────────────────────────────────────────────────────────

const scenarioToForm = (s: LifeSkillScenario): FormState => ({
  title: s.title,
  slug: s.slug,
  description: s.description,
  icon: s.icon,
  characterName: s.characterName,
  characterAvatar: s.characterAvatar || "",
  coverGradient: s.coverGradient,
  systemPrompt: s.systemPrompt || "",
  modelName: s.modelName || "",
  apiKey: "",            // never pre-fill key
  maxWords: s.maxWords,
  isActive: s.isActive,
  sortOrder: s.sortOrder,
});

// ── Component ─────────────────────────────────────────────────────

export default function LifeSkillsAdmin() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LifeSkillScenario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LifeSkillScenario | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const [formError, setFormError] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // ── Queries ─────────────────────────────────────────────────────
  const { data: scenarios = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-life-skills"],
    queryFn: () => lifeSkillsAdminApi.listAll(token),
    enabled: !!token,
  });

  // ── Mutations ────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: Partial<LifeSkillScenario> & { apiKey?: string }) =>
      lifeSkillsAdminApi.create(data, token),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-life-skills"] }); closeForm(); },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LifeSkillScenario> & { apiKey?: string } }) =>
      lifeSkillsAdminApi.update(id, data, token),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-life-skills"] }); closeForm(); },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => lifeSkillsAdminApi.delete(id, token),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-life-skills"] }); setDeleteTarget(null); },
  });

  // ── Helpers ──────────────────────────────────────────────────────
  const openAdd = () => { setForm(blankForm()); setFormError(""); setShowApiKey(false); setAddOpen(true); };

  const openEdit = (s: LifeSkillScenario) => {
    setEditTarget(s);
    setForm(scenarioToForm(s));
    setFormError("");
    setShowApiKey(false);
  };

  const closeForm = () => { setAddOpen(false); setEditTarget(null); setFormError(""); setShowApiKey(false); };

  const updateForm = (field: keyof FormState, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    setFormError("");
    const payload = {
      ...form,
      modelName: form.modelName || null,
      apiKey: form.apiKey.trim() || undefined,
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ── UI ───────────────────────────────────────────────────────────
  if (isLoading) return <AdminLayout><AdminLoadingState title="Loading Life Skills..." /></AdminLayout>;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1A6B5A, #2E9E80)" }}>
              <MessageSquare size={18} color="white" />
            </div>
            <h1 className="text-2xl font-bold">Life Skills Practice</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Manage scenario cards, characters, system prompts, and dedicated OpenRouter models.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} className="mr-1.5" /> Refresh
          </Button>
          <Button size="sm" onClick={openAdd} style={{ background: "linear-gradient(135deg,#1A6B5A,#2E9E80)", color: "white" }}>
            <Plus size={14} className="mr-1.5" /> Add Scenario
          </Button>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="mb-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-center gap-2">
          <AlertCircle size={16} /> Failed to load scenarios.
        </div>
      )}

      {/* Scenarios grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence>
          {scenarios.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative rounded-2xl border overflow-hidden"
              style={{ borderColor: "rgba(0,0,0,0.08)" }}
            >
              {/* Gradient header strip */}
              <div className="h-2" style={{ background: s.coverGradient }} />

              <div className="p-5">
                {/* Icon + status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border"
                      style={{ background: s.coverGradient, borderColor: "rgba(255,255,255,0.3)" }}>
                      {s.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight">{s.title}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{s.slug}</p>
                    </div>
                  </div>
                  <Badge variant={s.isActive ? "default" : "secondary"} className="text-xs">
                    {s.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{s.description}</p>

                {/* Character */}
                <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.03)" }}>
                  <span className="text-lg">{s.characterAvatar || "🤖"}</span>
                  <div>
                    <p className="text-xs font-semibold">{s.characterName}</p>
                    <p className="text-xs text-muted-foreground">Character</p>
                  </div>
                </div>

                {/* Model badge */}
                <div className="flex items-center gap-1.5 mb-4">
                  <Cpu size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate font-mono">
                    {s.modelName || <span className="italic">Global active model</span>}
                  </span>
                  {s.hasCustomApiKey && (
                    <Key size={11} className="text-emerald-600 ml-1 flex-shrink-0" title="Custom API key set" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => openEdit(s)}>
                    <Pencil size={12} className="mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs text-red-600 hover:text-red-700 hover:border-red-300"
                    onClick={() => setDeleteTarget(s)}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {scenarios.length === 0 && !isLoading && (
        <div className="text-center py-20 text-muted-foreground">
          <Bot size={48} className="mx-auto mb-4 opacity-30" />
          <p>No scenarios found. Default scenarios will appear on first API call.</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            <RefreshCw size={14} className="mr-1.5" /> Try Again
          </Button>
        </div>
      )}

      {/* ── Add/Edit Dialog ─────────────────────────────────────── */}
      <Dialog open={addOpen || !!editTarget} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Scenario" : "Add New Scenario"}</DialogTitle>
            <DialogDescription>Configure the life skill practice scenario and its dedicated AI model.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Basic info row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="Ordering Food" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug * (URL key)</Label>
                <Input value={form.slug} onChange={(e) => updateForm("slug", e.target.value)} placeholder="ordering-food"
                  disabled={!!editTarget} className={editTarget ? "opacity-60" : ""} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Input value={form.description} onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Practice politely ordering a meal at a restaurant." />
            </div>

            {/* Icon + Character row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Scenario Icon (emoji)</Label>
                <Input value={form.icon} onChange={(e) => updateForm("icon", e.target.value)} placeholder="🍽️" />
              </div>
              <div className="space-y-1.5">
                <Label>Character Name *</Label>
                <Input value={form.characterName} onChange={(e) => updateForm("characterName", e.target.value)} placeholder="Chef Marco" />
              </div>
              <div className="space-y-1.5">
                <Label>Character Avatar (emoji)</Label>
                <Input value={form.characterAvatar} onChange={(e) => updateForm("characterAvatar", e.target.value)} placeholder="👨‍🍳" />
              </div>
            </div>

            {/* Cover gradient */}
            <div className="space-y-1.5">
              <Label>Cover Gradient (CSS)</Label>
              <div className="flex gap-3 items-center">
                <Input value={form.coverGradient} onChange={(e) => updateForm("coverGradient", e.target.value)}
                  placeholder="linear-gradient(135deg, #1A6B5A 0%, #2E9E80 100%)" className="flex-1" />
                <div className="w-12 h-10 rounded-xl border border-white/20 flex-shrink-0"
                  style={{ background: form.coverGradient }} />
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-1.5">
              <Label>System Prompt *</Label>
              <textarea
                value={form.systemPrompt}
                onChange={(e) => updateForm("systemPrompt", e.target.value)}
                rows={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                placeholder="You are Chef Marco, a friendly restaurant waiter... "
              />
            </div>

            {/* Model section */}
            <div className="p-4 rounded-xl border" style={{ background: "rgba(0,0,0,0.02)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Cpu size={16} className="text-muted-foreground" />
                <h4 className="font-semibold text-sm">Dedicated OpenRouter Model</h4>
              </div>

              {/* Quick model selector */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {QUICK_MODELS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => updateForm("modelName", m.value)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                      form.modelName === m.value
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-input hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 mb-3">
                <Label>Custom Model ID (OpenRouter slug)</Label>
                <Input
                  value={form.modelName}
                  onChange={(e) => updateForm("modelName", e.target.value)}
                  placeholder="google/gemma-2-9b-it:free  (leave empty for global model)"
                  className="font-mono text-xs"
                />
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <Key size={13} />
                  Custom API Key
                  {editTarget?.hasCustomApiKey && (
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                      Key is set ({editTarget.apiKeyMasked})
                    </Badge>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={form.apiKey}
                    onChange={(e) => updateForm("apiKey", e.target.value)}
                    placeholder={editTarget?.hasCustomApiKey ? "Leave empty to keep existing key" : "sk-or-v1-...  (uses global key if empty)"}
                    className="flex-1 font-mono text-xs"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Settings row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Max Words</Label>
                <Input type="number" min={10} max={200} value={form.maxWords}
                  onChange={(e) => updateForm("maxWords", Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input type="number" min={0} value={form.sortOrder}
                  onChange={(e) => updateForm("sortOrder", Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  value={form.isActive ? "active" : "inactive"}
                  onChange={(e) => updateForm("isActive", e.target.value === "active")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={14} /> {formError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving}
              style={{ background: "linear-gradient(135deg,#1A6B5A,#2E9E80)", color: "white" }}>
              {isSaving ? <Loader2 size={14} className="animate-spin mr-2" /> : <CheckCircle2 size={14} className="mr-2" />}
              {editTarget ? "Save Changes" : "Create Scenario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Scenario</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>"{deleteTarget?.title}"</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Trash2 size={14} className="mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
