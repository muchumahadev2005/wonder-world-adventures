/**
 * RAG Controller
 *
 * Handles HTTP requests for the chatbot endpoint.
 * Delegates all business logic to rag.service.js.
 */

const catchAsync = require("../../utils/catchAsync");
const { processQuestion } = require("./rag.service");
const { indexContent } = require("./embedding.service");
const prisma = require("../../prisma/prismaClient");
const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../../config/env");

/**
 * POST /api/chatbot/message
 * Main chat endpoint — full RAG pipeline.
 */
const sendMessage = catchAsync(async (req, res) => {
	const { message, sessionId } = req.body || {};

	if (!message || typeof message !== "string" || !message.trim()) {
		return res.status(400).json({
			success: false,
			message: "Message is required",
		});
	}

	// Optionally decode token if present
	let resolvedUserId = null;
	const authHeader = req.headers.authorization || "";
	const [, token] = authHeader.split(" ");
	if (token) {
		try {
			const decoded = jwt.verify(token, jwtSecret);
			resolvedUserId = decoded.sub;
		} catch (err) {
			// Ignore optional auth decoding errors
		}
	}

	// Generate a session ID if not provided (anonymous users)
	const resolvedSessionId =
		sessionId ||
		(resolvedUserId
			? `user_${resolvedUserId}`
			: `anon_${crypto.createHash("sha256").update(req.ip + req.headers["user-agent"]).digest("hex").slice(0, 16)}`);

	const result = await processQuestion({
		message: message.trim(),
		sessionId: resolvedSessionId,
		userId: resolvedUserId,
	});

	return res.json({
		success: true,
		reply: result.reply,
		sources: result.sources,
		cached: result.cached,
	});
});

/**
 * POST /api/rag/index/:type/:id
 * Admin endpoint — manually trigger re-indexing of a single content item.
 * Protected by requireAdmin middleware in routes.
 */
const indexSingleContent = catchAsync(async (req, res) => {
	const { type, id } = req.params;
	const allowedTypes = ["story", "lesson", "game"];

	if (!allowedTypes.includes(type)) {
		return res.status(400).json({
			success: false,
			message: `Invalid type. Must be one of: ${allowedTypes.join(", ")}`,
		});
	}

	// Fire and don't wait — respond immediately
	setImmediate(() => {
		indexContent(type, id).catch(() => {});
	});

	return res.json({
		success: true,
		message: `Indexing started for ${type} ${id}`,
	});
});

/**
 * POST /api/rag/batch-index
 * Admin endpoint — re-index ALL stories, lessons, and games.
 * Protected by requireAdmin middleware in routes.
 */
const batchIndex = catchAsync(async (req, res) => {
	// Immediately respond — indexing runs async in background
	res.json({
		success: true,
		message: "Batch indexing started in background",
	});

	setImmediate(async () => {
		try {
			const [stories, lessons, games] = await Promise.all([
				prisma.story.findMany({ where: { isPublished: true }, select: { id: true } }),
				prisma.lesson.findMany({ where: { isPublished: true }, select: { id: true } }),
				prisma.game.findMany({ where: { isActive: true }, select: { id: true } }),
			]);

			const items = [
				...stories.map((s) => ({ type: "story", id: s.id })),
				...lessons.map((l) => ({ type: "lesson", id: l.id })),
				...games.map((g) => ({ type: "game", id: g.id })),
			];

			console.log(`[rag] Batch index: ${items.length} items to index`);

			for (const item of items) {
				await indexContent(item.type, item.id);
				// Small delay to avoid rate-limiting OpenRouter embeddings API
				await new Promise((r) => setTimeout(r, 200));
			}

			console.log(`[rag] Batch index complete: ${items.length} items processed`);
		} catch (err) {
			console.error("[rag] Batch index failed:", err.message);
		}
	});
});

module.exports = { sendMessage, indexSingleContent, batchIndex };
