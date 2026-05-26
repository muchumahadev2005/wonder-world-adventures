const { z } = require("zod");

const requestVerificationSchema = z.object({
	email: z.string().email(),
});

const verifyEmailSchema = z.object({
	email: z.string().email(),
	code: z.string().min(4).optional(),
	token: z.string().min(10).optional(),
}).refine((data) => data.code || data.token, {
	message: "Provide code or token",
	path: ["code"],
});

const signupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
	name: z.string().min(1).optional(),
});

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(4),
});

const googleSchema = z.object({
	accessToken: z.string().min(10),
});

const forgotPasswordSchema = z.object({
	email: z.string().email(),
});

const resetPasswordSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
	code: z.string().min(4).optional(),
	token: z.string().min(10).optional(),
}).refine((data) => data.code || data.token, {
	message: "Provide code or token",
	path: ["code"],
});

module.exports = {
	requestVerificationSchema,
	verifyEmailSchema,
	signupSchema,
	loginSchema,
	googleSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
};
