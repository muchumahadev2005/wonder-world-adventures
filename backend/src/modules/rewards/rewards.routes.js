const express = require("express");
const controller = require("./rewards.controller");
const { claimRewardSchema } = require("./rewards.validation");
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

router.get("/", requireAuth, controller.getRewards);
router.post("/claim", requireAuth, validateBody(claimRewardSchema), controller.claimReward);

module.exports = router;
