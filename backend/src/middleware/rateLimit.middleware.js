/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API Rate Limiting Middleware Suite
 *
 * Provides:
 *   - Global API rate limiter (prevents DDoS & scraping)
 *   - Strict Authentication rate limiter (protects against brute-force & credential stuffing)
 *   - AI / Chatbot rate limiter (protects OpenRouter / LLM quotas and costs)
 *   - Audio / TTS generation rate limiter (protects Edge TTS and storage)
 *   - Standard RFC 6585 RateLimit-* headers and consistent JSON error formats
 * ═══════════════════════════════════════════════════════════════════════════
 */

const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

/**
 * Standard error response formatter for rate limit violations.
 */
const createRateLimitHandler = (message, code = "RATE_LIMIT_EXCEEDED") => {
	return (req, res, _next, options) => {
		logger.warn(`[rate-limit] ${code} on ${req.method} ${req.originalUrl} from IP ${req.ip}`);
		res.status(options.statusCode || 429).json({
			success: false,
			message,
			code,
			retryAfterSeconds: Math.ceil(options.windowMs / 1000),
		});
	};
};

/**
 * Global rate limiter across all /api routes.
 * 300 requests per 15-minute window per IP.
 */
const globalRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 300, // limit each IP to 300 requests per windowMs
	standardHeaders: true, // Return standard `RateLimit-*` headers
	legacyHeaders: false, // Disable `X-RateLimit-*` headers
	skip: (req) => {
		// Never rate limit health checks or preflight CORS requests
		if (req.method === "OPTIONS") return true;
		if (req.path === "/health" || req.path === "/api/health") return true;
		return false;
	},
	handler: createRateLimitHandler(
		"Too many requests from this IP. Please slow down and try again shortly.",
		"GLOBAL_RATE_LIMIT_EXCEEDED"
	),
});

/**
 * Strict rate limiter for sensitive authentication endpoints:
 * /login, /signup, /request-verification, /verify-email, /forgot-password, /reset-password
 * 15 requests per 15-minute window per IP.
 */
const authRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 15, // limit each IP to 15 auth attempts per 15 minutes
	standardHeaders: true,
	legacyHeaders: false,
	skipSuccessfulRequests: false,
	handler: createRateLimitHandler(
		"Too many authentication attempts. For your security, please wait 15 minutes before trying again.",
		"AUTH_RATE_LIMIT_EXCEEDED"
	),
});

/**
 * Rate limiter for AI & Chatbot LLM endpoints:
 * /api/chatbot/message, /api/chat/message, /api/life-skills/chat
 * 25 requests per minute per IP.
 */
const aiRateLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 25, // limit each IP to 25 AI queries per minute
	standardHeaders: true,
	legacyHeaders: false,
	handler: createRateLimitHandler(
		"AI interaction limit reached. Please wait a moment before sending another message.",
		"AI_RATE_LIMIT_EXCEEDED"
	),
});

/**
 * Rate limiter for heavy audio and speech generation endpoints:
 * /api/voice/tts, /api/storyweaver/stories/:id/generate-audio
 * 10 audio generations per minute per IP.
 */
const audioRateLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	handler: createRateLimitHandler(
		"Audio synthesis rate limit reached. Please wait a moment before generating more audio.",
		"AUDIO_RATE_LIMIT_EXCEEDED"
	),
});

module.exports = {
	globalRateLimiter,
	authRateLimiter,
	aiRateLimiter,
	audioRateLimiter,
};
