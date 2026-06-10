const express = require("express");
const controller = require("../controllers/levels.controller");
const { levelLessonsQuerySchema } = require("../validators/levels.validation");

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

router.get("/:id/lessons", validateQuery(levelLessonsQuerySchema), controller.getLessonsByLevel);

module.exports = router;
