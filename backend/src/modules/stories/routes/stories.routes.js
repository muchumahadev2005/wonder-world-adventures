const express = require("express");
const controller = require("../controllers/stories.controller");
const {
	listStoriesSchema,
	storySchema,
	updateStorySchema,
} = require("../validators/stories.validation");

const router = express.Router();

const validateBody = (schema) => (req, res, next) => {
	const parsed = schema.safeParse(req.body || {});
	if (!parsed.success) {
		const message = parsed.error.errors[0]?.message || "Invalid request";
		return res.status(400).json({ success: false, message });
	}
	req.body = parsed.data;
	return next();
};

const validateQuery = (schema) => (req, res, next) => {
	const parsed = schema.safeParse(req.query || {});
	if (!parsed.success) {
		const message = parsed.error.errors[0]?.message || "Invalid request";
		return res.status(400).json({ success: false, message });
	}
	req.query = parsed.data;
	return next();
};

router.get("/", validateQuery(listStoriesSchema), controller.listStories);
router.get("/recommended", controller.recommended);
router.get("/category/:category", controller.listByCategory);
router.get("/:id", controller.getStory);
router.post("/", validateBody(storySchema), controller.createStory);
router.put("/:id", validateBody(updateStorySchema), controller.updateStory);
router.delete("/:id", controller.deleteStory);

module.exports = router;
