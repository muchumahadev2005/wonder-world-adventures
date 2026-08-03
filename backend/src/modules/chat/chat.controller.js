/**
 * chat.controller.js — HTTP handlers for the persistent chat history API.
 *
 * All routes are protected by requireAuth (set in chat.routes.js).
 * req.user is always populated before these handlers run.
 *
 * Routes:
 *   GET    /api/chat/sessions          → listSessions
 *   POST   /api/chat/session           → createSession
 *   GET    /api/chat/session/:id       → getSession
 *   POST   /api/chat/message           → sendMessage
 *   DELETE /api/chat/session/:id       → deleteSession
 *   PATCH  /api/chat/session/:id       → renameSession
 *   GET    /api/chat/search            → searchSessions
 */

const catchAsync  = require("../../utils/catchAsync");
const chatService = require("./chat.service");

// ── GET /sessions ─────────────────────────────────────────────────

const listSessions = catchAsync(async (req, res) => {
	const userId = req.user.id;
	const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
	const limit  = Math.min(50, parseInt(req.query.limit, 10) || 20);

	const data = await chatService.listSessions(userId, page, limit);
	return res.json({ success: true, ...data });
});

// ── POST /session ─────────────────────────────────────────────────

const createSession = catchAsync(async (req, res) => {
	const session = await chatService.createSession(req.user.id);
	return res.status(201).json({ success: true, session });
});

// ── GET /session/:id ──────────────────────────────────────────────

const getSession = catchAsync(async (req, res) => {
	const { id } = req.params;
	const page   = Math.max(1, parseInt(req.query.page, 10) || 1);

	const data = await chatService.getSession(id, req.user.id, page);
	if (!data) {
		return res.status(404).json({ success: false, message: "Session not found" });
	}
	return res.json({ success: true, ...data });
});

// ── POST /message ─────────────────────────────────────────────────

const sendMessage = catchAsync(async (req, res) => {
	const { sessionId, message } = req.body || {};

	if (!sessionId || typeof sessionId !== "string") {
		return res.status(400).json({ success: false, message: "sessionId is required" });
	}
	if (!message || typeof message !== "string" || !message.trim()) {
		return res.status(400).json({ success: false, message: "message is required" });
	}

	const result = await chatService.sendMessage(sessionId, req.user.id, message.trim().slice(0, 500));
	return res.json({
		success: true,
		reply:   result.reply,
		sources: result.sources,
		cached:  result.cached,
	});
});

// ── DELETE /session/:id ───────────────────────────────────────────

const deleteSession = catchAsync(async (req, res) => {
	const deleted = await chatService.deleteSession(req.params.id, req.user.id);
	if (!deleted) {
		return res.status(404).json({ success: false, message: "Session not found" });
	}
	return res.json({ success: true, message: "Session deleted" });
});

// ── PATCH /session/:id ────────────────────────────────────────────

const renameSession = catchAsync(async (req, res) => {
	const { title } = req.body || {};
	if (!title || typeof title !== "string" || !title.trim()) {
		return res.status(400).json({ success: false, message: "title is required" });
	}

	const updated = await chatService.renameSession(req.params.id, req.user.id, title.trim());
	if (!updated) {
		return res.status(404).json({ success: false, message: "Session not found" });
	}
	return res.json({ success: true, message: "Session renamed" });
});

// ── GET /search ───────────────────────────────────────────────────

const searchSessions = catchAsync(async (req, res) => {
	const { q } = req.query;
	if (!q || typeof q !== "string" || !q.trim()) {
		return res.json({ success: true, sessions: [] });
	}

	const sessions = await chatService.searchSessions(req.user.id, q.trim().slice(0, 100));
	return res.json({ success: true, sessions });
});

module.exports = {
	listSessions,
	createSession,
	getSession,
	sendMessage,
	deleteSession,
	renameSession,
	searchSessions,
};
