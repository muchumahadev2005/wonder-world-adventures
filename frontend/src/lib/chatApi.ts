/**
 * chatApi.ts — Typed API helpers for the persistent chat history system.
 *
 * All calls require a valid JWT token (auth-protected backend).
 * Builds on the existing apiFetch utility from api.ts.
 */

import { apiFetch } from "./api";

// ── Types ─────────────────────────────────────────────────────────

export interface ChatSession {
  id:            string;
  title:         string;
  createdAt:     string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id:        string;
  role:      "user" | "assistant" | "system";
  content:   string;
  createdAt: string;
  metadata?: {
    sources?: Array<{ title: string; type: string; sourceId: string }>;
    cached?:  boolean;
  } | null;
}

export interface SessionListResponse {
  success:  boolean;
  sessions: ChatSession[];
  page:     number;
  limit:    number;
  total:    number;
  hasMore:  boolean;
}

export interface SessionDetailResponse {
  success:  boolean;
  session:  ChatSession;
  messages: ChatMessage[];
}

export interface SendMessageResponse {
  success: boolean;
  reply:   string;
  sources: Array<{ title: string; type: string; sourceId: string }>;
  cached:  boolean;
}

// ── API client ────────────────────────────────────────────────────

export const chatApi = {
  /**
   * List paginated sessions for the sidebar (ordered by lastMessageAt DESC).
   */
  listSessions: (token: string | null, page = 1, limit = 20) =>
    apiFetch<SessionListResponse>(
      `/chat/sessions?page=${page}&limit=${limit}`,
      {},
      token,
    ),

  /**
   * Create a new chat session.
   */
  createSession: (token: string | null) =>
    apiFetch<{ success: boolean; session: ChatSession & { messages: [] } }>(
      "/chat/session",
      { method: "POST", body: {} },
      token,
    ),

  /**
   * Fetch a session with its messages.
   */
  getSession: (sessionId: string, token: string | null, page = 1) =>
    apiFetch<SessionDetailResponse>(
      `/chat/session/${sessionId}?page=${page}`,
      {},
      token,
    ),

  /**
   * Send a user message and receive the AI reply.
   */
  sendMessage: (sessionId: string, message: string, token: string | null) =>
    apiFetch<SendMessageResponse>(
      "/chat/message",
      { method: "POST", body: { sessionId, message } },
      token,
    ),

  /**
   * Soft-delete a session.
   */
  deleteSession: (sessionId: string, token: string | null) =>
    apiFetch<{ success: boolean; message: string }>(
      `/chat/session/${sessionId}`,
      { method: "DELETE" },
      token,
    ),

  /**
   * Rename a session.
   */
  renameSession: (sessionId: string, title: string, token: string | null) =>
    apiFetch<{ success: boolean; message: string }>(
      `/chat/session/${sessionId}`,
      { method: "PATCH", body: { title } },
      token,
    ),

  /**
   * Search sessions by title and message content.
   */
  searchSessions: (query: string, token: string | null) =>
    apiFetch<{ success: boolean; sessions: ChatSession[] }>(
      `/chat/search?q=${encodeURIComponent(query)}`,
      {},
      token,
    ),
};
