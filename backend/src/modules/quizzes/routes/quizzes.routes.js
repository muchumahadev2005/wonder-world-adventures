const express = require("express");
const controller = require("../controllers/quizzes.controller");
const { submitQuizSchema } = require("../validators/quizzes.validation");
const { requireAuth } = require("../../../middleware/auth.middleware");

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

router.post("/submit", requireAuth, validateBody(submitQuizSchema), controller.submitQuiz);
router.get("/result/:id", requireAuth, controller.getResult);

module.exports = router;
