/**
 * ChatSidebar.tsx — Persistent chat history sidebar (ChatGPT-style).
 *
 * Features:
 *   - + New Chat button
 *   - Debounced search (titles + message content)
 *   - Grouped session list: Today / Yesterday / Previous 7 Days / Older
 *   - Per-session context menu: Rename / Delete
 *   - Skeleton loaders while fetching
 *   - Infinite scroll (lazy load older sessions)
 *   - Retry button on failure
 *   - Fully responsive (passed isOpen/onClose for mobile overlay from ChatPage)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Clock,
} from "lucide-react";
import { chatApi, type ChatSession } from "@/lib/chatApi";
import RenameDialog from "./RenameDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

// ── Time grouping helpers ─────────────────────────────────────────

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const groupSessions = (sessions: ChatSession[]) => {
  const todayMs  = startOfToday().getTime();
  const yesterMs = todayMs - 86_400_000;
  const week7Ms  = todayMs - 7 * 86_400_000;

  const groups: Record<string, ChatSession[]> = {
    "Today":            [],
    "Yesterday":        [],
    "Previous 7 Days":  [],
    "Older":            [],
  };

  for (const s of sessions) {
    const t = new Date(s.lastMessageAt).getTime();
    if (t >= todayMs)        groups["Today"].push(s);
    else if (t >= yesterMs)  groups["Yesterday"].push(s);
    else if (t >= week7Ms)   groups["Previous 7 Days"].push(s);
    else                     groups["Older"].push(s);
  }

  return groups;
};

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// ── Skeleton loader ───────────────────────────────────────────────

const SessionSkeleton = () => (
  <div className="animate-pulse space-y-2 px-2">
    {[80, 60, 70, 55].map((w, i) => (
      <div key={i} className="flex items-center gap-2 p-2">
        <div className="w-4 h-4 rounded bg-white/10 flex-shrink-0" />
        <div
          className="h-3 rounded bg-white/10"
          style={{ width: `${w}%` }}
        />
      </div>
    ))}
  </div>
);

// ── Context menu ──────────────────────────────────────────────────

interface ContextMenuProps {
  sessionId:   string;
  onRename:    () => void;
  onDelete:    () => void;
}

const ContextMenu = ({ onRename, onDelete }: ContextMenuProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1 rounded-md text-white/0 group-hover:text-white/50 hover:text-white/90 hover:bg-white/10 transition-all"
        aria-label="More options"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-6 z-20 w-36 rounded-xl border border-white/20 shadow-xl overflow-hidden"
            style={{ background: "rgba(20,10,40,0.97)" }}
            initial={{ opacity: 0, scale: 0.9, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -5 }}
            transition={{ duration: 0.12 }}
          >
            <button
              onClick={() => { setOpen(false); onRename(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <Pencil className="w-3 h-3" />
              Rename
            </button>
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Props ─────────────────────────────────────────────────────────

interface ChatSidebarProps {
  token:              string | null;
  currentSessionId:   string | null;
  onSelectSession:    (id: string) => void;
  onNewChat:          () => void;
  isOpen:             boolean;
  onClose:            () => void;
  /** Receives the sidebar's loadSessions(true) fn so ChatPage can trigger a refresh */
  onRegisterRefresh?: (fn: () => void) => void;
}

// ── Component ─────────────────────────────────────────────────────

const ChatSidebar = ({
  token,
  currentSessionId,
  onSelectSession,
  onNewChat,
  isOpen,
  onClose,
  onRegisterRefresh,
}: ChatSidebarProps) => {
  const [sessions,     setSessions]     = useState<ChatSession[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(false);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [searchResults, setSearchResults] = useState<ChatSession[] | null>(null);
  const [searching,    setSearching]    = useState(false);

  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Load sessions ───────────────────────────────────────────────

  const loadSessions = useCallback(async (reset = true) => {
    if (!token) return;
    try {
      if (reset) { setLoading(true); setError(null); }
      const p = reset ? 1 : page;
      const data = await chatApi.listSessions(token, p);
      setSessions(prev => reset ? data.sessions : [...prev, ...data.sessions]);
      setHasMore(data.hasMore);
      setPage(reset ? 2 : page + 1);
    } catch (err) {
      setError("Couldn't load conversations.");
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => { loadSessions(true); }, [token]); // eslint-disable-line

  // ── Infinite scroll ─────────────────────────────────────────────

  const handleScroll = useCallback(async () => {
    const el = scrollRef.current;
    if (!el || loadingMore || !hasMore || searchResults !== null) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      setLoadingMore(true);
      try {
        const data = await chatApi.listSessions(token, page);
        setSessions(prev => [...prev, ...data.sessions]);
        setHasMore(data.hasMore);
        setPage(p => p + 1);
      } catch { /* silent */ }
      finally { setLoadingMore(false); }
    }
  }, [loadingMore, hasMore, searchResults, token, page]);

  // ── Debounced search ────────────────────────────────────────────

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const data = await chatApi.searchSessions(searchQuery.trim(), token);
        setSearchResults(data.sessions);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery, token]);

  // ── Rename ──────────────────────────────────────────────────────

  const handleRename = async (newTitle: string) => {
    if (!renameTarget || !token) return;
    try {
      await chatApi.renameSession(renameTarget.id, newTitle, token);
      setSessions(prev =>
        prev.map(s => s.id === renameTarget.id ? { ...s, title: newTitle } : s)
      );
      if (searchResults) {
        setSearchResults(prev =>
          prev!.map(s => s.id === renameTarget.id ? { ...s, title: newTitle } : s)
        );
      }
    } catch { /* silent — optimistic update already done */ }
    setRenameTarget(null);
  };

  // ── Delete ──────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget || !token) return;
    try {
      await chatApi.deleteSession(deleteTarget.id, token);
      setSessions(prev => prev.filter(s => s.id !== deleteTarget.id));
      if (searchResults) {
        setSearchResults(prev => prev!.filter(s => s.id !== deleteTarget.id));
      }
      // If the deleted session was active, trigger new chat
      if (deleteTarget.id === currentSessionId) onNewChat();
    } catch { /* silent */ }
    setDeleteTarget(null);
  };

  // Register refresh fn with parent (ChatPage wires this to sidebarRefreshRef)
  useEffect(() => {
    if (onRegisterRefresh) onRegisterRefresh(() => loadSessions(true));
  }, [onRegisterRefresh]); // eslint-disable-line

  // ── Render list ─────────────────────────────────────────────────

  const displaySessions = searchResults !== null ? searchResults : sessions;
  const groups = groupSessions(displaySessions);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-white/90 text-sm flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-amber-300" />
            Chat History
          </h2>
          {/* Mobile close — large touch target */}
          <button
            onClick={onClose}
            className="md:hidden text-white/50 hover:text-white/90 transition-colors p-2 -mr-1 rounded-xl active:bg-white/10"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat */}
        <motion.button
          id="new-chat-btn"
          onClick={() => { onNewChat(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-amber-400/30 text-amber-300 text-xs font-bold hover:bg-amber-400/10 active:bg-amber-400/20 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          <Plus className="w-4 h-4" />
          New Chat
        </motion.button>

        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 placeholder:text-white/30 text-xs focus:outline-none focus:border-white/30 transition-colors"
          />
          {searching && (
            <RefreshCw className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 animate-spin" />
          )}
        </div>
      </div>

      {/* Session List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-2 space-y-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        {loading ? (
          <SessionSkeleton />
        ) : error ? (
          <div className="px-3 py-4 text-center">
            <p className="text-white/40 text-xs mb-2">{error}</p>
            <button
              onClick={() => loadSessions(true)}
              className="text-amber-300 text-xs hover:text-amber-200 flex items-center gap-1 mx-auto"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        ) : displaySessions.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-white/30 text-xs">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </p>
          </div>
        ) : (
          Object.entries(groups).map(([label, group]) =>
            group.length === 0 ? null : (
              <div key={label}>
                <p className="px-3 pt-3 pb-1 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                  {label}
                </p>
                {group.map((session) => (
                  <motion.div
                    key={session.id}
                    className={`group relative flex items-center gap-2 px-3 py-2.5 mx-1 rounded-xl cursor-pointer transition-all ${
                      session.id === currentSessionId
                        ? "bg-white/15 border border-white/20"
                        : "hover:bg-white/10 active:bg-white/15 border border-transparent"
                    }`}
                    onClick={() => { onSelectSession(session.id); onClose(); }}
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.12 }}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-xs font-medium truncate leading-tight">
                        {session.title}
                      </p>
                      <p className="text-white/30 text-[10px] flex items-center gap-0.5 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {relativeTime(session.lastMessageAt)}
                      </p>
                    </div>
                    <ContextMenu
                      sessionId={session.id}
                      onRename={() => setRenameTarget(session)}
                      onDelete={() => setDeleteTarget(session)}
                    />
                  </motion.div>
                ))}
              </div>
            )
          )
        )}

        {loadingMore && (
          <div className="py-2 flex justify-center">
            <RefreshCw className="w-3 h-3 text-white/30 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop: always-visible panel ── */}
      <div
        className="hidden md:flex flex-col w-64 flex-shrink-0 border-r border-white/10 h-full"
        style={{ background: "rgba(10,5,25,0.6)" }}
      >
        {sidebarContent}
      </div>

      {/* ── Mobile: slide-in overlay with iOS safe-area ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed left-0 top-0 bottom-0 z-50 w-[min(288px,85vw)] md:hidden flex flex-col border-r border-white/10"
              style={{
                background: "rgba(8,4,22,0.97)",
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <RenameDialog
        open={!!renameTarget}
        currentTitle={renameTarget?.title ?? ""}
        onConfirm={handleRename}
        onClose={() => setRenameTarget(null)}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.title ?? ""}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default ChatSidebar;
