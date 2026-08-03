/**
 * chat.service.js — Business logic for the persistent chat history system.
 *
 * sendMessage() flow:
 *   1. Validate session belongs to userId
 *   2. Save user message
 *   3. routerService.routeMessage() → RAG or direct LLM (transparent to caller)
 *   4. Save assistant reply (with route metadata for observability)
 *   5. Touch session lastMessageAt
 *   6. Auto-title from first user message if still "New Chat"
 *   7. Return { reply, sources, cached }
 */

const repo          = require("./chat.repository");
const routerService = require("./router.service");
const logger        = require("../../utils/logger");

const MAX_TITLE_LEN = 40;

// ── Helper: auto-generate title from first user message ───────────

const autoTitle = (message) => {
	const clean = message.trim().replace(/\s+/g, " ");
	if (clean.length <= MAX_TITLE_LEN) return clean;
	// Truncate at last word boundary before limit
	const cut = clean.slice(0, MAX_TITLE_LEN);
	const lastSpace = cut.lastIndexOf(" ");
	return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trim() + "…";
};

// ── Session management ────────────────────────────────────────────

/**
 * List paginated sessions for the sidebar.
 *
 * @param {string} userId
 * @param {number} [page=1]
 * @param {number} [limit=20]
 */
const listSessions = async (userId, page = 1, limit = 20) => {
	const [sessions, total] = await Promise.all([
		repo.getSessions(userId, page, limit),
		repo.countSessions(userId),
	]);
	return {
		sessions,
		page,
		limit,
		total,
		hasMore: page * limit < total,
	};
};

/**
 * Create a brand-new session.
 *
 * @param {string} userId
 */
const createSession = async (userId) => {
	const session = await repo.createSession(userId);
	return { id: session.id, title: session.title, createdAt: session.createdAt, messages: [] };
};

/**
 * Fetch a session with its messages (paginated).
 *
 * @param {string} sessionId
 * @param {string} userId
 * @param {number} [page=1]
 */
const getSession = async (sessionId, userId, page = 1) => {
	const session = await repo.getSessionById(sessionId, userId);
	if (!session) return null;

	const messages = await repo.getMessages(sessionId, userId, page);
	return { session, messages: messages || [] };
};

/**
 * Soft-delete a session.
 *
 * @param {string} sessionId
 * @param {string} userId
 * @returns {boolean} true if a row was affected
 */
const deleteSession = async (sessionId, userId) => {
	const result = await repo.softDeleteSession(sessionId, userId);
	return result.count > 0;
};

/**
 * Rename a session.
 *
 * @param {string} sessionId
 * @param {string} userId
 * @param {string} title
 * @returns {boolean} true if a row was affected
 */
const renameSession = async (sessionId, userId, title) => {
	if (!title || !title.trim()) return false;
	const result = await repo.renameSession(sessionId, userId, title.trim());
	return result.count > 0;
};

/**
 * Search sessions by title and message content.
 *
 * @param {string} userId
 * @param {string} query
 */
const searchSessions = (userId, query) => repo.searchSessions(userId, query);

// ── Message sending ───────────────────────────────────────────────

/**
 * Process a user message end-to-end.
 *
 * @param {string} sessionId
 * @param {string} userId
 * @param {string} message
 * @returns {Promise<{reply: string, sources: Array, cached: boolean}>}
 */
const sendMessage = async (sessionId, userId, message) => {
	// 1. Validate session ownership
	const session = await repo.getSessionById(sessionId, userId);
	if (!session) {
		const err = new Error("Session not found");
		err.status = 404;
		throw err;
	}

	// 2. Save the user's message immediately
	await repo.createMessage(sessionId, userId, "user", message, null);

	// 3. Route + get AI response (transparent to frontend)
	let result;
	try {
		result = await routerService.routeMessage(message, sessionId, userId);
	} catch (err) {
		logger.warn("[chat] Router error — using fallback", { message: err.message });
		result = {
			reply:  "I'm having a little trouble right now. Please try again in a moment! 🦉",
			sources: [],
			cached:  false,
			route:   "error",
		};
	}

	const { reply, sources, cached, route } = result;

	// 4. Save assistant reply (route stored in metadata for observability only)
	await repo.createMessage(sessionId, userId, "assistant", reply, {
		sources: sources || [],
		cached:  cached  || false,
		route:   route   || "unknown",
	});

	// 5 + 6. Touch session; auto-title on first user turn
	const isFirstTurn = session.title === "New Chat";
	const newTitle    = isFirstTurn ? autoTitle(message) : undefined;
	await repo.touchSession(sessionId, newTitle);

	// 7. Return only what the frontend needs
	return { reply, sources: sources || [], cached: cached || false };
};

module.exports = {
	listSessions,
	createSession,
	getSession,
	deleteSession,
	renameSession,
	searchSessions,
	sendMessage,
};
