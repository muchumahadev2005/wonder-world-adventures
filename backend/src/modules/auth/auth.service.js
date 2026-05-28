const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const prisma = require("../../prisma/prismaClient");
const {
	jwtSecret,
	smtpHost,
	smtpPort,
	smtpEmail,
	smtpPassword,
	clientUrl,
} = require("../../config/env");

const createHash = (value) => crypto.createHash("sha256").update(value).digest("hex");

const generateTokenPair = () => {
	const token = crypto.randomBytes(32).toString("hex");
	const code = `${Math.floor(100000 + Math.random() * 900000)}`;
	return {
		token,
		code,
		tokenHash: createHash(token),
		codeHash: createHash(code),
	};
};

const createJwt = (user) => {
	return jwt.sign(
		{ sub: user.id, email: user.email },
		jwtSecret,
		{ expiresIn: "7d" }
	);
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const authError = (message, status, code) => Object.assign(new Error(message), { status, code });

const hasProvider = (user, provider) => {
	if (!user?.provider) return false;
	if (Array.isArray(user.provider)) return user.provider.includes(provider);
	return user.provider === provider;
};


const getSafeUser = (user) => ({
	id: user.id,
	name: user.name,
	email: user.email,
	profileImage: user.profileImage,
	provider: user.provider,
	isVerified: user.isVerified,
	createdAt: user.createdAt,
});

const mailer = nodemailer.createTransport({
	host: smtpHost,
	port: smtpPort,
	secure: smtpPort === 465,
	auth: {
		user: smtpEmail,
		pass: smtpPassword,
	},
});

const sendEmail = async ({ to, subject, html }) => {
	await mailer.sendMail({ from: smtpEmail, to, subject, html });
};

const requestEmailVerification = async (email) => {
	const normalizedEmail = normalizeEmail(email);
	const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (existing) {
		if (hasProvider(existing, "google") && !hasProvider(existing, "email")) {
			throw authError("This account uses Google Sign-In.", 400, "ACCOUNT_GOOGLE_ONLY");
		}
		throw authError("Account already exists.", 400, "ACCOUNT_EXISTS");
	}

	await prisma.emailVerificationToken.deleteMany({ where: { email: normalizedEmail } });

	const { token, code, tokenHash, codeHash } = generateTokenPair();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

	await prisma.emailVerificationToken.create({
		data: {
			email: normalizedEmail,
			tokenHash,
			codeHash,
			expiresAt,
		},
	});

	const verifyLink = `${clientUrl}/verify-email?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
	const html = `
		<div style="font-family: Arial, sans-serif;">
			<h2>Verify your StoryNest World email</h2>
			<p>Use this code to verify your email:</p>
			<p style="font-size: 22px; font-weight: bold;">${code}</p>
			<p>Or click the link below:</p>
			<a href="${verifyLink}">${verifyLink}</a>
			<p>This code expires in 15 minutes.</p>
		</div>
	`;
	await sendEmail({
		to: normalizedEmail,
		subject: "Verify your StoryNest World account",
		html,
	});
};

const verifyEmail = async ({ email, code, token }) => {
	const normalizedEmail = normalizeEmail(email);
	const now = new Date();
	const where = {
		email: normalizedEmail,
		expiresAt: { gt: now },
	};

	let verification = null;
	if (token) {
		verification = await prisma.emailVerificationToken.findFirst({
			where: { ...where, tokenHash: createHash(token) },
			orderBy: { createdAt: "desc" },
		});
	} else if (code) {
		verification = await prisma.emailVerificationToken.findFirst({
			where: { ...where, codeHash: createHash(code) },
			orderBy: { createdAt: "desc" },
		});
	}

	if (!verification) {
		throw authError("Invalid or expired verification.", 400, "INVALID_VERIFICATION");
	}

	const updated = await prisma.emailVerificationToken.update({
		where: { id: verification.id },
		data: { verifiedAt: new Date() },
	});

	return updated;
};

const signup = async ({ email, password, name }) => {
	const normalizedEmail = normalizeEmail(email);
	const verified = await prisma.emailVerificationToken.findFirst({
		where: {
			email: normalizedEmail,
			verifiedAt: { not: null },
			expiresAt: { gt: new Date() },
		},
		orderBy: { createdAt: "desc" },
	});

	if (!verified) {
		throw authError("Email not verified.", 400, "EMAIL_NOT_VERIFIED");
	}

	const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (existing) {
		throw authError("Account already exists.", 400, "ACCOUNT_EXISTS");
	}

	const hashedPassword = await bcrypt.hash(password, 10);
	const displayName = name || normalizedEmail.split("@")[0];

	const user = await prisma.user.create({
		data: {
			name: displayName,
			email: normalizedEmail,
			password: hashedPassword,
			provider: ["email"],
			isVerified: true,
		},
	});

	await prisma.emailVerificationToken.deleteMany({ where: { email: normalizedEmail } });

	const token = createJwt(user);
	return { user: getSafeUser(user), token };
};

const login = async ({ email, password }) => {
	const normalizedEmail = normalizeEmail(email);
	const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (!user) {
		throw authError("No account found.", 404, "ACCOUNT_NOT_FOUND");
	}
	if (!hasProvider(user, "email")) {
		throw authError("This account uses Google Sign-In.", 400, "ACCOUNT_GOOGLE_ONLY");
	}
	if (!user.isVerified) {
		throw authError("Email not verified.", 400, "EMAIL_NOT_VERIFIED");
	}
	const isMatch = await bcrypt.compare(password, user.password || "");
	if (!isMatch) {
		throw authError("Invalid credentials.", 400, "INVALID_CREDENTIALS");
	}
	return { user: getSafeUser(user), token: createJwt(user) };
};

const googleAuth = async ({ accessToken }) => {
	const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	if (!response.ok) {
		throw authError("Google authentication failed.", 400, "GOOGLE_AUTH_FAILED");
	}
	const profile = await response.json();
	if (!profile.email) {
		throw authError("Google account has no email.", 400, "GOOGLE_EMAIL_MISSING");
	}
	const normalizedEmail = normalizeEmail(profile.email);

	let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (user) {
		if (!hasProvider(user, "google")) {
			throw authError("This account uses email and password.", 400, "ACCOUNT_EMAIL_ONLY");
		}
		return { user: getSafeUser(user), token: createJwt(user) };
	}

	if (!user) {
		user = await prisma.user.create({
			data: {
				name: profile.name || profile.given_name || "StoryNest Adventurer",
				email: normalizedEmail,
				profileImage: profile.picture,
				provider: ["google"],
				isVerified: true,
			},
		});
	}

	return { user: getSafeUser(user), token: createJwt(user) };
};

const forgotPassword = async (email) => {
	const normalizedEmail = normalizeEmail(email);
	const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (!user) {
		throw authError("No account found.", 404, "ACCOUNT_NOT_FOUND");
	}
	if (!hasProvider(user, "email") && hasProvider(user, "google")) {
		throw authError("This account uses Google Sign-In.", 400, "ACCOUNT_GOOGLE_ONLY");
	}
	if (!hasProvider(user, "email")) {
		throw authError("This account uses Google Sign-In.", 400, "ACCOUNT_GOOGLE_ONLY");
	}
	if (!user.isVerified) {
		throw authError("Email is not verified.", 400, "EMAIL_NOT_VERIFIED");
	}

	await prisma.passwordResetToken.deleteMany({ where: { email: normalizedEmail } });

	const { token, code, tokenHash, codeHash } = generateTokenPair();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 20);

	await prisma.passwordResetToken.create({
		data: {
			email: normalizedEmail,
			tokenHash,
			codeHash,
			expiresAt,
			userId: user.id,
		},
	});

	const resetLink = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
	const html = `
		<div style="font-family: Arial, sans-serif;">
			<h2>Reset your StoryNest World password</h2>
			<p>Use this reset code:</p>
			<p style="font-size: 22px; font-weight: bold;">${code}</p>
			<p>Or click the link below:</p>
			<a href="${resetLink}">${resetLink}</a>
			<p>This code expires in 20 minutes.</p>
		</div>
	`;
	await sendEmail({
		to: normalizedEmail,
		subject: "Reset your StoryNest World password",
		html,
	});
};

const resetPassword = async ({ email, password, code, token }) => {
	const normalizedEmail = normalizeEmail(email);
	const now = new Date();
	let reset = null;
	const baseWhere = { email: normalizedEmail, expiresAt: { gt: now }, usedAt: null };

	if (token) {
		reset = await prisma.passwordResetToken.findFirst({
			where: { ...baseWhere, tokenHash: createHash(token) },
			orderBy: { createdAt: "desc" },
		});
	} else if (code) {
		reset = await prisma.passwordResetToken.findFirst({
			where: { ...baseWhere, codeHash: createHash(code) },
			orderBy: { createdAt: "desc" },
		});
	}

	if (!reset) {
		throw authError("Invalid or expired reset token.", 400, "INVALID_RESET_TOKEN");
	}

	const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (!user) {
		throw authError("No account found.", 404, "ACCOUNT_NOT_FOUND");
	}
	if (!hasProvider(user, "email")) {
		throw authError("This account uses Google Sign-In.", 400, "ACCOUNT_GOOGLE_ONLY");
	}

	const hashedPassword = await bcrypt.hash(password, 10);
	await prisma.user.update({
		where: { email: normalizedEmail },
		data: { password: hashedPassword },
	});

	await prisma.passwordResetToken.update({
		where: { id: reset.id },
		data: { usedAt: new Date() },
	});
};

module.exports = {
	requestEmailVerification,
	verifyEmail,
	signup,
	login,
	googleAuth,
	forgotPassword,
	resetPassword,
};
