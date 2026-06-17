/**
 * RAG Routes
 *
 * Public:
 *   POST /api/chatbot/message  — handled here, replaces the old stub
 *
 * Admin-protected:
 *   POST /api/rag/index/:type/:id  — re-index a single content item
 *   POST /api/rag/batch-index      — re-index all content
 */

const express = require("express");
const controller = require("./rag.controller");
const { requireAdmin } = require("../../middleware/adminAuth.middleware");

const router = express.Router();

// ── Public chat endpoint (replaces old /api/chatbot/message stub) ─
router.post("/message", controller.sendMessage);

module.exports = router;
