/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Sentry Backend Monitoring Utility (Production-Grade & Child-Safe)
 *
 * Provides:
 *   - Automatic crash and exception capture
 *   - COPPA / Child Privacy scrubbing (strips tokens, passwords, cookies)
 *   - Express error handler integration
 *   - Graceful no-op when SENTRY_DSN is not configured
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Sentry = require("@sentry/node");
const logger = require("./logger");

let isInitialized = false;

const initSentry = () => {
	const dsn = process.env.SENTRY_DSN;
	if (!dsn) {
		logger.info("[sentry] SENTRY_DSN not set — error monitoring disabled (safe mode)");
		return;
	}

	try {
		const { sanitizeSensitive, maskUrlTokens } = require("./tokenSecurity");

		Sentry.init({
			dsn,
			environment: process.env.NODE_ENV || "development",
			// Sample 20% of transactions in production to conserve free tier quota
			tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
			// Privacy Scrubber: Strip sensitive user data, auth tokens, passwords, cookies (COPPA & GDPR)
			beforeSend(event) {
				if (event.request) {
					if (event.request.headers) {
						delete event.request.headers.authorization;
						delete event.request.headers.cookie;
						delete event.request.headers["x-api-key"];
						delete event.request.headers["proxy-authorization"];
					}
					if (event.request.url) {
						event.request.url = maskUrlTokens(event.request.url);
					}
					if (event.request.query_string) {
						event.request.query_string = maskUrlTokens(String(event.request.query_string));
					}
					if (event.request.data) {
						event.request.data = sanitizeSensitive(event.request.data);
					}
				}
				if (event.breadcrumbs) {
					event.breadcrumbs = event.breadcrumbs.map((crumb) => {
						if (crumb.data) crumb.data = sanitizeSensitive(crumb.data);
						if (crumb.message) crumb.message = maskUrlTokens(crumb.message);
						return crumb;
					});
				}
				return event;
			},
		});

		isInitialized = true;
		logger.info("[sentry] Sentry initialized successfully");
	} catch (err) {
		logger.warn("[sentry] Failed to initialize Sentry — continuing without error monitoring", {
			error: err.message,
		});
	}
};

const setupErrorHandler = (app) => {
	if (isInitialized && typeof Sentry.setupExpressErrorHandler === "function") {
		Sentry.setupExpressErrorHandler(app);
	}
};

const captureException = (err, context) => {
	if (isInitialized) {
		return Sentry.captureException(err, context);
	}
	return null;
};

module.exports = {
	initSentry,
	setupErrorHandler,
	captureException,
	isAvailable: () => isInitialized,
};
