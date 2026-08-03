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
import { speakText, stopSpeaking, getAvailableVoices } from "@/lib/tts.service";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

import { Square } from "lucide-react";
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
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
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

  // Clean up audio & listening when unmounting or switching tabs
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [stopListening]);

  // ── Load available voices ────────────────────────────────────────
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = getAvailableVoices();
      // Filter for English voices to present clean, readable choices
      const english = allVoices.filter((v) => v.lang.startsWith("en"));
      const list = english.length > 0 ? english : allVoices;
      setVoices(list);

      // Pre-select Google or natural sounding English voice if available, otherwise first item
      if (list.length > 0) {
        const preferred = list.find(
          (v) => v.name.includes("Google") || v.name.includes("Natural") || v.lang === "en-US"
        );
        setSelectedVoice(preferred ? preferred.name : list[0].name);
      }
    };

    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

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
          voice: selectedVoice || undefined,
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
    [token, sessionId, selectedVoice]
  );

  // ── Stop Voice / Stop Listening handler ──────────────────────
  const handleStopVoice = useCallback(() => {
    stopSpeaking();
    stopListening();
    setVoiceState("idle");
  }, [stopListening]);

  // ── Mic button handler ──────────────────────────────────────────
  const handleMicClick = useCallback(() => {
    if (voiceState === "listening" || voiceState === "speaking") {
      handleStopVoice();
      return;
    }
    if (voiceState === "idle") {
      setError(null);
      startListening();
      return;
    }
    // thinking — do nothing
  }, [voiceState, startListening, handleStopVoice]);

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

      {/* Teacher illustration — tap to stop voice if playing */}
      <motion.div
        className={`mb-2 ${voiceState === "speaking" || voiceState === "listening" ? "cursor-pointer hover:opacity-90" : ""}`}
        onClick={voiceState === "speaking" || voiceState === "listening" ? handleStopVoice : undefined}
        title={voiceState === "speaking" || voiceState === "listening" ? "Click to stop voice" : undefined}
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
      <div className="mb-4">
        <VoiceStatus state={voiceState} />
      </div>

      {/* Microphone button */}
      <motion.div
        className="mb-3"
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

      {/* Dedicated explicit Stop Voice / Stop Listening button */}
      <AnimatePresence>
        {(voiceState === "speaking" || voiceState === "listening") && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 6 }}
            onClick={handleStopVoice}
            className="mb-4 px-5 py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-display font-bold text-xs shadow-lg shadow-red-500/40 border border-red-400/40 flex items-center gap-2 transition-all active:scale-95 cursor-pointer z-20"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            {voiceState === "speaking" ? "Stop Voice ⏹️" : "Stop Listening ⏹️"}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Voice selection dropdown */}
      {voices.length > 0 && (
        <motion.div
          className="mt-2 flex flex-col items-center gap-1.5 w-full max-w-[240px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="text-[11px] font-display font-bold text-white/50 tracking-wider uppercase">
            Choose Teacher Voice
          </label>
          <div className="relative w-full">
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-white/20 text-xs font-semibold text-white/90 bg-white/10 backdrop-blur-md outline-none cursor-pointer hover:bg-white/20 transition-all appearance-none shadow-sm"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)",
              }}
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name} className="text-gray-900 bg-white">
                  {v.name.replace("Microsoft", "MS").replace("Google", "")} ({v.lang})
                </option>
              ))}
            </select>
            {/* Custom arrow decorator */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/40">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </motion.div>
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
