const catchAsync = require("../../utils/catchAsync");
const authService = require("./auth.service");

const requestVerification = catchAsync(async (req, res) => {
	await authService.requestEmailVerification(req.body.email);
	res.json({ success: true, message: "Verification email sent." });
});

const verifyEmail = catchAsync(async (req, res) => {
	await authService.verifyEmail(req.body);
	res.json({ success: true, message: "Email verified." });
});

const signup = catchAsync(async (req, res) => {
	const result = await authService.signup(req.body);
	res.json({ success: true, ...result });
});

const login = catchAsync(async (req, res) => {
	const result = await authService.login(req.body);
	res.json({ success: true, ...result });
});

const google = catchAsync(async (req, res) => {
	const result = await authService.googleAuth(req.body);
	res.json({ success: true, ...result });
});

const forgotPassword = catchAsync(async (req, res) => {
	await authService.forgotPassword(req.body.email);
	res.json({ success: true, message: "Reset email sent if account exists." });
});

const resetPassword = catchAsync(async (req, res) => {
	await authService.resetPassword(req.body);
	res.json({ success: true, message: "Password updated." });
});

module.exports = {
	requestVerification,
	verifyEmail,
	signup,
	login,
	google,
	forgotPassword,
	resetPassword,
};
