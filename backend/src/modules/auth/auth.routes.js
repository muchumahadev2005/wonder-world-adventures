const express = require("express");
const controller = require("./auth.controller");
const {
	requestVerificationSchema,
	verifyEmailSchema,
	signupSchema,
	loginSchema,
	googleSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
} = require("./auth.validation");

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

router.post("/request-verification", validate(requestVerificationSchema), controller.requestVerification);
router.post("/verify-email", validate(verifyEmailSchema), controller.verifyEmail);
router.post("/signup", validate(signupSchema), controller.signup);
router.post("/login", validate(loginSchema), controller.login);
router.post("/google", validate(googleSchema), controller.google);
router.post("/forgot-password", validate(forgotPasswordSchema), controller.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), controller.resetPassword);

module.exports = router;
