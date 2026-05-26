const express = require("express");
const controller = require("./children.controller");
const { childProfileSchema } = require("./children.validation");
const { requireAuth } = require("../../middleware/auth.middleware");

const router = express.Router();

const validate = (schema) => (req, res, next) => {
	const parsed = schema.safeParse(req.body);
	if (!parsed.success) {
		const message = parsed.error.errors[0]?.message || "Invalid request";
		return res.status(400).json({ success: false, message });
	}
	req.body = parsed.data;
	return next();
};

router.get("/me", requireAuth, controller.getMe);
router.post("/me", requireAuth, validate(childProfileSchema), controller.upsertMe);
router.post("/create", requireAuth, validate(childProfileSchema), controller.upsertMe);

module.exports = router;
