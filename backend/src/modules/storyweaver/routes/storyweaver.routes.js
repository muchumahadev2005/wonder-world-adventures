const express    = require("express");
const controller = require("../controllers/storyweaver.controller");
const {
	listStoriesSchema,
	storyIdSchema,
	syncAudiosSchema,
} = require("../validators/storyweaver.validator");

const router = express.Router();

const validateQuery = (schema) => (req, res, next) => {
	const parsed = schema.safeParse(req.query || {});
	if (!parsed.success) {
		const message = parsed.error.errors[0]?.message || "Invalid request";
		return res.status(400).json({ success: false, message });
	}
	req.query = parsed.data;
	return next();
};

const validateParams = (schema) => (req, res, next) => {
	const parsed = schema.safeParse(req.params || {});
	if (!parsed.success) {
		const message = parsed.error.errors[0]?.message || "Invalid request";
		return res.status(400).json({ success: false, message });
	}
	req.params = parsed.data;
	return next();
};

const validateBody = (schema) => (req, res, next) => {
	const parsed = schema.safeParse(req.body || {});
	if (!parsed.success) {
		const message = parsed.error.errors[0]?.message || "Invalid request";
		return res.status(400).json({ success: false, message });
	}
	req.body = parsed.data;
	return next();
};

// GET /api/storyweaver/stories (List stories from API or DB)
router.get("/", validateQuery(listStoriesSchema), controller.listStories);

// GET /api/storyweaver/stories/db (Direct database query for saved audio stories)
router.get("/db", validateQuery(listStoriesSchema), controller.listDbStories);

// GET /api/storyweaver/stories/stats (Database audio storage statistics)
router.get("/stats", controller.getDbStats);

// POST /api/storyweaver/stories/sync (Sync available audio stories to DB)
router.post("/sync", validateBody(syncAudiosSchema), controller.triggerSync);

// GET /api/storyweaver/stories/:id (Get story details & pages for reader)
router.get("/:id", validateParams(storyIdSchema), controller.getStory);

// POST /api/storyweaver/stories/:id/generate-audio (Generate TTS audio & save to R2)
router.post("/:id/generate-audio", validateParams(storyIdSchema), controller.generateAudio);

module.exports = router;
