const express    = require("express");
const controller = require("../controllers/storyweaver.controller");
const { listStoriesSchema, storyIdSchema } = require("../validators/storyweaver.validator");

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

// GET /api/storyweaver/stories
router.get("/", validateQuery(listStoriesSchema), controller.listStories);

// GET /api/storyweaver/stories/:id
router.get("/:id", validateParams(storyIdSchema), controller.getStory);

module.exports = router;
