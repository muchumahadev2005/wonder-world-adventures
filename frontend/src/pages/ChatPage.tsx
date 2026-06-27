import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChild } from "@/context/ChildContext";
import { useAuth } from "@/context/AuthContext";
import { contentApi } from "@/lib/api";
import NavBar from "@/components/NavBar";
import SubscribeModal from "@/components/SubscribeModal";
import SceneBackground from "@/components/SceneBackground";
import chatBg from "@/assets/chat-bg.jpg";
import { MessageCircle, Send, User, BookOpen, Gamepad2, GraduationCap, ChevronDown, ChevronUp } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────

interface Source {
  title: string;
  type: string;
  sourceId: string;
}

interface Message {
  role: "user" | "bot";
  text: string;
  sources?: Source[];
  cached?: boolean;
}

// ── Quick-action suggestions ──────────────────────────────────────

const suggestions = [
  { label: "📖 Story moral", send: "What is the moral of a story in StoryNest?" },
  { label: "📚 Help me learn", send: "What can I learn in StoryNest lessons?" },
  { label: "🎮 Games available", send: "What games are available in StoryNest?" },
  { label: "🌟 Recommend a story", send: "Can you recommend a story for me?" },
  { label: "🔤 Vocabulary", send: "Can you help me with vocabulary words?" },
  { label: "🏆 Learning tips", send: "Give me a learning tip from StoryNest!" },
];

// ── Source type icon ──────────────────────────────────────────────

const SourceIcon = ({ type }: { type: string }) => {
  if (type === "story") return <BookOpen className="w-3 h-3" />;
  if (type === "game") return <Gamepad2 className="w-3 h-3" />;
  return <GraduationCap className="w-3 h-3" />;
};

const sourceTypeColor: Record<string, string> = {
  story: "bg-purple-500/20 text-purple-200 border-purple-400/30",
  lesson: "bg-blue-500/20 text-blue-200 border-blue-400/30",
  game: "bg-green-500/20 text-green-200 border-green-400/30",
};

// ── Source chips component ────────────────────────────────────────

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

// ── Main Component ────────────────────────────────────────────────

const ChatPage = () => {
  const { profile, setPremium } = useChild();
  const { token } = useAuth();
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  // Stable session ID for this browser session
  const [sessionId] = useState<string>(() => {
    const saved = sessionStorage.getItem("storynest_chat_session_id");
    if (saved) return saved;
    const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem("storynest_chat_session_id", newId);
    return newId;
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem("storynest_chat_messages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        role: "bot",
        text: `Hi ${profile?.name || "friend"}! 👋 I'm Ollie the Owl! 🦉 I know everything about StoryNest — our stories, lessons, and games. Ask me anything about what you've learned! What would you like to explore today?`,
      },
    ];
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionStorage.setItem("storynest_chat_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;

    const userMsg: Message = { role: "user", text: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setShowSuggestions(false);
    setError(null);

    try {
      const data = await contentApi.chat(msg, token, sessionId);
      setMessages(prev => [
        ...prev,
        {
          role: "bot",
          text: data.reply,
          sources: data.sources || [],
          cached: data.cached,
        },
      ]);
    } catch (err: unknown) {
      const isPremiumRequired = err && typeof err === "object" && (("code" in err && err.code === "PREMIUM_REQUIRED") || ("message" in err && String(err.message).includes("upgrade to StoryNest Premium")));
      if (isPremiumRequired) {
        setShowSubscribeModal(true);
        setMessages(prev => [
          ...prev,
          {
            role: "bot",
            text: "You've reached your daily limit of 10 free prompts. Please upgrade to StoryNest Premium to get unlimited questions! 🦉🌟",
          },
        ]);
      } else {
        const message = err instanceof Error ? err.message : "Failed to connect";
        setError(message);
        setMessages(prev => [
          ...prev,
          {
            role: "bot",
            text: "Oops! I'm having a little trouble right now. Please try again in a moment! 🦉",
          },
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <SceneBackground image={chatBg} alt="Cozy magical treehouse interior at night" variant="treehouse" />
      <NavBar />

      <div className="page-shell-compact flex-1 flex flex-col w-full">
        {/* Header */}
        <motion.div
          className="page-header mb-4"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2 drop-shadow-md">
            <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />
            Chat with Ollie
          </h1>
          <p className="text-center text-white/60 text-xs mt-1">
            Powered by StoryNest AI 🦉 — answers from our stories, lessons &amp; games
          </p>
        </motion.div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-xs text-center"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat window */}
        <div
          ref={scrollRef}
          className="relative flex-1 p-4 overflow-y-auto space-y-3 mb-3 max-h-[52vh] rounded-[32px] border border-white/40 shadow-2xl backdrop-blur-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
            boxShadow: "0 20px 50px -10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base ${
                  msg.role === "bot"
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg"
                    : "bg-gradient-to-br from-sky-400 to-teal-400"
                }`}
              >
                {msg.role === "bot" ? "🦉" : <User className="w-4 h-4 text-white" />}
              </div>

              <div
                className={`px-4 py-2.5 max-w-[85%] sm:max-w-[75%] rounded-2xl border border-white/40 backdrop-blur-md ${
                  msg.role === "user" ? "bg-primary/20 text-white" : "bg-white/10 text-white"
                }`}
                style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
              >
                <p className="text-sm font-body whitespace-pre-line leading-relaxed">{msg.text}</p>



                {/* Cache indicator (optional — subtle) */}
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
                {[0, 1, 2].map(i => (
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
              className="flex flex-wrap gap-2 mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {suggestions.map(s => (
                <motion.button
                  key={s.label}
                  onClick={() => sendMessage(s.send)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/40 backdrop-blur-md transition-all"
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

        {/* Input bar */}
        <div
          className="relative p-2 flex gap-2 rounded-2xl border border-white/40 shadow-xl backdrop-blur-2xl"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !isTyping && sendMessage()}
            placeholder="Ask Ollie about StoryNest stories, lessons or games..."
            className="flex-1 px-4 py-2 rounded-xl bg-transparent text-white placeholder:text-white/50 focus:outline-none font-body font-medium text-sm"
            disabled={isTyping}
            maxLength={500}
          />
          <motion.button
            onClick={() => sendMessage()}
            className="glossy-btn p-3 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={!isTyping ? { scale: 1.1 } : {}}
            whileTap={!isTyping ? { scale: 0.9 } : {}}
            disabled={isTyping || !input.trim()}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Re-show suggestions */}
        {!showSuggestions && (
          <button
            onClick={() => setShowSuggestions(true)}
            className="mt-2 text-center text-white/50 text-xs hover:text-white transition-colors"
          >
            💡 Show suggestions
          </button>
        )}
      </div>
      <SubscribeModal
        open={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        onSuccess={() => setPremium(true)}
      />
    </div>
  );
};

export default ChatPage;
