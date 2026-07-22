/**
 * InteractiveMode — Voice-first conversation UI.
 *
 * Flow:
 *   idle → listening (Web Speech API) → thinking (contentApi.chat) → speaking (tts.service) → idle
 *
 * CRITICAL: Reuses the EXACT same backend as ChatMode:
 *   - contentApi.chat() for AI responses (same OpenRouter integration)
 *   - tts.service.ts for speech output
 *   - Same session ID, same token, same authentication
 *
 * No new APIs. No duplicate logic. No mock AI.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { contentApi } from "@/lib/api";
import { speakText, stopSpeaking } from "@/lib/tts.service";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

import AITeacher from "./AITeacher";
import VoiceMicButton from "./VoiceMicButton";
import VoiceStatus from "./VoiceStatus";
import TranscriptBubble from "./TranscriptBubble";
import type { VoiceState } from "./VoiceStatus";

// ── Transcript entry type ────────────────────────────────────────

interface TranscriptEntry {
  role: "user" | "teacher";
  text: string;
}

// ── Props ─────────────────────────────────────────────────────────

interface InteractiveModeProps {
  sessionId: string;
}

// ── Component ─────────────────────────────────────────────────────

const InteractiveMode = ({ sessionId }: InteractiveModeProps) => {
  const { token } = useAuth();
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Web Speech API hook
  const {
    isSupported,
    isListening,
    transcript: speechText,
    startListening,
    stopListening,
    error: speechError,
  } = useVoiceRecorder("en-US");

  // Track previous speechText to detect when recognition ends
  const prevSpeechText = useRef("");
  const hasProcessed = useRef(false);

  // Auto-scroll transcript
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [transcript]);

  // ── Speech recognition → send to existing API ────────────────────
  // When listening stops AND we have text, send it through contentApi.chat()
  useEffect(() => {
    if (isListening) {
      // Currently listening — reset processed flag
      hasProcessed.current = false;
      prevSpeechText.current = speechText;
      return;
    }

    // Listening just stopped
    const finalText = speechText.trim();
    if (!finalText || hasProcessed.current) return;
    hasProcessed.current = true;

    // Send to existing backend
    handleSendToAI(finalText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  // Update voice state from hook
  useEffect(() => {
    if (isListening) setVoiceState("listening");
  }, [isListening]);

  // Surface speech errors
  useEffect(() => {
    if (speechError) {
      setError(speechError);
      setVoiceState("idle");
    }
  }, [speechError]);

  // ── Send to EXISTING contentApi.chat() — same OpenRouter backend ──
  const handleSendToAI = useCallback(
    async (text: string) => {
      // Add user transcript
      setTranscript((prev) => [...prev, { role: "user", text }]);
      setVoiceState("thinking");
      setError(null);

      try {
        // EXACT same API call as ChatMode — same endpoint, same session, same auth
        const data = await contentApi.chat(text, token, sessionId);
        const reply = data.reply;

        // Add teacher transcript
        setTranscript((prev) => [...prev, { role: "teacher", text: reply }]);

        // Speak the response using EXISTING tts.service.ts (emoji-stripped)
        setVoiceState("speaking");
        speakText(stripEmojis(reply), "en", {
          rate: 0.9,
          onEnd: () => setVoiceState("idle"),
          onError: () => setVoiceState("idle"),
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to get response";
        setError(message);
        setTranscript((prev) => [
          ...prev,
          {
            role: "teacher",
            text: "Oops! I'm having trouble right now. Please try again! 🧑‍🏫",
          },
        ]);
        setVoiceState("idle");
      }
    },
    [token, sessionId]
  );

  // ── Mic button handler ──────────────────────────────────────────
  const handleMicClick = useCallback(() => {
    if (voiceState === "listening") {
      stopListening();
      return;
    }
    if (voiceState === "speaking") {
      // Stop TTS and return to idle
      stopSpeaking();
      setVoiceState("idle");
      return;
    }
    if (voiceState === "idle") {
      setError(null);
      startListening();
      return;
    }
    // thinking — do nothing
  }, [voiceState, startListening, stopListening]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center flex-1 min-h-0">
      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-3 px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-xs text-center w-full"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teacher illustration */}
      <motion.div
        className="mb-2"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
      >
        <AITeacher
          isSpeaking={voiceState === "speaking"}
          isListening={voiceState === "listening"}
          isThinking={voiceState === "thinking"}
        />
      </motion.div>

      {/* Teacher title */}
      <motion.p
        className="font-display font-bold text-white text-base mb-1 drop-shadow-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        AI Teacher
      </motion.p>

      {/* Voice status */}
      <div className="mb-5">
        <VoiceStatus state={voiceState} />
      </div>

      {/* Microphone button */}
      <motion.div
        className="mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, delay: 0.3 }}
      >
        <VoiceMicButton
          state={voiceState}
          onClick={handleMicClick}
          disabled={voiceState === "thinking"}
          isSupported={isSupported}
        />
      </motion.div>

      {/* Browser support warning */}
      {!isSupported && (
        <p className="text-amber-300/80 text-xs text-center mb-3 px-4">
          ⚠️ Voice input isn't supported in this browser. Please use Chrome for
          the best experience.
        </p>
      )}

      {/* Live transcript removed from UI - kept internally */}
    </div>
  );
};

// Helper to strip emoji characters so they aren't spoken by the TTS engine
const stripEmojis = (str: string): string => {
  return str.replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F191}-\u{1F251}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F0F5}]|[\u{1F004}]|[\u{1F170}-\u{1F190}]/gu, "");
};

export default InteractiveMode;
