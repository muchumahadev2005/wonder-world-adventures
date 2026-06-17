/**
 * RAG Admin Routes
 *
 * Admin-protected endpoints for content indexing.
 * Mounted at /api/rag (requires admin auth via requireAdmin middleware).
 */

const express = require("express");
const controller = require("./rag.controller");
const { requireAdmin } = require("../../middleware/adminAuth.middleware");

const router = express.Router();

// All routes in this file require admin authentication
router.use(requireAdmin);

// Re-index a single content item
// POST /api/rag/index/:type/:id  (type: story|lesson|game)
router.post("/index/:type/:id", controller.indexSingleContent);

// Batch re-index all content (async background job)
// POST /api/rag/batch-index
router.post("/batch-index", controller.batchIndex);

module.exports = router;
