/**
 * TranscriptBubble — A single conversation bubble for the voice transcript.
 *
 * User bubbles on the right, Teacher bubbles on the left.
 * Glassmorphism styling consistent with existing chat bubbles.
 */

import { motion } from "framer-motion";
import { User } from "lucide-react";

interface TranscriptBubbleProps {
  role: "user" | "teacher";
  text: string;
}

const TranscriptBubble = ({ role, text }: TranscriptBubbleProps) => {
  const isUser = role === "user";

  return (
    <motion.div
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* No avatar icons on the side */}

      {/* Bubble */}
      <div
        className={`px-4 py-2.5 max-w-[85%] sm:max-w-[75%] rounded-2xl border border-white/30 backdrop-blur-md ${
          isUser ? "bg-primary/20 text-white" : "bg-white/10 text-white"
        }`}
        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
      >
        <p className="text-sm font-body whitespace-pre-line leading-relaxed">
          {text}
        </p>
      </div>
    </motion.div>
  );
};

export default TranscriptBubble;
