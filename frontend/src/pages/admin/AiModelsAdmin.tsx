import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import { adminApi, AiModel } from "@/lib/adminApi";
import { useAuth } from "@/context/AuthContext";
import {
  Cpu,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Pencil,
  Zap,
  Key,
  Calendar,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AiModelsAdmin() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AiModel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AiModel | null>(null);

  // Form state for add/edit
  const [displayName, setDisplayName] = useState("");
  const [modelName, setModelName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [formError, setFormError] = useState("");

  // Test status tracking map: { [modelId]: { status: 'testing'|'Connected'|'Connection Failed', error?: string } }
  const [testResults, setTestResults] = useState<Record<string, { status: string; error?: string }>>({});

  // ── Query ────────────────────────────────────────────────────────
  const { data: models = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-ai-models"],
    queryFn: () => adminApi.getAiModels(token),
    enabled: !!token,
  });

  // ── Mutations ───────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: { displayName: string; modelName: string; apiKey?: string; isActive?: boolean }) =>
      adminApi.createAiModel(data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ai-models"] });
      closeForm();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AiModel> & { apiKey?: string } }) =>
      adminApi.updateAiModel(id, data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ai-models"] });
      closeForm();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminApi.activateAiModel(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ai-models"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAiModel(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ai-models"] });
      setDeleteTarget(null);
    },
  });

  // ── Helpers ─────────────────────────────────────────────────────
  const openAdd = () => {
    setDisplayName("");
    setModelName("");
    setApiKey("");
    setIsActive(models.length === 0);
    setFormError("");
    setAddOpen(true);
  };

  const openEdit = (model: AiModel) => {
    setEditTarget(model);
    setDisplayName(model.displayName);
    setModelName(model.modelName);
    setApiKey(""); // Keep empty so current key is preserved unless typed over
    setIsActive(model.isActive);
    setFormError("");
  };

  const closeForm = () => {
    setAddOpen(false);
    setEditTarget(null);
    setFormError("");
  };

  const handleSave = () => {
    if (!displayName.trim() || !modelName.trim()) {
      setFormError("Display name and Model name are required.");
      return;
    }
    if (addOpen) {
      createMutation.mutate({
        displayName: displayName.trim(),
        modelName: modelName.trim(),
        apiKey: apiKey.trim() || undefined,
        isActive,
      });
    } else if (editTarget) {
      updateMutation.mutate({
        id: editTarget.id,
        data: {
          displayName: displayName.trim(),
          modelName: modelName.trim(),
          apiKey: apiKey.trim() || undefined,
          isActive,
        },
      });
    }
  };

  const handleTest = async (modelId: string) => {
    setTestResults((prev) => ({ ...prev, [modelId]: { status: "testing" } }));
    try {
      const res = await adminApi.testAiModel(modelId, token);
      if (res.status === "Connected") {
        setTestResults((prev) => ({ ...prev, [modelId]: { status: "Connected" } }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [modelId]: { status: "Connection Failed", error: res.error || "Failed to reach model" },
        }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [modelId]: { status: "Connection Failed", error: err.message || "Network error" },
      }));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2 font-display">
              <Cpu className="w-7 h-7 text-primary" /> OpenRouter AI Models
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dynamically switch and manage active OpenRouter LLM models without touching code.
            </p>
          </div>
          <Button
            onClick={openAdd}
            className="bg-gradient-to-r from-primary to-lavender text-white shadow-lg font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Model
          </Button>
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
            <b>Child-Safe &amp; Transparent:</b> The active model automatically serves all StoryNest RAG questions &amp; general child queries. Children never see the underlying AI model.
          </div>
        </div>

        {/* Table / Cards */}
        {isLoading ? (
          <div className="py-16 bg-white dark:bg-card/40 border border-border rounded-2xl">
            <AdminLoadingState
              message="Fetching AI Models from database..."
              subMessage="Loading OpenRouter models, custom endpoints, and active configurations."
              minHeight="220px"
            />
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-3">Failed to load AI models.</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" /> Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {models.map((model) => {
              const test = testResults[model.id];

              return (
                <motion.div
                  key={model.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    model.isActive
                      ? "border-amber-400/50 bg-amber-500/5 shadow-lg shadow-amber-500/5"
                      : "border-border bg-card/40 hover:bg-card/60"
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Model Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-display text-lg font-bold text-foreground truncate">
                          {model.displayName}
                        </h2>
                        {model.isActive ? (
                          <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 font-extrabold flex items-center gap-1 shadow-sm">
                            <Zap className="w-3 h-3 fill-current" /> Active Model
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-xs">
                            Inactive
                          </Badge>
                        )}

                        {/* Test Status Badge */}
                        {test?.status === "testing" && (
                          <Badge variant="secondary" className="animate-pulse flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Testing connection…
                          </Badge>
                        )}
                        {test?.status === "Connected" && (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Connected
                          </Badge>
                        )}
                        {test?.status === "Connection Failed" && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge className="bg-red-500/20 text-red-300 border-red-500/30 flex items-center gap-1" title={test.error}>
                              <AlertCircle className="w-3 h-3 text-red-400" /> Connection Failed
                            </Badge>
                            {test.error && (
                              <span className="text-xs text-red-400 font-medium">({test.error})</span>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="font-mono text-xs text-primary/80 bg-primary/10 px-2.5 py-1 rounded-md inline-block max-w-full truncate">
                        {model.modelName}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <Key className="w-3.5 h-3.5" />
                          {model.hasCustomApiKey ? (
                            <span className="text-emerald-400 font-mono">{model.apiKeyMasked}</span>
                          ) : (
                            <span className="opacity-70">Server ENV Key</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Added {new Date(model.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                      {/* Test Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(model.id)}
                        disabled={test?.status === "testing"}
                        className="text-xs font-bold border-white/20 hover:bg-white/10"
                      >
                        {test?.status === "testing" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Test"
                        )}
                      </Button>

                      {/* Activate Button */}
                      {!model.isActive && (
                        <Button
                          size="sm"
                          onClick={() => activateMutation.mutate(model.id)}
                          disabled={activateMutation.isPending}
                          className="bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30 text-xs font-bold"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Activate
                        </Button>
                      )}

                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(model)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(model)}
                        disabled={model.isActive}
                        className="h-8 w-8 text-red-400 hover:text-red-300 disabled:opacity-30"
                        title={model.isActive ? "Cannot delete active model" : "Delete model"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={addOpen || Boolean(editTarget)} onOpenChange={(v) => !v && closeForm()}>
          <DialogContent className="sm:max-w-md bg-slate-900 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                {addOpen ? "Add OpenRouter Model" : "Edit OpenRouter Model"}
              </DialogTitle>
              <DialogDescription className="text-white/60 text-xs">
                Configure OpenRouter AI model parameters.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs text-white/80">Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Gemma 3"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-white/80">OpenRouter Model Name</Label>
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. google/gemma-3-27b-it:free"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-white/80">
                  Custom OpenRouter API Key <span className="text-white/40">(optional)</span>
                </Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={editTarget?.hasCustomApiKey ? "(Leave empty to keep current key)" : "sk-or-v1-..."}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-xs mt-1"
                />
                <p className="text-[11px] text-white/40 mt-1">
                  If left empty, server process.env.OPENROUTER_API_KEY will be used.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-amber-500 focus:ring-amber-400 bg-white/10"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-medium text-white/90 cursor-pointer">
                  Activate this model immediately (deactivates others)
                </label>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs">
                  ⚠️ {formError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={closeForm} className="text-white/60 hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 font-bold"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : addOpen ? (
                  "Add Model"
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-sm bg-slate-900 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-red-400 font-display font-bold">Delete AI Model?</DialogTitle>
              <DialogDescription className="text-white/70 text-xs mt-2">
                Are you sure you want to delete <b>{deleteTarget?.displayName}</b>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="text-white/60">
                Cancel
              </Button>
              <Button
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="bg-red-500 hover:bg-red-600 text-white font-bold"
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
