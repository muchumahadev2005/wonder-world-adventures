const express = require("express");
const controller = require("../controllers/lessons.controller");
const { lessonQuerySchema } = require("../validators/lessons.validation");

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

router.get("/", validateQuery(lessonQuerySchema), controller.listLessons);
router.get("/:id/cards", controller.getLessonCards);
router.get("/:id/quiz", controller.getLessonQuiz);
router.get("/:id", controller.getLesson);

module.exports = router;
