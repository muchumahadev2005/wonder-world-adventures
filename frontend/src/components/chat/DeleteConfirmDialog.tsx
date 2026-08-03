/**
 * DeleteConfirmDialog.tsx — Confirmation dialog before soft-deleting a session.
 * Matches the existing StoryNest dark-glass aesthetic.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X } from "lucide-react";

interface DeleteConfirmDialogProps {
  open:      boolean;
  title:     string;
  onConfirm: () => void;
  onClose:   () => void;
}

const DeleteConfirmDialog = ({ open, title, onConfirm, onClose }: DeleteConfirmDialogProps) => (
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
              background: "linear-gradient(135deg, rgba(60,10,10,0.96) 0%, rgba(20,5,5,0.98) 100%)",
            }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon + header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <span className="font-display font-bold text-white text-base">Delete Chat?</span>
              </div>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white/80 transition-colors rounded-lg p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-white/60 text-sm mb-1 font-body">
              This will permanently delete:
            </p>
            <p className="text-white/90 text-sm font-bold mb-5 font-body truncate">
              "{title}"
            </p>
            <p className="text-white/40 text-xs mb-5 font-body">
              All messages in this conversation will be removed.
            </p>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-xl border border-white/20 text-white/60 text-sm font-bold hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default DeleteConfirmDialog;
