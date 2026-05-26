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
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		if (existing.provider === "google") {
			throw Object.assign(new Error("Use Google sign-in for this account."), { status: 400 });
		}
		throw Object.assign(new Error("Email already registered."), { status: 400 });
	}

	await prisma.emailVerificationToken.deleteMany({ where: { email } });

	const { token, code, tokenHash, codeHash } = generateTokenPair();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

	await prisma.emailVerificationToken.create({
		data: {
			email,
			tokenHash,
			codeHash,
			expiresAt,
		},
	});

	const verifyLink = `${clientUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
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
		to: email,
		subject: "Verify your StoryNest World account",
		html,
	});
};

const verifyEmail = async ({ email, code, token }) => {
	const now = new Date();
	const where = {
		email,
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
		throw Object.assign(new Error("Invalid or expired verification."), { status: 400 });
	}

	const updated = await prisma.emailVerificationToken.update({
		where: { id: verification.id },
		data: { verifiedAt: new Date() },
	});

	return updated;
};

const signup = async ({ email, password, name }) => {
	const verified = await prisma.emailVerificationToken.findFirst({
		where: {
			email,
			verifiedAt: { not: null },
			expiresAt: { gt: new Date() },
		},
		orderBy: { createdAt: "desc" },
	});

	if (!verified) {
		throw Object.assign(new Error("Email not verified."), { status: 400 });
	}

	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		throw Object.assign(new Error("Email already registered."), { status: 400 });
	}

	const hashedPassword = await bcrypt.hash(password, 10);
	const displayName = name || email.split("@")[0];

	const user = await prisma.user.create({
		data: {
			name: displayName,
			email,
			password: hashedPassword,
			provider: "email",
			isVerified: true,
		},
	});

	await prisma.emailVerificationToken.deleteMany({ where: { email } });

	const token = createJwt(user);
	return { user: getSafeUser(user), token };
};

const login = async ({ email, password }) => {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user || user.provider !== "email") {
		throw Object.assign(new Error("Invalid credentials."), { status: 400 });
	}
	if (!user.isVerified) {
		throw Object.assign(new Error("Email not verified."), { status: 400 });
	}
	const isMatch = await bcrypt.compare(password, user.password || "");
	if (!isMatch) {
		throw Object.assign(new Error("Invalid credentials."), { status: 400 });
	}
	return { user: getSafeUser(user), token: createJwt(user) };
};

const googleAuth = async ({ accessToken }) => {
	const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	if (!response.ok) {
		throw Object.assign(new Error("Google authentication failed."), { status: 400 });
	}
	const profile = await response.json();
	if (!profile.email) {
		throw Object.assign(new Error("Google account has no email."), { status: 400 });
	}

	let user = await prisma.user.findUnique({ where: { email: profile.email } });
	if (user && user.provider !== "google") {
		throw Object.assign(new Error("Use email login for this account."), { status: 400 });
	}

	if (!user) {
		user = await prisma.user.create({
			data: {
				name: profile.name || profile.given_name || "StoryNest Adventurer",
				email: profile.email,
				profileImage: profile.picture,
				provider: "google",
				isVerified: true,
			},
		});
	}

	return { user: getSafeUser(user), token: createJwt(user) };
};

const forgotPassword = async (email) => {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user || user.provider !== "email") {
		return;
	}

	await prisma.passwordResetToken.deleteMany({ where: { email } });

	const { token, code, tokenHash, codeHash } = generateTokenPair();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 20);

	await prisma.passwordResetToken.create({
		data: {
			email,
			tokenHash,
			codeHash,
			expiresAt,
			userId: user.id,
		},
	});

	const resetLink = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
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
		to: email,
		subject: "Reset your StoryNest World password",
		html,
	});
};

const resetPassword = async ({ email, password, code, token }) => {
	const now = new Date();
	let reset = null;
	const baseWhere = { email, expiresAt: { gt: now }, usedAt: null };

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
		throw Object.assign(new Error("Invalid or expired reset token."), { status: 400 });
	}

	const hashedPassword = await bcrypt.hash(password, 10);
	await prisma.user.update({
		where: { email },
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
