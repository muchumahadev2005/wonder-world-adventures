const express = require("express");
const controller = require("./progress.controller");
const { progressUpdateSchema } = require("./progress.validation");
const { requireAuth } = require("../../middleware/auth.middleware");

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

router.get("/", requireAuth, controller.getProgress);
router.post("/update", requireAuth, validateBody(progressUpdateSchema), controller.updateProgress);

module.exports = router;
