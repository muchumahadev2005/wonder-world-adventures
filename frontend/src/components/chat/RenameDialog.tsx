/**
 * RenameDialog.tsx — Glassmorphism modal for renaming a chat session.
 * Matches the existing StoryNest dark-glass aesthetic.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, X, Check } from "lucide-react";

interface RenameDialogProps {
  open:          boolean;
  currentTitle:  string;
  onConfirm:     (newTitle: string) => void;
  onClose:       () => void;
}

const RenameDialog = ({ open, currentTitle, onConfirm, onClose }: RenameDialogProps) => {
  const [value, setValue] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(currentTitle);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [open, currentTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl border border-white/20 p-6 shadow-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(30,15,60,0.95) 0%, rgba(20,10,40,0.98) 100%)",
              }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-300">
                  <Pencil className="w-4 h-4" />
                  <span className="font-display font-bold text-white text-base">Rename Chat</span>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/40 hover:text-white/80 transition-colors rounded-lg p-1"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value.slice(0, 80))}
                  placeholder="Chat title…"
                  maxLength={80}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400/60 text-sm font-body mb-4"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 rounded-xl border border-white/20 text-white/60 text-sm font-bold hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!value.trim()}
                    className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 hover:opacity-90 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RenameDialog;
