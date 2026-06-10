const express = require("express");
const controller = require("../controllers/games.controller");
const { gameProgressSchema } = require("../validators/games.validation");
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

router.get("/", controller.listGames);
router.get("/progress", requireAuth, controller.listProgress);
router.post("/progress", requireAuth, validateBody(gameProgressSchema), controller.updateProgress);
router.get("/:id", controller.getGame);

module.exports = router;
