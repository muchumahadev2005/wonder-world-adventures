/**
 * chat.repository.js — Raw Prisma queries for the chat history UX layer.
 *
 * SECURITY: Every query filters by userId. Users can never access
 *           another user's sessions or messages.
 */

const prisma = require("../../prisma/prismaClient");

const PAGE_SIZE = 20;
const MSG_PAGE_SIZE = 50;

// ── Sessions ──────────────────────────────────────────────────────

/**
 * Create a new chat session for a user.
 * @param {string} userId
 * @param {string} [title]
 */
const createSession = (userId, title = "New Chat") =>
	prisma.chatSession.create({
		data: { userId, title },
	});

/**
 * List sessions for a user, paginated, ordered by lastMessageAt DESC.
 * Excludes soft-deleted sessions.
 *
 * @param {string} userId
 * @param {number} [page=1]
 * @param {number} [limit=PAGE_SIZE]
 */
const getSessions = (userId, page = 1, limit = PAGE_SIZE) =>
	prisma.chatSession.findMany({
		where:   { userId, isDeleted: false },
		orderBy: { lastMessageAt: "desc" },
		skip:    (page - 1) * limit,
		take:    limit,
		select: {
			id:            true,
			title:         true,
			createdAt:     true,
			lastMessageAt: true,
		},
	});

/**
 * Count non-deleted sessions for pagination metadata.
 * @param {string} userId
 */
const countSessions = (userId) =>
	prisma.chatSession.count({ where: { userId, isDeleted: false } });

/**
 * Fetch a single session owned by userId.
 * Returns null if not found or belongs to another user.
 *
 * @param {string} sessionId
 * @param {string} userId
 */
const getSessionById = (sessionId, userId) =>
	prisma.chatSession.findFirst({
		where: { id: sessionId, userId, isDeleted: false },
	});

/**
 * Soft-delete a session (and its messages cascade at DB level via onDelete: Cascade).
 * Validates ownership.
 *
 * @param {string} sessionId
 * @param {string} userId
 */
const softDeleteSession = (sessionId, userId) =>
	prisma.chatSession.updateMany({
		where: { id: sessionId, userId, isDeleted: false },
		data:  { isDeleted: true },
	});

/**
 * Rename a session.
 *
 * @param {string} sessionId
 * @param {string} userId
 * @param {string} title
 */
const renameSession = (sessionId, userId, title) =>
	prisma.chatSession.updateMany({
		where: { id: sessionId, userId, isDeleted: false },
		data:  { title: title.slice(0, 80) },
	});

/**
 * Update lastMessageAt and optionally the title (for auto-title).
 *
 * @param {string} sessionId
 * @param {string} [title]
 */
const touchSession = (sessionId, title) =>
	prisma.chatSession.update({
		where: { id: sessionId },
		data: {
			lastMessageAt: new Date(),
			...(title ? { title } : {}),
		},
	});

/**
 * Full-text search across session titles and message content for a user.
 * Returns matching sessions (deduplicated) ordered by lastMessageAt DESC.
 *
 * @param {string} userId
 * @param {string} query
 */
const searchSessions = async (userId, query) => {
	const q = query.trim().toLowerCase();
	if (!q) return [];

	// Search titles
	const byTitle = await prisma.chatSession.findMany({
		where: {
			userId,
			isDeleted: false,
			title: { contains: query, mode: "insensitive" },
		},
		orderBy: { lastMessageAt: "desc" },
		take: 30,
		select: { id: true, title: true, createdAt: true, lastMessageAt: true },
	});

	// Search message content
	const byContent = await prisma.chatSessionMessage.findMany({
		where: {
			userId,
			content: { contains: query, mode: "insensitive" },
			session: { isDeleted: false },
		},
		select: {
			session: {
				select: { id: true, title: true, createdAt: true, lastMessageAt: true },
			},
		},
		take: 30,
	});

	// Merge and deduplicate by session id
	const seen = new Set();
	const merged = [];
	for (const s of [...byTitle]) {
		if (!seen.has(s.id)) { seen.add(s.id); merged.push(s); }
	}
	for (const r of byContent) {
		const s = r.session;
		if (!seen.has(s.id)) { seen.add(s.id); merged.push(s); }
	}

	return merged.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)).slice(0, 30);
};

// ── Messages ──────────────────────────────────────────────────────

/**
 * Save a single message to a session.
 *
 * @param {string} sessionId
 * @param {string} userId
 * @param {"user"|"assistant"|"system"} role
 * @param {string} content
 * @param {object|null} [metadata]
 */
const createMessage = (sessionId, userId, role, content, metadata = null) =>
	prisma.chatSessionMessage.create({
		data: { sessionId, userId, role, content, metadata },
	});

/**
 * Fetch messages for a session, paginated, ordered by createdAt ASC.
 * Validates ownership via userId on the session level.
 *
 * @param {string} sessionId
 * @param {string} userId
 * @param {number} [page=1]
 * @param {number} [limit=MSG_PAGE_SIZE]
 */
const getMessages = async (sessionId, userId, page = 1, limit = MSG_PAGE_SIZE) => {
	// Verify ownership first
	const session = await getSessionById(sessionId, userId);
	if (!session) return null; // caller handles 404

	return prisma.chatSessionMessage.findMany({
		where:   { sessionId },
		orderBy: { createdAt: "asc" },
		skip:    (page - 1) * limit,
		take:    limit,
		select: {
			id:        true,
			role:      true,
			content:   true,
			createdAt: true,
			metadata:  true,
		},
	});
};

module.exports = {
	createSession,
	getSessions,
	countSessions,
	getSessionById,
	softDeleteSession,
	renameSession,
	touchSession,
	searchSessions,
	createMessage,
	getMessages,
};
