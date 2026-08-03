/**
 * VoiceMicButton — Large circular microphone button with animated states.
 *
 * States:
 *  🎤  idle     → gentle amber pulse
 *  🔴  listening → red ring + ripple waves
 *  🟡  thinking  → amber spinner
 *  🔵  speaking  → blue glow
 */

import { motion } from "framer-motion";
import { Mic, Loader2, Volume2, MicOff } from "lucide-react";
import type { VoiceState } from "./VoiceStatus";

interface VoiceMicButtonProps {
  state: VoiceState;
  onClick: () => void;
  disabled?: boolean;
  isSupported?: boolean;
}

const stateStyles: Record<
  VoiceState,
  { bg: string; glow: string; ringColor: string }
> = {
  idle: {
    bg: "linear-gradient(135deg, #FF9E6E 0%, #E86CAD 50%, #A855F7 100%)",
    glow: "0 0 30px rgba(232,108,173,0.45), 0 8px 25px rgba(168,85,247,0.3)",
    ringColor: "rgba(255,158,110,0.3)",
  },
  listening: {
    bg: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
    glow: "0 0 40px rgba(239,68,68,0.6), 0 8px 25px rgba(220,38,38,0.4)",
    ringColor: "rgba(239,68,68,0.3)",
  },
  thinking: {
    bg: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    glow: "0 0 35px rgba(245,158,11,0.5), 0 8px 25px rgba(217,119,6,0.35)",
    ringColor: "rgba(245,158,11,0.3)",
  },
  speaking: {
    bg: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    glow: "0 0 40px rgba(59,130,246,0.55), 0 8px 25px rgba(37,99,235,0.4)",
    ringColor: "rgba(59,130,246,0.3)",
  },
};

const VoiceMicButton = ({
  state,
  onClick,
  disabled = false,
  isSupported = true,
}: VoiceMicButtonProps) => {
  const s = stateStyles[state];

  const Icon = () => {
    if (!isSupported) return <MicOff className="w-8 h-8 text-white" />;
    switch (state) {
      case "listening":
        return <Mic className="w-8 h-8 text-white" />;
      case "thinking":
        return (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        );
      case "speaking":
        return <Volume2 className="w-8 h-8 text-white" />;
      default:
        return <Mic className="w-8 h-8 text-white" />;
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Ripple rings for listening state */}
      {state === "listening" &&
        [1, 2, 3].map((i) => (
          <motion.div
            key={`ripple-${i}`}
            className="absolute rounded-full border-2"
            style={{
              width: 80,
              height: 80,
              borderColor: s.ringColor,
            }}
            animate={{
              scale: [1, 1.8 + i * 0.3],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeOut",
            }}
          />
        ))}

      {/* Idle pulse ring */}
      {state === "idle" && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 84,
            height: 84,
            border: `2px solid ${s.ringColor}`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Speaking glow pulse */}
      {state === "speaking" && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 88,
            height: 88,
            background: s.ringColor,
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.15, 0.4],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Main button */}
      <motion.button
        onClick={onClick}
        disabled={disabled || !isSupported}
        className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center border border-white/25 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: s.bg,
          boxShadow: s.glow,
        }}
        whileHover={!disabled && isSupported ? { scale: 1.08 } : {}}
        whileTap={!disabled && isSupported ? { scale: 0.92 } : {}}
        aria-label={
          state === "listening"
            ? "Stop listening"
            : state === "speaking"
            ? "Stop speaking"
            : "Start voice input"
        }
        title={
          state === "listening"
            ? "Click to stop listening"
            : state === "speaking"
            ? "Click to stop voice"
            : "Click to talk"
        }
      >
        <Icon />
      </motion.button>
    </div>
  );
};

export default VoiceMicButton;
