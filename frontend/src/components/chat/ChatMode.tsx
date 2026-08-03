/**
 * ChatMode — Persistent chat UI.
 *
 * Restored original white glassmorphism theme:
 *   - linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)
 *   - border border-white/40
 *   - crisp backdrop-blur-md (no heavy blur mud)
 *   - bg-primary/20 user bubbles, bg-white/10 bot bubbles
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  User,
  BookOpen,
  Gamepad2,
  GraduationCap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────

interface Source {
  title: string;
  type: string;
  sourceId: string;
}

export interface ChatMessage {
  role: "user" | "bot";
  text: string;
  sources?: Source[];
  cached?: boolean;
}

// ── Suggestion data ───────────────────────────────────────────────

const suggestions = [
  { label: "📖 Story moral",      send: "What is the moral of a story in StoryNest?" },
  { label: "📚 Help me learn",    send: "What can I learn in StoryNest lessons?" },
  { label: "🎮 Games available",  send: "What games are available in StoryNest?" },
  { label: "🌟 Recommend story",  send: "Can you recommend a story for me?" },
  { label: "🔤 Vocabulary",       send: "Can you help me with vocabulary words?" },
  { label: "🏆 Learning tips",    send: "Give me a learning tip from StoryNest!" },
];

// ── Source helpers ────────────────────────────────────────────────

const SourceIcon = ({ type }: { type: string }) => {
  if (type === "story") return <BookOpen className="w-3 h-3" />;
  if (type === "game")  return <Gamepad2 className="w-3 h-3" />;
  return <GraduationCap className="w-3 h-3" />;
};

const sourceTypeColor: Record<string, string> = {
  story:  "bg-purple-500/20 text-purple-200 border-purple-400/30",
  lesson: "bg-blue-500/20   text-blue-200   border-blue-400/30",
  game:   "bg-green-500/20  text-green-200  border-green-400/30",
};

const SourceChips = ({ sources }: { sources: Source[] }) => {
  const [expanded, setExpanded] = useState(false);
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-white/50 text-[11px] font-medium hover:bg-white/10 hover:text-white/80 transition-all shadow-sm"
      >
        <BookOpen className="w-3 h-3 text-amber-300" />
        <span>{sources.length} source{sources.length !== 1 ? "s" : ""}</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5 mt-1.5 overflow-hidden"
          >
            {sources.map((src, i) => (
              <span
                key={`${src.sourceId}-${i}`}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${
                  sourceTypeColor[src.type] || "bg-white/10 text-white/70 border-white/20"
                }`}
              >
                <SourceIcon type={src.type} />
                {src.title}
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Props ─────────────────────────────────────────────────────────

interface ChatModeProps {
  messages:          ChatMessage[];
  input:             string;
  setInput:          (val: string) => void;
  isTyping:          boolean;
  sendMessage:       (text?: string) => void;
  error:             string | null;
  isLoadingSession?: boolean;
  onRegisterRefresh?: (fn: () => void) => void;
}

// ── Component ─────────────────────────────────────────────────────

const ChatMode = ({
  messages,
  input,
  setInput,
  isTyping,
  sendMessage,
  error,
  isLoadingSession = false,
}: ChatModeProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Reset suggestions when session clears
  useEffect(() => {
    if (messages.length <= 1) setShowSuggestions(true);
  }, [messages.length]);

  // Auto-scroll to bottom (skip when loading skeleton)
  useEffect(() => {
    if (isLoadingSession) return;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, isLoadingSession]);

  // ── Loading skeleton (all hooks called unconditionally above) ──
  if (isLoadingSession) {
    return (
      <div className="flex flex-col flex-1 min-h-0 gap-2">
        <div
          className="flex-1 min-h-0 p-4 overflow-hidden rounded-[32px] border border-white/40 shadow-2xl backdrop-blur-md space-y-4"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
            boxShadow: "0 20px 50px -10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          {[80, 55, 70, 45, 65].map((w, i) => (
            <div key={i} className={`flex items-end gap-2 animate-pulse ${i % 2 !== 0 ? "flex-row-reverse" : ""}`}>
              <div className="w-8 h-8 rounded-full bg-white/20 flex-shrink-0" />
              <div className="h-10 rounded-2xl bg-white/15" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
        <div
          className="flex-shrink-0 p-2 flex gap-2 rounded-2xl border border-white/40 shadow-xl backdrop-blur-md opacity-50"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <div className="flex-1 h-10 rounded-xl bg-white/10 animate-pulse" />
          <div className="w-12 h-10 rounded-xl bg-white/10 animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Normal render ─────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2">

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-xs text-center"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        * Chat window — original light glassmorphism container
        * linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)
        * backdrop-blur-md keeps the blur subtle, clear & non-muddy.
        */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-3 rounded-[32px] border border-white/40 shadow-2xl backdrop-blur-md"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
          boxShadow: "0 20px 50px -10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)",
          scrollbarWidth: "none",
        }}
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base shadow-lg ${
                msg.role === "bot"
                  ? "bg-gradient-to-br from-amber-400 to-orange-500"
                  : "bg-gradient-to-br from-sky-400 to-teal-400"
              }`}
            >
              {msg.role === "bot" ? "🦉" : <User className="w-4 h-4 text-white" />}
            </div>

            {/* Bubble */}
            <div
              className={`px-3 py-2 sm:px-4 sm:py-2.5 max-w-[82%] sm:max-w-[76%] rounded-2xl border border-white/40 backdrop-blur-md ${
                msg.role === "user"
                  ? "bg-primary/20 text-white"
                  : "bg-white/10 text-white"
              }`}
              style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
            >
              <p className="text-sm font-body whitespace-pre-line leading-relaxed">{msg.text}</p>
              {msg.sources && msg.sources.length > 0 && <SourceChips sources={msg.sources} />}
              {msg.cached && (
                <p className="text-white/30 text-[10px] mt-1">⚡ instant answer</p>
              )}
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg text-base">
              🦉
            </div>
            <div className="px-4 py-2 rounded-2xl border border-white/40 bg-white/10 backdrop-blur-md flex gap-1 items-center">
              <span className="text-white/60 text-xs mr-1">Ollie is thinking</span>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 bg-amber-300 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggestion chips */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            className="flex-shrink-0 flex flex-wrap gap-1.5 sm:gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {suggestions.map((s) => (
              <motion.button
                key={s.label}
                onClick={() => { sendMessage(s.send); setShowSuggestions(false); }}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold text-white border border-white/40 backdrop-blur-md transition-all"
                style={{ background: "rgba(255,255,255,0.12)" }}
                whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.22)" }}
                whileTap={{ scale: 0.95 }}
                disabled={isTyping}
              >
                {s.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar — original light glass bar */}
      <div
        className="flex-shrink-0 p-1.5 sm:p-2 flex gap-2 rounded-2xl border border-white/40 shadow-xl backdrop-blur-md"
        style={{ background: "rgba(255,255,255,0.1)" }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isTyping && sendMessage()}
          placeholder="Ask Ollie anything…"
          className="flex-1 px-3 py-2 sm:px-4 rounded-xl bg-transparent text-white placeholder:text-white/50 focus:outline-none font-body font-medium text-sm"
          disabled={isTyping}
          maxLength={500}
          style={{ fontSize: "16px" }}
        />
        <motion.button
          onClick={() => sendMessage()}
          className="glossy-btn p-2.5 sm:p-3 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          whileHover={!isTyping ? { scale: 1.1 } : {}}
          whileTap={!isTyping ? { scale: 0.9 } : {}}
          disabled={isTyping || !input.trim()}
          aria-label="Send message"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </motion.button>
      </div>

      {/* Re-show suggestions link */}
      {!showSuggestions && (
        <button
          onClick={() => setShowSuggestions(true)}
          className="flex-shrink-0 text-center text-white/50 text-[11px] hover:text-white transition-colors py-0.5"
        >
          💡 Show suggestions
        </button>
      )}
    </div>
  );
};

export default ChatMode;
