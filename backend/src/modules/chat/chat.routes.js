/**
 * chat.routes.js — Routes for the persistent chat history API.
 *
 * All routes require a valid JWT (requireAuth middleware).
 *
 * Mount point: /api/chat  (registered in routes/index.js)
 */

const express    = require("express");
const controller = require("./chat.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

const router = express.Router();

// Protect every route in this file
router.use(requireAuth);

router.get(   "/sessions",     controller.listSessions);
router.post(  "/session",      controller.createSession);
router.get(   "/session/:id",  controller.getSession);
router.post(  "/message",      controller.sendMessage);
router.delete("/session/:id",  controller.deleteSession);
router.patch( "/session/:id",  controller.renameSession);
router.get(   "/search",       controller.searchSessions);

module.exports = router;
