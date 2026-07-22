/**
 * VoiceStatus — Animated text indicator showing the current voice state.
 *
 * States: idle | listening | thinking | speaking
 */

import { motion, AnimatePresence } from "framer-motion";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

interface VoiceStatusProps {
  state: VoiceState;
}

const statusConfig: Record<
  VoiceState,
  { label: string; color: string; showDots: boolean }
> = {
  idle: {
    label: "Tap the microphone to talk",
    color: "rgba(255,255,255,0.5)",
    showDots: false,
  },
  listening: {
    label: "Listening",
    color: "#F87171",
    showDots: true,
  },
  thinking: {
    label: "Thinking",
    color: "#FBBF24",
    showDots: true,
  },
  speaking: {
    label: "Speaking",
    color: "#60A5FA",
    showDots: true,
  },
};

const VoiceStatus = ({ state }: VoiceStatusProps) => {
  const cfg = statusConfig[state];

  return (
    <div className="flex items-center justify-center gap-1 h-6">
      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          className="text-sm font-display font-bold"
          style={{ color: cfg.color }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {cfg.label}
        </motion.span>
      </AnimatePresence>

      {/* Animated dots */}
      {cfg.showDots && (
        <div className="flex gap-0.5 ml-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: cfg.color }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceStatus;
