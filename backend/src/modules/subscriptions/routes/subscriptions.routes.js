const express = require("express");
const controller = require("../controllers/subscriptions.controller");
const { subscribeSchema, emptySchema } = require("../validators/subscriptions.validation");
const { requireAuth } = require("../../../middleware/auth.middleware");

const router = express.Router();

const validate = (schema) => (req, res, next) => {
	const parsed = schema.safeParse(req.body || {});
	if (!parsed.success) {
		const message = parsed.error.errors[0]?.message || "Invalid request";
		return res.status(400).json({ success: false, message });
	}
	req.body = parsed.data;
	return next();
};

router.get("/plans", controller.listPlans);
router.get("/current", requireAuth, controller.getCurrent);
router.get("/status", requireAuth, controller.getStatus);
router.post("/subscribe", requireAuth, validate(subscribeSchema), controller.subscribe);
router.post("/cancel", requireAuth, validate(emptySchema), controller.cancel);

module.exports = router;
