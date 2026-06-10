const express = require("express");
const controller = require("./payments.controller");
const { createOrderSchema, verifySchema } = require("./payments.validation");
const { requireAuth } = require("../../middleware/auth.middleware");

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

// All payment routes require authentication
router.post("/create-order", requireAuth, validate(createOrderSchema), controller.createOrder);
router.post("/verify", requireAuth, validate(verifySchema), controller.verifyPayment);
router.get("/history", requireAuth, controller.getHistory);

module.exports = router;
