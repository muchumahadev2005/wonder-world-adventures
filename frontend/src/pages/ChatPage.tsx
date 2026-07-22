/**
 * ChatPage — Dual-mode conversation page.
 *
 * Two tabs:
 *   💬 Chat        — existing text-based chat (preserved 100%)
 *   🎙️ Interactive — voice-first conversation using the SAME backend
 *
 * Both tabs share: contentApi.chat(), tts.service, OpenRouter, session, auth.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChild } from "@/context/ChildContext";
import { useAuth } from "@/context/AuthContext";
import { contentApi } from "@/lib/api";
import NavBar from "@/components/NavBar";
import SubscribeModal from "@/components/SubscribeModal";
import SceneBackground from "@/components/SceneBackground";
import chatBg from "@/assets/chat-bg.jpg";
import { MessageCircle } from "lucide-react";

import SegmentedTabs, { type TabValue } from "@/components/chat/SegmentedTabs";
import ChatMode, { type ChatMessage } from "@/components/chat/ChatMode";
import InteractiveMode from "@/components/chat/InteractiveMode";

// ── Main Component ────────────────────────────────────────────────

const ChatPage = () => {
  const { profile, setPremium } = useChild();
  const { token } = useAuth();
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("chat");

  // Shared session ID — both tabs use the SAME session
  const [sessionId] = useState<string>(() => {
    const saved = sessionStorage.getItem("storynest_chat_session_id");
    if (saved) return saved;
    const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem("storynest_chat_session_id", newId);
    return newId;
  });

  // ── Chat Mode state (kept here so it persists across tab switches) ──

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = sessionStorage.getItem("storynest_chat_messages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
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
  const [chatError, setChatError] = useState<string | null>(null);

  // Persist messages to sessionStorage
  useState(() => {
    // side-effect in useState initializer to avoid extra useEffect
    const handler = () =>
      sessionStorage.setItem(
        "storynest_chat_messages",
        JSON.stringify(messages)
      );
    handler();
  });

  // ── Send message — SAME contentApi.chat() for both modes ────────

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;

    const userMsg: ChatMessage = { role: "user", text: msg };
    setMessages((prev) => {
      const next = [...prev, userMsg];
      sessionStorage.setItem("storynest_chat_messages", JSON.stringify(next));
      return next;
    });
    setInput("");
    setIsTyping(true);
    setChatError(null);

    try {
      // SAME API — same endpoint, same OpenRouter, same everything
      const data = await contentApi.chat(msg, token, sessionId);
      setMessages((prev) => {
        const next = [
          ...prev,
          {
            role: "bot" as const,
            text: data.reply,
            sources: data.sources || [],
            cached: data.cached,
          },
        ];
        sessionStorage.setItem("storynest_chat_messages", JSON.stringify(next));
        return next;
      });
    } catch (err: unknown) {
      const isPremiumRequired =
        err &&
        typeof err === "object" &&
        (("code" in err && err.code === "PREMIUM_REQUIRED") ||
          ("message" in err &&
            String(err.message).includes("upgrade to StoryNest Premium")));
      if (isPremiumRequired) {
        setShowSubscribeModal(true);
        setMessages((prev) => {
          const next = [
            ...prev,
            {
              role: "bot" as const,
              text: "You've reached your daily limit of 10 free prompts. Please upgrade to StoryNest Premium to get unlimited questions! 🦉🌟",
            },
          ];
          sessionStorage.setItem(
            "storynest_chat_messages",
            JSON.stringify(next)
          );
          return next;
        });
      } else {
        const message =
          err instanceof Error ? err.message : "Failed to connect";
        setChatError(message);
        setMessages((prev) => {
          const next = [
            ...prev,
            {
              role: "bot" as const,
              text: "Oops! I'm having a little trouble right now. Please try again in a moment! 🦉",
            },
          ];
          sessionStorage.setItem(
            "storynest_chat_messages",
            JSON.stringify(next)
          );
          return next;
        });
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <SceneBackground
        image={chatBg}
        alt="Cozy magical treehouse interior at night"
        variant="treehouse"
      />
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
            Powered by StoryNest AI 🦉 — answers from our stories, lessons
            &amp; games
          </p>
        </motion.div>

        {/* Segmented Tab Control */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <SegmentedTabs activeTab={activeTab} onChange={setActiveTab} />
        </motion.div>

        {/* Tab content — AnimatePresence for smooth transitions */}
        <div className="flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {activeTab === "chat" ? (
              <motion.div
                key="chat-mode"
                className="flex-1 flex flex-col min-h-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <ChatMode
                  messages={messages}
                  input={input}
                  setInput={setInput}
                  isTyping={isTyping}
                  sendMessage={sendMessage}
                  error={chatError}
                />
              </motion.div>
            ) : (
              <motion.div
                key="interactive-mode"
                className="flex-1 flex flex-col min-h-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                <InteractiveMode sessionId={sessionId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
