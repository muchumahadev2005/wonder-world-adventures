import { useState } from "react";
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, GripVertical, Check, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AdminLessonCard } from "@/lib/adminApi";
import MediaPicker from "./MediaPicker";

interface CardBuilderProps {
  cards: AdminLessonCard[];
  onChange: (cards: AdminLessonCard[]) => void;
}

export default function CardBuilder({ cards, onChange }: CardBuilderProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [activeMediaTarget, setActiveMediaTarget] = useState<"edit" | "add" | null>(null);

  // Form states
  const [form, setForm] = useState<Partial<AdminLessonCard>>({
    word: "",
    translit: "",
    meaning: "",
    emoji: "",
    imageUrl: "",
  });

  const handleStartAdd = () => {
    setForm({
      word: "",
      translit: "",
      meaning: "",
      emoji: "",
      imageUrl: "",
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleStartEdit = (card: AdminLessonCard) => {
    setForm({ ...card });
    setEditingId(card.id);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!form.word?.trim()) return;

    if (isAdding) {
      const newCard: AdminLessonCard = {
        id: `temp_${Date.now()}`,
        word: form.word.trim(),
        translit: form.translit?.trim() || null,
        meaning: form.meaning?.trim() || null,
        emoji: form.emoji?.trim() || null,
        imageUrl: form.imageUrl || null,
        sortOrder: cards.length + 1,
      };
      onChange([...cards, newCard]);
      setIsAdding(false);
    } else if (editingId) {
      const updated = cards.map((c) =>
        c.id === editingId
          ? {
              ...c,
              word: form.word!.trim(),
              translit: form.translit?.trim() || null,
              meaning: form.meaning?.trim() || null,
              emoji: form.emoji?.trim() || null,
              imageUrl: form.imageUrl || null,
            }
          : c
      );
      onChange(updated);
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    const remaining = cards.filter((c) => c.id !== id);
    // Recalculate sort orders
    const sorted = remaining.map((c, idx) => ({ ...c, sortOrder: idx + 1 }));
    onChange(sorted);
  };

  // Reordering helpers
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const newCards = [...cards];
    const temp = newCards[idx];
    newCards[idx] = newCards[idx - 1];
    newCards[idx - 1] = temp;
    onChange(newCards.map((c, i) => ({ ...c, sortOrder: i + 1 })));
  };

  const moveDown = (idx: number) => {
    if (idx === cards.length - 1) return;
    const newCards = [...cards];
    const temp = newCards[idx];
    newCards[idx] = newCards[idx + 1];
    newCards[idx + 1] = temp;
    onChange(newCards.map((c, i) => ({ ...c, sortOrder: i + 1 })));
  };

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const newCards = [...cards];
    const [moved] = newCards.splice(sourceIndex, 1);
    newCards.splice(targetIndex, 0, moved);

    onChange(newCards.map((c, idx) => ({ ...c, sortOrder: idx + 1 })));
  };

  const handleMediaSelect = (url: string) => {
    setForm((f) => ({ ...f, imageUrl: url }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Lesson Cards ({cards.length})</h3>
          <p className="text-xs text-slate-500 mt-0.5">Define core terms, emojis, transliteration, and imagery. Drag to reorder.</p>
        </div>
        {!isAdding && !editingId && (
          <Button
            onClick={handleStartAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Card
          </Button>
        )}
      </div>

      {/* Form (Add or Edit) */}
      {(isAdding || editingId) && (
        <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="font-bold text-slate-700 text-sm">
            {isAdding ? "✨ Create New Card" : "✏️ Edit Card Details"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Card Word / Title *</Label>
                <Input
                  value={form.word}
                  onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
                  placeholder="e.g. Cat or Billi"
                  className="bg-white border-slate-200 mt-1 h-10 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-600">Subtitle / Transliteration (Optional)</Label>
                <Input
                  value={form.translit || ""}
                  onChange={(e) => setForm((f) => ({ ...f, translit: e.target.value }))}
                  placeholder="e.g. billi (Hindi transliteration)"
                  className="bg-white border-slate-200 mt-1 h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Card Emoji (Optional)</Label>
                <Input
                  value={form.emoji || ""}
                  onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                  placeholder="e.g. 🐱"
                  className="bg-white border-slate-200 mt-1 h-10 rounded-xl text-center text-lg"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-600">Image Asset (Optional)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={form.imageUrl || ""}
                    onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="URL or select from library"
                    className="bg-white border-slate-200 h-10 rounded-xl flex-1 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setActiveMediaTarget(isAdding ? "add" : "edit");
                      setMediaPickerOpen(true);
                    }}
                    className="h-10 rounded-xl px-3 border-slate-200 hover:bg-slate-50"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600">Meaning / Full Description (Optional)</Label>
            <Textarea
              value={form.meaning || ""}
              onChange={(e) => setForm((f) => ({ ...f, meaning: e.target.value }))}
              placeholder="e.g. A domestic small carnivorous mammal..."
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
              disabled={!form.word?.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 h-9 font-semibold flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Card
            </Button>
          </div>
        </div>
      )}

      {/* Cards List */}
      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30 text-slate-400">
          <span className="text-3xl mb-2">🃏</span>
          <p className="text-sm font-medium">No cards added yet</p>
          <p className="text-xs text-slate-400 mt-1">Cards will represent learning content slides inside the lesson.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {cards.map((card, idx) => {
            const isEditing = editingId === card.id;
            return (
              <div
                key={card.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, idx)}
                className={`group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-slate-300 transition-all ${
                  isEditing ? "ring-2 ring-indigo-500/20 border-indigo-500" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1 flex items-center justify-center">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.word} className="w-full h-full object-cover" />
                    ) : (
                      card.emoji || "📚"
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 text-sm truncate">{card.word}</span>
                    </div>
                    {card.translit && (
                      <p className="text-xs font-medium text-slate-400 italic mt-0.5 truncate">{card.translit}</p>
                    )}
                    {card.meaning && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{card.meaning}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
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
                    disabled={idx === cards.length - 1}
                    className="w-8 h-8 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartEdit(card)}
                    className="w-8 h-8 rounded-lg hover:bg-slate-50 text-indigo-500 hover:text-indigo-700"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(card.id)}
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

      {/* Media Picker Modal */}
      <MediaPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelect}
        selectedUrl={form.imageUrl}
      />
    </div>
  );
}
