const express = require("express");
const controller = require("./ai-prompt.controller");
const { requireAdmin } = require("../../middleware/adminAuth.middleware");

const router = express.Router();

// Require admin authentication for all AI prompt limitation endpoints
router.use(requireAdmin);

router.get("/", controller.getSettings);
router.put("/", controller.updateSettings);
router.post("/reset", controller.resetDefaults);
router.post("/preview", controller.previewPrompt);

module.exports = router;
