const { z } = require("zod");

const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase());
const nameSchema = z.string().trim().min(3).max(50);
const passwordSchema = z
	.string()
	.min(8)
	.max(30)
	.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
		message: "Password must include upper, lower, number, and special character",
	});

const requestVerificationSchema = z.object({
	email: emailSchema,
});

const verifyEmailSchema = z.object({
	email: emailSchema,
	code: z.string().min(4).optional(),
	token: z.string().min(10).optional(),
}).refine((data) => data.code || data.token, {
	message: "Provide code or token",
	path: ["code"],
});

const signupSchema = z.object({
	name: nameSchema,
	email: emailSchema,
	password: passwordSchema,
	confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords do not match",
	path: ["confirmPassword"],
});

const loginSchema = z.object({
	email: emailSchema,
	password: z.string().min(8),
});

const googleSchema = z.object({
	accessToken: z.string().min(10),
});

const forgotPasswordSchema = z.object({
	email: emailSchema,
});

const resetPasswordSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
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
