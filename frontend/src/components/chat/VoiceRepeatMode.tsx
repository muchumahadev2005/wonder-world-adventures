/**
 * VoiceRepeatMode — "Talking Tom" style voice echo for children.
 *
 * Flow:
 *   idle → listening (useVoiceRecorder) → speaking (speakText) → idle
 *
 * CRITICAL:
 *   - Reuses EXISTING useVoiceRecorder hook for STT
 *   - Reuses EXISTING speakText/stopSpeaking from tts.service.ts for TTS
 *   - NEVER calls contentApi.chat() or any AI/LLM/OpenRouter API
 *   - Only speaks the FINALIZED transcript (not interim results)
 *   - STT and TTS are mutually exclusive
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Square } from "lucide-react";
import { speakText, stopSpeaking } from "@/lib/tts.service";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

import VoiceRepeatCharacter from "./VoiceRepeatCharacter";
import VoiceMicButton from "./VoiceMicButton";
import VoiceStatus from "./VoiceStatus";
import type { VoiceState } from "./VoiceStatus";

// ── Component ─────────────────────────────────────────────────────

const VoiceRepeatMode = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [displayText, setDisplayText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Existing STT hook — same one used by InteractiveMode / AI Teacher
  const {
    isSupported,
    isListening,
    transcript: speechText,
    startListening,
    stopListening,
    error: speechError,
  } = useVoiceRecorder("en-US");

  // Track whether we've already processed the current transcript
  const hasProcessed = useRef(false);

  // ── Sync voice state with STT hook ──────────────────────────────
  useEffect(() => {
    if (isListening) {
      setVoiceState("listening");
      hasProcessed.current = false;
    }
  }, [isListening]);

  // ── Handle finalized STT → TTS (only when listening stops) ─────
  useEffect(() => {
    if (isListening) return; // Still listening — wait for final result
    if (hasProcessed.current) return; // Already processed this transcript

    const finalText = speechText.trim();
    if (!finalText) {
      // If we were listening and got no text, show friendly message
      if (voiceState === "listening") {
        setError("I didn't catch that. Speak a little louder! 📢");
        setVoiceState("idle");
      }
      return;
    }

    // Mark as processed to prevent re-triggering
    hasProcessed.current = true;

    // Display the recognized text
    setDisplayText(finalText);
    setError(null);

    // Transition to speaking state and pass DIRECTLY to TTS
    // NO contentApi.chat(). NO OpenRouter. Just echo.
    setVoiceState("speaking");
    speakText(finalText, "en", {
      rate: 0.9,
      onEnd: () => setVoiceState("idle"),
      onError: () => {
        setError("Oops! I can't speak right now. Try again! 🔇");
        setVoiceState("idle");
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  // ── Surface STT errors as child-friendly messages ──────────────
  useEffect(() => {
    if (speechError) {
      // Map technical errors to child-friendly messages
      if (speechError.includes("permission")) {
        setError("Please allow microphone access 🎤");
      } else if (speechError.includes("not supported")) {
        setError("Your browser doesn't support voice recognition. Try Chrome! 🌐");
      } else if (speechError.includes("No speech")) {
        setError("I couldn't hear you. Try again! 👂");
      } else {
        setError("Something went wrong. Let's try again! 🔄");
      }
      setVoiceState("idle");
    }
  }, [speechError]);

  // ── Cleanup on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [stopListening]);

  // ── Stop all voice activity ────────────────────────────────────
  const handleStopVoice = useCallback(() => {
    stopSpeaking();
    stopListening();
    setVoiceState("idle");
  }, [stopListening]);

  // ── Mic button handler ─────────────────────────────────────────
  const handleMicClick = useCallback(() => {
    if (voiceState === "listening") {
      // User wants to stop listening
      handleStopVoice();
      return;
    }
    if (voiceState === "speaking") {
      // User starts new recording while TTS is playing — stop TTS first
      stopSpeaking();
      setVoiceState("idle");
      // Small delay to ensure TTS cleanup, then start fresh
      setTimeout(() => {
        setError(null);
        setDisplayText("");
        startListening();
      }, 50);
      return;
    }
    if (voiceState === "idle") {
      setError(null);
      setDisplayText("");
      startListening();
      return;
    }
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

      {/* Rive owl character — tap to stop if playing/listening */}
      <motion.div
        className={`mb-2 ${
          voiceState === "speaking" || voiceState === "listening"
            ? "cursor-pointer hover:opacity-90"
            : ""
        }`}
        onClick={
          voiceState === "speaking" || voiceState === "listening"
            ? handleStopVoice
            : undefined
        }
        title={
          voiceState === "speaking" || voiceState === "listening"
            ? "Click to stop"
            : undefined
        }
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
      >
        <VoiceRepeatCharacter
          isSpeaking={voiceState === "speaking"}
          isListening={voiceState === "listening"}
        />
      </motion.div>

      {/* Title */}
      <motion.p
        className="font-display font-bold text-white text-base mb-1 drop-shadow-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Voice Repeat
      </motion.p>

      {/* Voice status indicator */}
      <div className="mb-2">
        <VoiceStatus state={voiceState} />
      </div>

      {/* Recognized text display */}
      <AnimatePresence>
        {displayText && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="mb-3 px-5 py-3 rounded-2xl max-w-[280px] text-center border border-white/20"
            style={{
              background:
                "linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(232,108,173,0.15) 100%)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 4px 20px rgba(168,85,247,0.15)",
            }}
          >
            <p className="text-[10px] text-white/50 font-display font-bold uppercase tracking-wider mb-1">
              {voiceState === "speaking" ? "🔊 Repeating" : "You said"}
            </p>
            <p className="text-white font-display font-bold text-lg leading-snug">
              "{displayText}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instruction text when idle and no transcript yet */}
      {voiceState === "idle" && !displayText && !error && (
        <motion.p
          className="text-white/40 text-xs font-display mb-3 text-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Say something and I'll repeat it! 🦉
        </motion.p>
      )}

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
          disabled={false}
          isSupported={isSupported}
        />
      </motion.div>

      {/* Stop button when speaking or listening */}
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
            {voiceState === "speaking" ? "Stop Speaking ⏹️" : "Stop Listening ⏹️"}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceRepeatMode;
