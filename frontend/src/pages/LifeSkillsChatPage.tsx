/**
 * LifeSkillsChatPage — Voice-only speaking agent for Life Skills Practice.
 *
 * UX (matches screenshot):
 *   - Character illustration + name shown prominently (no text chat)
 *   - "Tap the microphone to talk" status label
 *   - Large animated microphone button
 *   - User speaks → STT → sent to Life Skills backend (no RAG) → TTS speaks reply
 *   - Character animates while speaking / listening / thinking
 *
 * Reuses:
 *   - AITeacher illustration component (animated states)
 *   - VoiceMicButton (pulse / ripple / glow per state)
 *   - VoiceStatus (animated label)
 *   - useVoiceRecorder hook (Web Speech API)
 *   - speakText / stopSpeaking from tts.service.ts
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "@/components/NavBar";
import AITeacher from "@/components/chat/AITeacher";
import VoiceMicButton from "@/components/chat/VoiceMicButton";
import VoiceStatus from "@/components/chat/VoiceStatus";
import type { VoiceState } from "@/components/chat/VoiceStatus";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { speakText, stopSpeaking, getAvailableVoices } from "@/lib/tts.service";
import { lifeSkillsApi, type ChatHistoryItem } from "@/lib/lifeSkillsApi";
import { ArrowLeft, RefreshCw, Square } from "lucide-react";

// ── Emoji stripper (so TTS doesn't read emoji names) ─────────────

const stripEmojis = (str: string): string =>
  str.replace(
    /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F191}-\u{1F251}]|[\u{1F900}-\u{1F9FF}]/gu,
    ""
  );

// ── Character avatar — emoji or AI Teacher illustration ───────────

interface CharacterDisplayProps {
  avatar: string | null | undefined;
  gradient: string;
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
}

const CharacterDisplay = ({
  avatar,
  isSpeaking,
  isListening,
  isThinking,
}: CharacterDisplayProps) => {
  // If no custom avatar text, use the AI Teacher illustration
  if (!avatar) {
    return (
      <AITeacher
        isSpeaking={isSpeaking}
        isListening={isListening}
        isThinking={isThinking}
      />
    );
  }

  // Emoji-based character avatar with animated states
  const getAnimation = () => {
    if (isSpeaking) return { y: [0, -6, 0, -3, 0], scale: [1, 1.05, 1, 1.02, 1] };
    if (isListening) return { scale: [1, 1.06, 1], rotate: [0, -2, 0] };
    if (isThinking) return { rotate: [0, 2, -2, 0], scale: [1, 1.02, 1] };
    return { y: [0, -4, 0], scale: [1, 1.008, 1] };
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Soft halo */}
      <div
        className="absolute w-48 h-48 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,180,100,0.2) 0%, rgba(168,85,247,0.1) 50%, transparent 70%)",
          filter: "blur(24px)",
        }}
      />

      {/* Sound waves when speaking */}
      {isSpeaking &&
        [1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-blue-400/20"
            style={{ width: 120 + i * 28, height: 120 + i * 28 }}
            animate={{ scale: [1, 1.18], opacity: [0.4, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3, ease: "easeOut" }}
          />
        ))}

      <motion.div
        className="relative z-10 text-[120px] leading-none select-none"
        animate={getAnimation()}
        transition={{
          duration: isSpeaking ? 0.6 : isListening ? 2 : isThinking ? 1.5 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {avatar}
      </motion.div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────

export default function LifeSkillsChatPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const historyRef = useRef<ChatHistoryItem[]>([]);
  const hasProcessed = useRef(false);

  // ── Fetch scenario metadata ────────────────────────────────────
  const { data: scenario, isLoading, isError } = useQuery({
    queryKey: ["life-skill-scenario", slug],
    queryFn: () => lifeSkillsApi.getScenario(slug!),
    enabled: !!slug,
  });

  // ── Voice recorder hook ────────────────────────────────────────
  const {
    isSupported,
    isListening,
    transcript: speechText,
    startListening,
    stopListening,
    error: speechError,
  } = useVoiceRecorder("en-US");

  // ── Load TTS voices ────────────────────────────────────────────
  useEffect(() => {
    const loadVoices = () => {
      const all = getAvailableVoices();
      const en = all.filter((v) => v.lang.startsWith("en"));
      const list = en.length > 0 ? en : all;
      setVoices(list);
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

  // ── Sync listening state ───────────────────────────────────────
  useEffect(() => {
    if (isListening) setVoiceState("listening");
  }, [isListening]);

  // ── Surface speech errors ──────────────────────────────────────
  useEffect(() => {
    if (speechError) {
      setError(speechError);
      setVoiceState("idle");
    }
  }, [speechError]);

  // ── When listening stops → send to Life Skills API ────────────
  useEffect(() => {
    if (isListening) {
      hasProcessed.current = false;
      return;
    }
    const finalText = speechText.trim();
    if (!finalText || hasProcessed.current) return;
    hasProcessed.current = true;
    handleSendToLLM(finalText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  // ── Cleanup on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [stopListening]);

  // ── Send to Life Skills LLM (no RAG) ──────────────────────────
  const handleSendToLLM = useCallback(
    async (text: string) => {
      if (!slug) return;
      setVoiceState("thinking");
      setError(null);

      // Keep last 10 turns as context
      historyRef.current = [
        ...historyRef.current,
        { role: "user" as const, content: text },
      ].slice(-10);

      try {
        const result = await lifeSkillsApi.chat(
          slug,
          text,
          historyRef.current.slice(0, -1) // send history before this message
        );

        const reply = result.reply;
        historyRef.current = [
          ...historyRef.current,
          { role: "assistant" as const, content: reply },
        ].slice(-10);

        setVoiceState("speaking");
        speakText(stripEmojis(reply), "en", {
          rate: 0.9,
          voice: selectedVoice || undefined,
          onEnd: () => setVoiceState("idle"),
          onError: () => setVoiceState("idle"),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        setVoiceState("idle");
      }
    },
    [slug, selectedVoice]
  );

  // ── Stop everything ────────────────────────────────────────────
  const handleStop = useCallback(() => {
    stopSpeaking();
    stopListening();
    setVoiceState("idle");
  }, [stopListening]);

  // ── Mic button click ───────────────────────────────────────────
  const handleMicClick = useCallback(() => {
    if (voiceState === "listening" || voiceState === "speaking") {
      handleStop();
      return;
    }
    if (voiceState === "idle") {
      setError(null);
      startListening();
    }
    // thinking — do nothing
  }, [voiceState, startListening, handleStop]);

  // ── Reset conversation history ─────────────────────────────────
  const handleReset = useCallback(() => {
    handleStop();
    historyRef.current = [];
    setError(null);
  }, [handleStop]);

  // ── Loading / error states ─────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg, #0F1B3D 0%, #1A2A5E 50%, #2D1B4E 100%)" }}
      >
        <NavBar />
        <div className="text-white/60 text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  if (isError || !scenario) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "linear-gradient(160deg, #0F1B3D 0%, #1A2A5E 50%, #2D1B4E 100%)" }}
      >
        <NavBar />
        <p className="text-white/70 text-lg">Scenario not found 😢</p>
        <button onClick={() => navigate("/life-skills")} className="text-blue-300 underline">
          Back to Life Skills
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0F1B3D 0%, #1A2A5E 40%, #2D1B4E 100%)" }}
    >
      {/* Ambient glow matching scenario color */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vw] rounded-full opacity-20"
          style={{
            background: scenario.coverGradient,
            filter: "blur(100px)",
          }}
        />
      </div>

      <NavBar />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-4 sm:px-6 pt-4 pb-10 max-w-lg mx-auto w-full">

        {/* ── Top bar: back + scenario name + reset ── */}
        <motion.div
          className="w-full flex items-center gap-3 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => navigate("/life-skills")}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-white/50 text-xs uppercase tracking-wider">Life Skills Practice</p>
            <h2 className="font-display text-white font-bold text-base truncate">{scenario.title}</h2>
          </div>

          <button
            onClick={handleReset}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.08)" }}
            title="Reset conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </motion.div>

        {/* ── Character display ── */}
        <motion.div
          className="flex-1 flex items-center justify-center w-full py-4"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, delay: 0.1 }}
          onClick={
            voiceState === "speaking" || voiceState === "listening" ? handleStop : undefined
          }
          style={{
            cursor:
              voiceState === "speaking" || voiceState === "listening" ? "pointer" : "default",
          }}
        >
          <CharacterDisplay
            avatar={scenario.characterAvatar}
            gradient={scenario.coverGradient}
            isSpeaking={voiceState === "speaking"}
            isListening={voiceState === "listening"}
            isThinking={voiceState === "thinking"}
          />
        </motion.div>

        {/* ── Character name ── */}
        <motion.p
          className="font-display font-bold text-white text-xl drop-shadow-md mb-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {scenario.characterName}
        </motion.p>

        {/* ── Voice status label ── */}
        <div className="mb-6">
          <VoiceStatus state={voiceState} />
        </div>

        {/* ── Error banner ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-xs text-center w-full"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Microphone button ── */}
        <motion.div
          className="mb-4"
          initial={{ scale: 0.7, opacity: 0 }}
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

        {/* ── Explicit Stop button when active ── */}
        <AnimatePresence>
          {(voiceState === "speaking" || voiceState === "listening") && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 6 }}
              onClick={handleStop}
              className="mb-4 px-5 py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-display font-bold text-xs shadow-lg shadow-red-500/40 border border-red-400/40 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              {voiceState === "speaking" ? "Stop Voice ⏹️" : "Stop Listening ⏹️"}
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Voice selector ── */}
        {voices.length > 0 && (
          <motion.div
            className="flex flex-col items-center gap-1.5 w-full max-w-[240px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="text-[11px] font-display font-bold text-white/40 tracking-wider uppercase">
              Choose Character Voice
            </label>
            <div className="relative w-full">
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-white/20 text-xs font-semibold text-white/80 outline-none cursor-pointer hover:bg-white/20 transition-all appearance-none shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)",
                }}
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name} className="text-gray-900 bg-white">
                    {v.name.replace("Microsoft", "MS").replace("Google", "")} ({v.lang})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/40">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
