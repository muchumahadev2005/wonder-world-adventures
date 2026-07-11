const express  = require("express");
const multer   = require("multer");
const controller = require("../controllers/stories.controller");
const { requireAdmin } = require("../../../middleware/adminAuth.middleware");
const {
	listStoriesSchema,
	storySchema,
	updateStorySchema,
} = require("../validators/stories.validation");

const router = express.Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── Validation middleware ─────────────────────────────────────────

const validateBody = (schema) => (req, res, next) => {
	const parsed = schema.safeParse(req.body || {});
	if (!parsed.success) {
		const message = parsed.error.errors[0]?.message || "Invalid request";
		return res.status(400).json({ success: false, message, errors: parsed.error.errors });
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

// ── Static routes MUST come before /:id ──────────────────────────

// Admin-only: template / export / import
router.get("/template/excel",    requireAdmin, controller.downloadTemplate);
router.get("/export/excel",      requireAdmin, controller.exportExcel);
router.post("/import/excel",     requireAdmin, upload.single("file"), controller.importExcel);

// Public read routes (existing — unchanged)
router.get("/",                   validateQuery(listStoriesSchema), controller.listStories);
router.get("/recommended",        controller.recommended);
router.get("/category/:category", controller.listByCategory);

// Admin-only: duplicate (before /:id GET)
router.post("/:id/duplicate",    requireAdmin, controller.duplicateStory);

// Public CRUD
router.get("/:id",                controller.getStory);
router.post("/",    validateBody(storySchema),       controller.createStory);
router.put("/:id",  validateBody(updateStorySchema),  controller.updateStory);
router.delete("/:id",                                 controller.deleteStory);


module.exports = router;
