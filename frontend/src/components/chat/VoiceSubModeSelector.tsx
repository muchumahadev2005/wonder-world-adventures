/**
 * VoiceSubModeSelector — Compact pill toggle for Voice Repeat vs AI Teacher.
 *
 * Rendered inside the Interactive tab as a sub-mode selector.
 * Uses the same glassmorphism/gradient style as SegmentedTabs.
 */

import { motion } from "framer-motion";

export type VoiceSubMode = "repeat" | "teacher";

interface VoiceSubModeSelectorProps {
  activeMode: VoiceSubMode;
  onChange: (mode: VoiceSubMode) => void;
}

const modes: { value: VoiceSubMode; label: string; icon: string }[] = [
  { value: "repeat", label: "Voice Repeat", icon: "🐰" },
  { value: "teacher", label: "AI Teacher", icon: "🧑‍🏫" },
];

const VoiceSubModeSelector = ({
  activeMode,
  onChange,
}: VoiceSubModeSelectorProps) => {
  return (
    <div
      className="relative flex w-full max-w-[280px] mx-auto rounded-full p-1 select-none"
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow:
          "0 2px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {modes.map((mode) => {
        const isActive = activeMode === mode.value;
        return (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className="relative flex-1 z-10 flex items-center justify-center gap-1 py-2 px-3 rounded-full font-display font-bold text-xs transition-colors duration-200"
            style={{
              color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
            }}
          >
            {/* Animated active indicator */}
            {isActive && (
              <motion.div
                layoutId="voice-submode-indicator"
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #A855F7 0%, #E86CAD 50%, #FF9E6E 100%)",
                  boxShadow:
                    "0 3px 12px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
            <span className="relative z-10 text-sm">{mode.icon}</span>
            <span className="relative z-10 truncate">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default VoiceSubModeSelector;
