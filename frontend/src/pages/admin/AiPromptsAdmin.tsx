import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import { adminApi, AiPromptSettings } from "@/lib/adminApi";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Copy,
  Check,
  Plus,
  X,
  BookOpen,
  Languages,
  GraduationCap,
  ShieldCheck,
  Sliders,
  Smile,
  Hash,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const AGE_GROUPS = [
  { value: "3 - 5 years", label: "3 - 5 years (Preschool & Kindergarten)" },
  { value: "6 - 8 years", label: "6 - 8 years (Early Elementary)" },
  { value: "9 - 12 years", label: "9 - 12 years (Upper Elementary)" },
  { value: "13+ years", label: "13+ years (Middle & High School)" },
  { value: "3-12", label: "3 - 12 years (All Child Learners)" },
];

const LANGUAGES = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "te", label: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { value: "hi", label: "Hindi (हिन्दी)", flag: "🇮🇳" },
  { value: "ta", label: "Tamil (தமிழ்)", flag: "🇮🇳" },
];

const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner", desc: "Basic words, sounds & simple phrases" },
  { value: "intermediate", label: "Intermediate", desc: "Small sentences & easy grammar" },
  { value: "expert", label: "Expert", desc: "Descriptive vocabulary & concepts" },
];

const RESPONSE_TONES = [
  { value: "encouraging", label: "Encouraging", icon: "🌟" },
  { value: "playful", label: "Playful & Fun", icon: "🎈" },
  { value: "gentle", label: "Gentle & Patient", icon: "🌱" },
  { value: "enthusiastic", label: "High Energy & Enthusiastic", icon: "🚀" },
];

const SUGGESTED_TOPICS = [
  "Animals",
  "Science",
  "Mathematics",
  "English Grammar",
  "Stories",
  "General Knowledge",
  "Nature",
  "Space & Planets",
  "Fun Facts & Riddles",
  "Creative Arts",
  "Life Skills",
  "World Geography",
  "Healthy Habits",
  "Music & Sounds",
];

const WORD_PRESETS = [30, 50, 75, 100, 150];

export default function AiPromptsAdmin() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // ── Form State ──────────────────────────────────────────────────
  const [ageGroup, setAgeGroup] = useState("6 - 8 years");
  const [maxWords, setMaxWords] = useState<number>(50);
  const [language, setLanguage] = useState("en");
  const [difficulty, setDifficulty] = useState("beginner");
  const [responseTone, setResponseTone] = useState("encouraging");
  const [allowedTopics, setAllowedTopics] = useState<string[]>([]);
  const [safetyRules, setSafetyRules] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [newSafetyRule, setNewSafetyRule] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);

  // ── Query Active Settings ───────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-ai-prompt-settings"],
    queryFn: async () => {
      const res = await adminApi.getAiPromptSettings(token);
      return res;
    },
    enabled: !!token,
  });

  // Populate state when data loads
  useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      setAgeGroup(s.ageGroup || "6 - 8 years");
      setMaxWords(s.maxResponseWords || 50);
      setLanguage(s.language || "en");
      setDifficulty(s.difficulty || "beginner");
      setResponseTone(s.responseTone || "encouraging");
      setAllowedTopics(s.allowedTopics || SUGGESTED_TOPICS.slice(0, 8));
      setSafetyRules(s.safetyRules || []);
      setCustomInstructions(s.customInstructions || "");
    }
  }, [data]);

  // ── Mutations ───────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (payload: Partial<AiPromptSettings>) =>
      adminApi.updateAiPromptSettings(payload, token),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-ai-prompt-settings"] });
      toast.success("AI Prompt Limitations saved successfully!", {
        description: "Cache updated. Next chat session will use these instructions.",
      });
    },
    onError: (err: Error) => {
      toast.error("Failed to save prompt settings", { description: err.message });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => adminApi.resetAiPromptSettings(token),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-ai-prompt-settings"] });
      toast.success("AI Prompt Limitations reset to default settings!");
    },
    onError: (err: Error) => {
      toast.error("Failed to reset settings", { description: err.message });
    },
  });

  // ── Handlers ───────────────────────────────────────────────────
  const handleSave = () => {
    if (!maxWords || maxWords < 10 || maxWords > 500) {
      toast.error("Invalid Response Length", {
        description: "Word limit must be between 10 and 500 words.",
      });
      return;
    }
    if (allowedTopics.length === 0) {
      toast.error("Topics Required", {
        description: "Please select or add at least one allowed educational topic.",
      });
      return;
    }

    updateMutation.mutate({
      ageGroup,
      maxResponseWords: maxWords,
      language,
      difficulty,
      responseTone,
      allowedTopics,
      safetyRules,
      customInstructions: customInstructions.trim() || null,
    });
  };

  const handleAddTopic = () => {
    const trimmed = newTopic.trim();
    if (!trimmed) return;
    if (allowedTopics.includes(trimmed)) {
      toast.info("Topic already exists in the allowed list.");
      return;
    }
    setAllowedTopics([...allowedTopics, trimmed]);
    setNewTopic("");
  };

  const handleRemoveTopic = (topic: string) => {
    setAllowedTopics(allowedTopics.filter((t) => t !== topic));
  };

  const handleAddSafetyRule = () => {
    const trimmed = newSafetyRule.trim();
    if (!trimmed) return;
    setSafetyRules([...safetyRules, trimmed]);
    setNewSafetyRule("");
  };

  const handleRemoveSafetyRule = (index: number) => {
    setSafetyRules(safetyRules.filter((_, i) => i !== index));
  };

  const handleCopyPreview = () => {
    if (data?.previewPrompt) {
      navigator.clipboard.writeText(data.previewPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("System prompt copied to clipboard!");
    }
  };

  // Generate dynamic live preview string based on local state
  const livePreview = `
You are KidsPal AI — an enthusiastic, friendly, and kind AI teacher for children in the ${ageGroup} age group.
You are like a fun, warm, and patient guide who helps children learn and explore exciting topics.

TARGET AUDIENCE & DIFFICULTY:
- Target Age Group: ${ageGroup}
- Difficulty Level: ${difficulty.toUpperCase()}
- Primary Language: ${LANGUAGES.find((l) => l.value === language)?.label || "English"}
- Overall Tone: ${responseTone}

ALLOWED & PRIORITIZED EDUCATIONAL TOPICS:
${allowedTopics.map((t) => `- ${t}`).join("\n")}

STRICT SAFETY RULES (NEVER violate these):
${safetyRules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

RESPONSE LENGTH & STYLE CONSTRAINTS (STRICT):
- MAXIMUM RESPONSE LENGTH: ${maxWords} words maximum. Keep it concise, punchy, and direct.
- Never write overly long paragraphs or walls of text.
- Answer immediately with clear, positive wording and cheerful emojis 🎉.

${customInstructions ? `ADMIN CUSTOM INSTRUCTIONS:\n${customInstructions}\n` : ""}
STORYNEST CONTENT (use if relevant):
[Injected by RAG retriever during user session]
`.trim();

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                AI Prompt Limitations
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Configure age groups, word caps, language constraints, and educational guidelines for the AI Teacher.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending || isLoading}
              className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              {resetMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Reset to Defaults
            </Button>

            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || isLoading}
              className="gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Prompt Limits
            </Button>
          </div>
        </div>

        {/* ── Cache Flow Information Card ── */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold">Zero-Downtime Cache Flow:</span> When you save changes, the active prompt cache is cleared instantly. The very next AI conversation will load and cache these new rules dynamically without server restart.
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 bg-white border border-slate-200 rounded-2xl">
            <AdminLoadingState
              message="Fetching AI prompt limitations from database..."
              subMessage="Loading target age groups, response limits, allowed topics, and guardrails."
              minHeight="240px"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ── Left Column: Configuration Controls ── */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Core Target Audience & Tone */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-800">1. Target Audience & Educational Level</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Age Group */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Target Age Group</Label>
                    <Select value={ageGroup} onValueChange={setAgeGroup}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue placeholder="Select Age Group" />
                      </SelectTrigger>
                      <SelectContent>
                        {AGE_GROUPS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Difficulty Level */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Difficulty Level</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue placeholder="Select Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label} — <span className="text-slate-400 text-xs">{d.desc}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Language */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Language Constraint</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            <span className="mr-1.5">{l.flag}</span> {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Response Tone */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Response Personality Tone</Label>
                    <Select value={responseTone} onValueChange={setResponseTone}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue placeholder="Select Tone" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESPONSE_TONES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            <span className="mr-1.5">{t.icon}</span> {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Response Length & Constraints */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Sliders className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-bold text-slate-800">2. Maximum Response Length</h2>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700">Word Cap Limit</Label>
                    <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      {maxWords} words max
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={10}
                      max={500}
                      value={maxWords}
                      onChange={(e) => setMaxWords(parseInt(e.target.value, 10) || 10)}
                      className="rounded-xl border-slate-200 font-bold max-w-[140px]"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      {WORD_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setMaxWords(preset)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                            maxWords === preset
                              ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {preset} words
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Shorter word limits (30-60 words) keep responses child-friendly and prevent long walls of text.
                  </p>
                </div>
              </motion.div>

              {/* Card 3: Allowed Educational Topics */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-bold text-slate-800">3. Allowed Educational Topics</h2>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                    {allowedTopics.length} Active
                  </Badge>
                </div>

                {/* Active Topics Badge Cloud */}
                <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  {allowedTopics.map((topic) => (
                    <motion.span
                      key={topic}
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-xs group"
                    >
                      <span>{topic}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(topic)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove topic"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.span>
                  ))}
                  {allowedTopics.length === 0 && (
                    <p className="text-xs text-slate-400 italic py-1">No topics selected. Add topics below.</p>
                  )}
                </div>

                {/* Add Custom Topic */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add educational topic (e.g. Dinosaurs, Fractions, Poems)..."
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                    className="rounded-xl border-slate-200 text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTopic}
                    variant="outline"
                    className="rounded-xl gap-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </div>

                {/* Quick Add Suggestions */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Suggestions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_TOPICS.filter((t) => !allowedTopics.includes(t)).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setAllowedTopics([...allowedTopics, suggestion])}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-transparent transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Card 4: Safety Guardrails & Custom Instructions */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-rose-600" />
                  <h2 className="text-lg font-bold text-slate-800">4. Safety Guardrails & Custom Instructions</h2>
                </div>

                {/* Safety Rules */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Strict Safety Rules (Enforced in Prompt)</Label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {safetyRules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700"
                      >
                        <span className="truncate mr-2 font-medium">⚠️ {rule}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSafetyRule(idx)}
                          className="text-slate-400 hover:text-rose-600 flex-shrink-0"
                          title="Remove rule"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Add custom safety rule..."
                      value={newSafetyRule}
                      onChange={(e) => setNewSafetyRule(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSafetyRule();
                        }
                      }}
                      className="rounded-xl border-slate-200 text-xs"
                    />
                    <Button
                      type="button"
                      onClick={handleAddSafetyRule}
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-slate-300"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Custom Admin Instructions */}
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-bold text-slate-700">
                    Additional Custom Instructions (Optional)
                  </Label>
                  <Textarea
                    placeholder="Enter any extra instructions or specific teaching guidelines for the AI Teacher..."
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    rows={3}
                    className="rounded-xl border-slate-200 text-xs resize-none"
                  />
                  <p className="text-[11px] text-slate-400">
                    These instructions are appended directly to the system prompt.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* ── Right Column: Real-Time Live System Prompt Preview ── */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-24 space-y-4">
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-white">Live System Prompt Preview</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPreview}
                      className="h-8 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 gap-1 rounded-lg"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    This is the exact prompt sent to the active OpenRouter model during user chats:
                  </p>

                  <div className="relative">
                    <pre
                      className="text-[11px] font-mono bg-slate-950/90 text-purple-200 p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-[520px] whitespace-pre-wrap leading-relaxed select-all"
                    >
                      {livePreview}
                    </pre>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Model: Dynamically Loaded</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Real-time Synced
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex items-center justify-between">
                  <div className="text-xs text-purple-900 font-medium">
                    Ready to publish your rules?
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-1 shadow-sm font-bold text-xs"
                  >
                    {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
