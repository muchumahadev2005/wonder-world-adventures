import { useState } from "react";
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, GripVertical, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminQuizQuestion } from "@/lib/adminApi";
import { toast } from "sonner";

interface QuizBuilderProps {
  questions: AdminQuizQuestion[];
  onChange: (questions: AdminQuizQuestion[]) => void;
}

export default function QuizBuilder({ questions, onChange }: QuizBuilderProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [points, setPoints] = useState(10);
  const [emoji, setEmoji] = useState("");
  const [type, setType] = useState("mcq");

  const handleStartAdd = () => {
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
    setExplanation("");
    setPoints(10);
    setEmoji("");
    setType("mcq");
    setIsAdding(true);
    setEditingId(null);
  };

  const handleStartEdit = (q: AdminQuizQuestion) => {
    setQuestionText(q.question);
    setOptions(q.options && q.options.length >= 2 ? [...q.options] : ["", "", "", ""]);
    setCorrectAnswer(q.answer);
    setExplanation(q.explanation || "");
    setPoints(q.points || 10);
    setEmoji(q.emoji || "");
    setType(q.type || "mcq");
    setEditingId(q.id);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!questionText.trim()) {
      toast.error("Question text is required");
      return;
    }

    const filteredOptions = options.map(o => o.trim()).filter(Boolean);
    if (filteredOptions.length < 2) {
      toast.error("Provide at least 2 options for the multiple choice question");
      return;
    }

    if (!correctAnswer.trim()) {
      toast.error("Please specify which option is the correct answer");
      return;
    }

    if (!filteredOptions.includes(correctAnswer.trim())) {
      toast.error("Correct answer must exactly match one of the options");
      return;
    }

    if (isAdding) {
      const newQuestion: AdminQuizQuestion = {
        id: `temp_${Date.now()}`,
        question: questionText.trim(),
        options: filteredOptions,
        answer: correctAnswer.trim(),
        explanation: explanation.trim() || null,
        emoji: emoji.trim() || null,
        type,
        points: Number(points) || 10,
        sortOrder: questions.length + 1,
      };
      onChange([...questions, newQuestion]);
      setIsAdding(false);
    } else if (editingId) {
      const updated = questions.map((q) =>
        q.id === editingId
          ? {
              ...q,
              question: questionText.trim(),
              options: filteredOptions,
              answer: correctAnswer.trim(),
              explanation: explanation.trim() || null,
              emoji: emoji.trim() || null,
              type,
              points: Number(points) || 10,
            }
          : q
      );
      onChange(updated);
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    const remaining = questions.filter((q) => q.id !== id);
    const sorted = remaining.map((q, idx) => ({ ...q, sortOrder: idx + 1 }));
    onChange(sorted);
  };

  // Reordering helpers
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const newQuestions = [...questions];
    const temp = newQuestions[idx];
    newQuestions[idx] = newQuestions[idx - 1];
    newQuestions[idx - 1] = temp;
    onChange(newQuestions.map((q, i) => ({ ...q, sortOrder: i + 1 })));
  };

  const moveDown = (idx: number) => {
    if (idx === questions.length - 1) return;
    const newQuestions = [...questions];
    const temp = newQuestions[idx];
    newQuestions[idx] = newQuestions[idx + 1];
    newQuestions[idx + 1] = temp;
    onChange(newQuestions.map((q, i) => ({ ...q, sortOrder: i + 1 })));
  };

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const newQuestions = [...questions];
    const [moved] = newQuestions.splice(sourceIndex, 1);
    newQuestions.splice(targetIndex, 0, moved);

    onChange(newQuestions.map((q, idx) => ({ ...q, sortOrder: idx + 1 })));
  };

  const handleOptionChange = (val: string, index: number) => {
    const next = [...options];
    next[index] = val;
    setOptions(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Quiz Questions ({questions.length})</h3>
          <p className="text-xs text-slate-500 mt-0.5">Test what the student learned in the lesson cards. Drag to reorder.</p>
        </div>
        {!isAdding && !editingId && (
          <Button
            onClick={handleStartAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Question
          </Button>
        )}
      </div>

      {/* Form (Add or Edit) */}
      {(isAdding || editingId) && (
        <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="font-bold text-slate-700 text-sm">
            {isAdding ? "✨ Create New Quiz Question" : "✏️ Edit Quiz Question Details"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Question Text *</Label>
                <Input
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. Which of the following means 'Cat'?"
                  className="bg-white border-slate-200 mt-1 h-10 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((option, idx) => (
                  <div key={idx}>
                    <Label className="text-xs font-semibold text-slate-500">
                      Option {String.fromCharCode(65 + idx)} *
                    </Label>
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(e.target.value, idx)}
                      placeholder={`e.g. Option ${String.fromCharCode(65 + idx)}`}
                      className="bg-white border-slate-200 mt-1 h-9 rounded-xl"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Correct Answer *</Label>
                <Select value={correctAnswer} onValueChange={setCorrectAnswer}>
                  <SelectTrigger className="bg-white border-slate-200 mt-1 h-10 rounded-xl">
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt, idx) => {
                      const trimmed = opt.trim();
                      if (!trimmed) return null;
                      return (
                        <SelectItem key={idx} value={trimmed}>
                          {String.fromCharCode(65 + idx)}: {trimmed}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Points</Label>
                  <Input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                    className="bg-white border-slate-200 mt-1 h-9 rounded-xl text-center"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Emoji (Optional)</Label>
                  <Input
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    placeholder="🧠"
                    className="bg-white border-slate-200 mt-1 h-9 rounded-xl text-center text-lg"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-600">Question Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-white border-slate-200 mt-1 h-9 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600">Explanation for Correct Answer (Optional)</Label>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why this option is correct to aid learning..."
              className="bg-white border-slate-200 mt-1 rounded-xl min-h-[60px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="rounded-xl font-semibold hover:bg-slate-100 text-slate-600 h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 h-9 font-semibold flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Question
            </Button>
          </div>
        </div>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30 text-slate-400">
          <span className="text-3xl mb-2">❓</span>
          <p className="text-sm font-medium">No quiz questions added yet</p>
          <p className="text-xs text-slate-400 mt-1">Quiz questions are presented at the end of the lesson to assess comprehension.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {questions.map((q, idx) => {
            const isEditing = editingId === q.id;
            return (
              <div
                key={q.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, idx)}
                className={`group flex items-start justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-slate-300 transition-all ${
                  isEditing ? "ring-2 ring-indigo-500/20 border-indigo-500" : ""
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1 mt-1 flex items-center justify-center">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div className="w-9 h-9 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-center text-lg flex-shrink-0">
                    {q.emoji || "❓"}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                        {q.points} Points
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 text-sm mt-1">{q.question}</p>

                    {/* Options list */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 mt-2 max-w-lg">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = opt === q.answer;
                          return (
                            <div
                              key={oIdx}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                                isCorrect
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold"
                                  : "bg-slate-50 border-slate-100 text-slate-600"
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-[9px] text-slate-500 shadow-sm flex-shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="truncate">{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-slate-400 mt-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-500">Explanation:</span> {q.explanation}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="w-8 h-8 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveDown(idx)}
                    disabled={idx === questions.length - 1}
                    className="w-8 h-8 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartEdit(q)}
                    className="w-8 h-8 rounded-lg hover:bg-slate-50 text-indigo-500 hover:text-indigo-700"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(q.id)}
                    className="w-8 h-8 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
