/**
 * ChatPage — Dual-mode conversation page with persistent chat history.
 *
 * Two tabs:
 *   💬 Chat        — DB-backed persistent chat (ChatGPT-style history)
 *   🎙️ Interactive — voice-first conversation (unchanged)
 *
 * Chat history is stored in PostgreSQL via /api/chat/* endpoints.
 * No sessionStorage or localStorage is used for chat data.
 *
 * Layout (responsive):
 *   Mobile  → full-screen, sidebar slides in as overlay
 *   Desktop → sidebar (w-64) + content side-by-side
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChild } from "@/context/ChildContext";
import { useAuth } from "@/context/AuthContext";
import NavBar from "@/components/NavBar";
import SubscribeModal from "@/components/SubscribeModal";
import SceneBackground from "@/components/SceneBackground";
import chatBg from "@/assets/chat-bg.jpg";
import { MessageCircle, PanelLeftOpen, PanelLeftClose } from "lucide-react";

import SegmentedTabs, { type TabValue } from "@/components/chat/SegmentedTabs";
import ChatMode, { type ChatMessage } from "@/components/chat/ChatMode";
import InteractiveMode from "@/components/chat/InteractiveMode";
import ChatSidebar from "@/components/chat/ChatSidebar";

import { chatApi } from "@/lib/chatApi";

// ── Main Component ────────────────────────────────────────────────

const ChatPage = () => {
  const { profile, setPremium } = useChild();
  const { token } = useAuth();

  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Session state ──────────────────────────────────────────────
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionLoading,   setSessionLoading]   = useState(false);

  // ── Chat mode state ────────────────────────────────────────────
  const [messages,    setMessages]    = useState<ChatMessage[]>([]);
  const [input,       setInput]       = useState("");
  const [isTyping,    setIsTyping]    = useState(false);
  const [chatError,   setChatError]   = useState<string | null>(null);
  const [msgsLoading, setMsgsLoading] = useState(false);

  const sidebarRefreshRef = useRef<(() => void) | null>(null);

  // ── Greeting ───────────────────────────────────────────────────
  const makeGreeting = useCallback((): ChatMessage => ({
    role: "bot",
    text: `Hi ${profile?.name || "friend"}! 👋 I'm Ollie the Owl! 🦉 I know everything about StoryNest — our stories, lessons, and games. Ask me anything! What would you like to explore today?`,
  }), [profile?.name]);

  // Initialize greeting when profile loads
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([makeGreeting()]);
    }
  }, [profile?.name]); // eslint-disable-line

  // ── Create new session ─────────────────────────────────────────
  const handleNewChat = useCallback(async () => {
    if (!token) return;
    try {
      const data = await chatApi.createSession(token);
      setCurrentSessionId(data.session.id);
      setMessages([makeGreeting()]);
      setChatError(null);
      setInput("");
      sidebarRefreshRef.current?.();
    } catch {
      setMessages([makeGreeting()]);
    }
  }, [token, makeGreeting]);

  // ── Load existing session ──────────────────────────────────────
  const handleSelectSession = useCallback(async (sessionId: string) => {
    if (!token) return;
    setCurrentSessionId(sessionId);
    setMsgsLoading(true);
    setChatError(null);
    try {
      const data = await chatApi.getSession(sessionId, token);
      if (!data || !data.messages || data.messages.length === 0) {
        setMessages([makeGreeting()]);
      } else {
        setMessages(data.messages.map((m) => ({
          role:    m.role === "user" ? ("user" as const) : ("bot" as const),
          text:    m.content,
          sources: (m.metadata as any)?.sources ?? [],
          cached:  (m.metadata as any)?.cached  ?? false,
        })));
      }
    } catch {
      setChatError("Couldn't load conversation history. Showing new chat.");
      setMessages([makeGreeting()]);
    } finally {
      setMsgsLoading(false);
    }
  }, [token, makeGreeting]);

  // ── On mount: resume last session or create new ────────────────
  useEffect(() => {
    if (!token || currentSessionId) return;
    let isActive = true;
    (async () => {
      setSessionLoading(true);
      try {
        const list = await chatApi.listSessions(token, 1, 1);
        if (!isActive) return;
        if (list && list.sessions && list.sessions.length > 0) {
          await handleSelectSession(list.sessions[0].id);
        } else {
          await handleNewChat();
        }
      } catch {
        if (isActive) await handleNewChat().catch(() => {});
      } finally {
        if (isActive) setSessionLoading(false);
      }
    })();
    return () => { isActive = false; };
  }, [token]); // eslint-disable-line

  // ── Send message ───────────────────────────────────────────────
  const sendMessage = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping || !currentSessionId || !token) return;

    setMessages((prev) => [...prev, { role: "user" as const, text: msg }]);
    setInput("");
    setIsTyping(true);
    setChatError(null);

    try {
      const data = await chatApi.sendMessage(currentSessionId, msg, token);
      setMessages((prev) => [
        ...prev,
        { role: "bot" as const, text: data.reply, sources: data.sources || [], cached: data.cached },
      ]);
      sidebarRefreshRef.current?.();
    } catch (err: unknown) {
      const isPremiumRequired =
        err && typeof err === "object" &&
        (("code" in err && (err as any).code === "PREMIUM_REQUIRED") ||
          ("message" in err && String((err as any).message).includes("upgrade to StoryNest Premium")));

      if (isPremiumRequired) {
        setShowSubscribeModal(true);
        setMessages((prev) => [...prev, {
          role: "bot" as const,
          text: "You've reached your daily limit of 10 free prompts. Please upgrade to StoryNest Premium to get unlimited questions! 🦉🌟",
        }]);
      } else {
        setChatError(err instanceof Error ? err.message : "Failed to connect");
        setMessages((prev) => [...prev, {
          role: "bot" as const,
          text: "Oops! I'm having a little trouble right now. Please try again in a moment! 🦉",
        }]);
      }
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, currentSessionId, token]);

  const registerSidebarRefresh = useCallback((fn: () => void) => {
    sidebarRefreshRef.current = fn;
  }, []);

  return (
    /*
     * Root: full device height using dvh (dynamic viewport height) so the
     * page doesn't shift when the mobile keyboard opens.
     */
    <div className="relative overflow-hidden flex flex-col" style={{ height: "100dvh" }}>
      <SceneBackground
        image={chatBg}
        alt="Cozy magical treehouse interior at night"
        variant="treehouse"
      />

      {/* NavBar sits at the top, z-30 */}
      <NavBar />

      {/*
        * Content area — fills remaining height below NavBar.
        * On mobile: single column, sidebar overlays.
        * On desktop (md+): sidebar + content side-by-side.
        *
        * pt accounts for NavBar height (~64px = pt-16).
        * pb-20 = BottomNav clearance on mobile (BottomNav is fixed).
        * md:pb-0 removes that clearance on desktop.
        */}
      <div
        className="relative z-10 flex flex-1 min-h-0 pt-16 pb-20 md:pt-20 md:pb-0"
        style={{ overflow: "hidden" }}
      >
        {/* ── Sidebar (only shown in Chat mode, hidden in Interactive voice mode) ── */}
        {activeTab === "chat" && (
          <ChatSidebar
            token={token}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onRegisterRefresh={registerSidebarRefresh}
          />
        )}

        {/* ── Main content column ── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">

          {/* Header row — compact on mobile */}
          <motion.div
            className="flex items-center justify-between px-3 sm:px-4 md:px-6 pt-3 pb-2 flex-shrink-0"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {/* Mobile sidebar toggle (only in chat mode) */}
            {activeTab === "chat" ? (
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="md:hidden flex-shrink-0 text-white/60 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10 active:scale-95"
                aria-label="Toggle chat history"
              >
                {sidebarOpen
                  ? <PanelLeftClose className="w-5 h-5" />
                  : <PanelLeftOpen  className="w-5 h-5" />
                }
              </button>
            ) : (
              <div className="md:hidden w-9 flex-shrink-0" />
            )}

            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-white flex items-center justify-center gap-2 drop-shadow-md flex-1 text-center">
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 flex-shrink-0" />
              <span className="truncate">Chat with Ollie</span>
            </h1>

            {/* Right spacer — balances the layout */}
            <div className="md:hidden w-9 flex-shrink-0" />
          </motion.div>

          {/* Sub-header: description */}
          <p className="text-center text-white/50 text-[11px] sm:text-xs px-4 mb-2 flex-shrink-0">
            Powered by StoryNest AI 🦉 — answers from our stories, lessons &amp; games
          </p>

          {/* Segmented Tab Control */}
          <motion.div
            className="px-3 sm:px-4 md:px-6 mb-2 flex-shrink-0"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <SegmentedTabs activeTab={activeTab} onChange={setActiveTab} />
          </motion.div>

          {/* Tab content — flex-1 fills all remaining height */}
          <div className="flex-1 flex flex-col min-h-0 px-3 sm:px-4 md:px-6 pb-2">
            <AnimatePresence mode="wait">
              {activeTab === "chat" ? (
                <motion.div
                  key="chat-mode"
                  className="flex-1 flex flex-col min-h-0"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChatMode
                    messages={messages}
                    input={input}
                    setInput={setInput}
                    isTyping={isTyping}
                    sendMessage={sendMessage}
                    error={chatError}
                    isLoadingSession={msgsLoading || sessionLoading}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="interactive-mode"
                  className="flex-1 flex flex-col min-h-0"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                >
                  <InteractiveMode sessionId={currentSessionId ?? "interactive"} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
