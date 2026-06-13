import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Save, Info, Sparkles, Languages, Award, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminApi, AdminLessonFull, AdminLanguage, AdminLessonCard, AdminQuizQuestion } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import CardBuilder from "./CardBuilder";
import QuizBuilder from "./QuizBuilder";
import LessonPreview from "./LessonPreview";

interface LessonBuilderProps {
  initialData?: AdminLessonFull | null;
  isEdit?: boolean;
}

const GRADIENTS = [
  { label: "Ocean Sky", value: "from-sky-400 to-indigo-500" },
  { label: "Sunset Glow", value: "from-amber-400 to-orange-500" },
  { label: "Rose Petal", value: "from-rose-400 to-pink-500" },
  { label: "Royal Purple", value: "from-purple-400 to-fuchsia-500" },
  { label: "Emerald Mint", value: "from-emerald-400 to-teal-500" },
  { label: "Midnight Blue", value: "from-slate-700 to-slate-900" },
];

export default function LessonBuilder({ initialData, isEdit = false }: LessonBuilderProps) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [changeNote, setChangeNote] = useState("");

  const [formData, setFormData] = useState<{
    lessonCode: string;
    title: string;
    description: string;
    intro: string;
    emoji: string;
    color: string;
    languageId: string;
    levelId: string;
    isPremium: boolean;
    status: "draft" | "review" | "published" | "archived";
    sortOrder: number;
    tags: string[];
    estimatedDuration: number;
    difficulty: "easy" | "medium" | "hard" | "";
    cards: AdminLessonCard[];
    quiz: AdminQuizQuestion[];
  }>({
    lessonCode: "",
    title: "",
    description: "",
    intro: "",
    emoji: "📚",
    color: GRADIENTS[0].value,
    languageId: "",
    levelId: "",
    isPremium: false,
    status: "draft",
    sortOrder: 0,
    tags: [],
    estimatedDuration: 5,
    difficulty: "easy",
    cards: [],
    quiz: [],
  });

  // Prepopulate form when initialData changes (edit mode)
  useEffect(() => {
    if (initialData) {
      // Find quiz questions from nested quizzes array
      const initialQuestions = initialData.quizzes?.[0]?.questions || [];
      setFormData({
        lessonCode: initialData.lessonCode || "",
        title: initialData.title || "",
        description: initialData.description || "",
        intro: initialData.intro || "",
        emoji: initialData.emoji || "📚",
        color: initialData.color || GRADIENTS[0].value,
        languageId: initialData.languageId || initialData.language?.id || "",
        levelId: initialData.levelId || initialData.level?.id || "",
        isPremium: initialData.isPremium || false,
        status: (initialData.status as any) || "draft",
        sortOrder: initialData.sortOrder || 0,
        tags: initialData.tags || [],
        estimatedDuration: (initialData as any).estimatedDuration || 5,
        difficulty: ((initialData as any).difficulty as any) || "easy",
        cards: initialData.cards || [],
        quiz: initialQuestions,
      });
    }
  }, [initialData]);

  // Load languages
  const { data: languages = [] } = useQuery<AdminLanguage[]>({
    queryKey: ["admin-languages-list"],
    queryFn: adminApi.getLanguages,
  });

  // Load levels dynamically for selected language
  const { data: levelsData, isLoading: isLoadingLevels } = useQuery({
    queryKey: ["admin-levels-list", formData.languageId],
    queryFn: () => adminApi.getLevelsForLanguage(formData.languageId),
    enabled: !!formData.languageId,
  });

  const levels = levelsData?.levels || [];

  const handleNext = () => {
    if (step === 1) {
      if (!formData.title.trim()) {
        toast.error("Lesson title is required");
        return;
      }
      if (!formData.languageId) {
        toast.error("Please select a language");
        return;
      }
      if (!formData.levelId) {
        toast.error("Please select a level");
        return;
      }
    }
    if (step === 2 && formData.cards.length === 0) {
      if (!confirm("You haven't added any cards yet. Proceed to Quiz Builder?")) {
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => s - 1);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      isEdit && initialData?.id
        ? adminApi.updateLesson(initialData.id, payload, token)
        : adminApi.createLesson(payload, token),
    onSuccess: () => {
      toast.success(isEdit ? "Lesson updated successfully" : "Lesson created successfully");
      navigate("/admin/lessons");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save lesson");
    },
  });

  const handleSave = (publish = false) => {
    if (!formData.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }

    const payload = {
      ...formData,
      status: publish ? "published" : formData.status,
      // map cards/quiz to fit zod schemas exactly
      cards: formData.cards.map((c, idx) => ({
        word: c.word,
        translit: c.translit || null,
        meaning: c.meaning || null,
        emoji: c.emoji || null,
        imageUrl: c.imageUrl || null,
        sortOrder: idx + 1,
      })),
      quiz: formData.quiz.map((q, idx) => ({
        question: q.question,
        type: q.type || "mcq",
        emoji: q.emoji || null,
        options: q.options || [],
        answer: q.answer,
        hint: q.hint || null,
        explanation: q.explanation || null,
        points: q.points || 10,
        sortOrder: idx + 1,
      })),
      ...(isEdit ? { changeNote: changeNote || `Updated lesson details` } : {}),
    };

    saveMutation.mutate(payload);
  };

  const selectedLang = languages.find((l) => l.id === formData.languageId);

  return (
    <div className="space-y-6">
      {/* Step Tracker */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              📚
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {isEdit ? `Edit Lesson: ${formData.title || "Loading..."}` : "Create New Lesson"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit ? "Modify existing content slide-by-slide" : "Build an interactive learning lesson wizard"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/lessons")}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSave(false)}
              disabled={saveMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Draft
            </Button>
          </div>
        </div>

        {/* Progress Bar & Indicators */}
        <div className="relative mt-8">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1 bg-slate-100 rounded-full z-0" />
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-indigo-500 rounded-full transition-all duration-300 z-0"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />

          <div className="flex justify-between items-center relative z-10">
            {[
              { num: 1, label: "Details", desc: "Basic Info & Metadata" },
              { num: 2, label: "Cards", desc: "Flashcard Slides" },
              { num: 3, label: "Quiz", desc: "Interactive Questions" },
              { num: 4, label: "Preview", desc: "Simulator Sandbox" },
            ].map((s) => {
              const active = step >= s.num;
              const current = step === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center">
                  <button
                    onClick={() => step > s.num && setStep(s.num)}
                    disabled={step < s.num}
                    className={`w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center transition-all ${
                      current
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                        : active
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {s.num}
                  </button>
                  <span className={`text-xs font-bold mt-2 ${active ? "text-slate-800" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">
                    {s.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Wizard Step Content */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm min-h-[400px]">
        {/* STEP 1: DETAILS */}
        {step === 1 && (
          <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Form */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Lesson Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Animal Names"
                      className="border-slate-200 mt-1.5 h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Unique Code (Optional)</Label>
                    <Input
                      value={formData.lessonCode}
                      onChange={(e) => setFormData((f) => ({ ...f, lessonCode: e.target.value }))}
                      placeholder="e.g. ENG-ANI-01"
                      className="border-slate-200 mt-1.5 h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">Intro text (Displays to student) *</Label>
                  <Input
                    value={formData.intro}
                    onChange={(e) => setFormData((f) => ({ ...f, intro: e.target.value }))}
                    placeholder="e.g. Meet friendly jungle friends and learn what they say."
                    className="border-slate-200 mt-1.5 h-10 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">Detailed Description (For Teachers/Parents)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Provide details about lesson objectives and skills target..."
                    className="border-slate-200 mt-1.5 rounded-xl min-h-[100px]"
                  />
                </div>

                {isEdit && (
                  <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl space-y-2">
                    <Label className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-amber-600" /> Change Log Note *
                    </Label>
                    <Input
                      value={changeNote}
                      onChange={(e) => setChangeNote(e.target.value)}
                      placeholder="e.g. Added cat slide, corrected spelling"
                      className="bg-white border-amber-200 focus:border-amber-500 focus:ring-amber-500 h-10 rounded-xl text-slate-700"
                    />
                    <p className="text-[10px] text-amber-600">
                      Creating a snapshot saves the previous version allowing rollback capability later.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Sidebar Metadata */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" /> Metadata & Status
                </h3>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5" /> Language *
                    </Label>
                    <Select
                      value={formData.languageId}
                      onValueChange={(val) => setFormData((f) => ({ ...f, languageId: val, levelId: "" }))}
                    >
                      <SelectTrigger className="bg-white border-slate-200 mt-1.5 h-10 rounded-xl">
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name} ({l.code.toUpperCase()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Level *
                    </Label>
                    <Select
                      value={formData.levelId}
                      onValueChange={(val) => setFormData((f) => ({ ...f, levelId: val }))}
                      disabled={!formData.languageId || isLoadingLevels}
                    >
                      <SelectTrigger className="bg-white border-slate-200 mt-1.5 h-10 rounded-xl">
                        {isLoadingLevels ? (
                          <span className="text-slate-400 text-xs">Loading levels...</span>
                        ) : (
                          <SelectValue placeholder="Select Level" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((lvl) => (
                          <SelectItem key={lvl.id} value={lvl.id}>
                            {lvl.name} ({lvl.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-bold text-slate-700">Emoji icon</Label>
                      <Input
                        value={formData.emoji}
                        onChange={(e) => setFormData((f) => ({ ...f, emoji: e.target.value }))}
                        className="bg-white border-slate-200 mt-1.5 h-9 rounded-xl text-center text-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700">Sort Order</Label>
                      <Input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                        className="bg-white border-slate-200 mt-1.5 h-9 rounded-xl text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700">Card Theme Gradient</Label>
                    <Select
                      value={formData.color}
                      onValueChange={(val) => setFormData((f) => ({ ...f, color: val }))}
                    >
                      <SelectTrigger className="bg-white border-slate-200 mt-1.5 h-9 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADIENTS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${g.value}`} />
                              <span>{g.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-3">
                    <div>
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Duration
                      </Label>
                      <Input
                        type="number"
                        value={formData.estimatedDuration}
                        onChange={(e) =>
                          setFormData((f) => ({ ...f, estimatedDuration: parseInt(e.target.value) || 0 }))
                        }
                        placeholder="Minutes"
                        className="bg-white border-slate-200 mt-1 h-9 rounded-xl text-center"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-slate-700">Difficulty</Label>
                      <Select
                        value={formData.difficulty}
                        onValueChange={(val: any) => setFormData((f) => ({ ...f, difficulty: val }))}
                      >
                        <SelectTrigger className="bg-white border-slate-200 mt-1 h-9 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700">Tags (Comma-separated)</Label>
                    <Input
                      value={formData.tags.join(", ")}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          tags: e.target.value
                            .split(",")
                            .map((t) => t.trim().toLowerCase())
                            .filter(Boolean),
                        }))
                      }
                      placeholder="e.g. animals, vocab, hindi"
                      className="bg-white border-slate-200 mt-1.5 h-9 rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-4">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-slate-700">Premium Content</Label>
                      <p className="text-[10px] text-slate-400">Lock for subscribed accounts</p>
                    </div>
                    <Switch
                      checked={formData.isPremium}
                      onCheckedChange={(val) => setFormData((f) => ({ ...f, isPremium: val }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CARDS */}
        {step === 2 && (
          <div className="animate-in fade-in duration-200">
            <CardBuilder
              cards={formData.cards}
              onChange={(cards) => setFormData((f) => ({ ...f, cards }))}
            />
          </div>
        )}

        {/* STEP 3: QUIZ */}
        {step === 3 && (
          <div className="animate-in fade-in duration-200">
            <QuizBuilder
              questions={formData.quiz}
              onChange={(quiz) => setFormData((f) => ({ ...f, quiz }))}
            />
          </div>
        )}

        {/* STEP 4: PREVIEW & SIMULATOR */}
        {step === 4 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
            <div className="space-y-4 pr-0 md:pr-4 border-r border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Sandbox Preview</h3>
              <p className="text-xs text-slate-500">
                You are playing the lesson using the **Simulated Learning View**. Change card parameters or quiz rules on steps 1-3 to modify output.
              </p>

              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Lesson Summary</h4>
                <div className="text-xs space-y-1.5 text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-800">Title:</span> {formData.title}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Language:</span> {selectedLang?.name || "Not set"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Total Cards:</span> {formData.cards.length}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Quiz Questions:</span> {formData.quiz.length}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Premium:</span> {formData.isPremium ? "Yes 👑" : "No"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <Button
                  onClick={() => handleSave(true)}
                  disabled={saveMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md font-bold h-11 flex items-center justify-center gap-1.5"
                >
                  🚀 Save & Publish immediately
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={saveMutation.isPending}
                  className="rounded-xl border-slate-200 text-slate-700 h-10"
                >
                  Save as Draft
                </Button>
              </div>
            </div>

            <div className="flex justify-center items-center">
              <LessonPreview lesson={{ ...formData, language: selectedLang }} />
            </div>
          </div>
        )}
      </div>

      {/* Footer Nav Controls */}
      <div className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        {step > 1 ? (
          <Button
            onClick={handleBack}
            variant="outline"
            className="rounded-xl border-slate-200 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button
            onClick={handleNext}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 flex items-center gap-1.5"
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
