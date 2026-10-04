/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Token & Secret Security Utility
 *
 * Provides:
 *   - Token & JWT masking for safe display and logging
 *   - URL query parameter scrubbing (?token=..., &token=..., etc.)
 *   - Database connection string credentials scrubbing
 *   - Recursive object and array sanitization for logs, errors, and Sentry
 *   - Express response sanitizer middleware to prevent accidental token/hash leakage
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Keys that are strictly redacted from logs, errors, and public payloads
const SENSITIVE_KEY_PATTERNS = [
	/^token$/i,
	/^authtoken$/i,
	/^auth_token$/i,
	/^accesstoken$/i,
	/^access_token$/i,
	/^refreshtoken$/i,
	/^refresh_token$/i,
	/^idtoken$/i,
	/^id_token$/i,
	/^jwt$/i,
	/^password$/i,
	/^passwordhash$/i,
	/^tokenhash$/i,
	/^token_hash$/i,
	/^codehash$/i,
	/^code_hash$/i,
	/^secret$/i,
	/^clientsecret$/i,
	/^client_secret$/i,
	/^apikey$/i,
	/^api_key$/i,
	/^authorization$/i,
	/^proxy-authorization$/i,
	/^cookie$/i,
	/^set-cookie$/i,
	/^cvv$/i,
	/^creditcard$/i,
	/^cardnumber$/i,
	/^privatekey$/i,
	/^private_key$/i,
];

/**
 * Mask a token for semi-readable safe display (e.g. "eyJh...[HIDDEN]...5x9z").
 *
 * @param {string|unknown} token
 * @returns {string}
 */
const maskToken = (token) => {
	if (!token || typeof token !== "string") return "[NONE]";
	const str = token.trim();
	if (str.length <= 8) return "••••••••";
	if (str.length <= 16) return `${str.slice(0, 2)}••••••••${str.slice(-2)}`;
	// Long token (e.g. JWT or 32-byte hex)
	return `${str.slice(0, 4)}...[HIDDEN]...${str.slice(-4)}`;
};

/**
 * Mask an API key (e.g. "sk-or-v1-••••••••4a8b").
 *
 * @param {string|unknown} key
 * @returns {string}
 */
const maskApiKey = (key) => {
	if (!key || typeof key !== "string") return "[NONE]";
	const str = key.trim();
	if (str.length <= 8) return "••••••••";
	return `••••••••${str.slice(-4)}`;
};

/**
 * Mask passwords and credentials in database URLs:
 * "postgresql://user:password@host:5432/db" -> "postgresql://user:****@host:5432/db"
 *
 * @param {string} url
 * @returns {string}
 */
const maskDatabaseUrl = (url) => {
	if (!url || typeof url !== "string") return "";
	return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
};

/**
 * Mask tokens and codes inside query strings in URLs:
 * "https://app.com/verify?token=12345&email=a@b.com" -> "...?token=[HIDDEN]&email=a@b.com"
 *
 * @param {string} urlStr
 * @returns {string}
 */
const maskUrlTokens = (urlStr) => {
	if (!urlStr || typeof urlStr !== "string") return urlStr;
	return urlStr
		.replace(/([?&](?:token|code|accessToken|access_token|refreshToken|refresh_token|jwt|apiKey|api_key|secret)=)[^&#\s]+/gi, "$1[HIDDEN]")
		.replace(/(Bearer\s+)[A-Za-z0-9-_=.]+/gi, "$1[HIDDEN]");
};

/**
 * Check whether a property key matches any sensitive pattern.
 *
 * @param {string} key
 * @returns {boolean}
 */
const isSensitiveKey = (key) => {
	if (!key || typeof key !== "string") return false;
	return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
};

/**
 * Recursively sanitize an object, array, or primitive to hide sensitive tokens and keys.
 *
 * @param {unknown} val
 * @param {number} [depth=0]
 * @returns {unknown}
 */
const sanitizeSensitive = (val, depth = 0) => {
	if (depth > 8) return "[MAX_DEPTH]";
	if (val === null || val === undefined) return val;

	if (typeof val === "string") {
		// Mask Authorization bearer header values
		if (/^Bearer\s+/i.test(val)) {
			return "Bearer [HIDDEN_TOKEN]";
		}
		// Mask URLs that contain tokens in query parameters
		if (val.includes("?") && /(token|code|secret|apiKey)=/i.test(val)) {
			return maskUrlTokens(val);
		}
		return val;
	}

	if (typeof val !== "object") {
		return val;
	}

	if (val instanceof Error) {
		const cleanErr = {
			name: val.name,
			message: maskUrlTokens(val.message),
			code: val.code,
			status: val.status || val.statusCode,
		};
		if (val.stack && process.env.NODE_ENV !== "production") {
			cleanErr.stack = maskUrlTokens(val.stack);
		}
		return cleanErr;
	}

	if (Array.isArray(val)) {
		return val.map((item) => sanitizeSensitive(item, depth + 1));
	}

	const sanitized = {};
	for (const [key, propVal] of Object.entries(val)) {
		if (isSensitiveKey(key)) {
			sanitized[key] = "[REDACTED]";
		} else if (typeof propVal === "object" && propVal !== null) {
			sanitized[key] = sanitizeSensitive(propVal, depth + 1);
		} else if (typeof propVal === "string") {
			if (/^Bearer\s+/i.test(propVal)) {
				sanitized[key] = "Bearer [HIDDEN_TOKEN]";
			} else if (propVal.includes("?") && /(token|code|secret)=/i.test(propVal)) {
				sanitized[key] = maskUrlTokens(propVal);
			} else {
				sanitized[key] = propVal;
			}
		} else {
			sanitized[key] = propVal;
		}
	}
	return sanitized;
};

/**
 * Sanitizes an array of logger arguments before printing to console/logs.
 *
 * @param  {...any} args
 * @returns {any[]}
 */
const sanitizeLogArgs = (...args) => {
	return args.map((arg) => {
		if (typeof arg === "string") {
			return maskUrlTokens(maskDatabaseUrl(arg));
		}
		if (typeof arg === "object" && arg !== null) {
			return sanitizeSensitive(arg);
		}
		return arg;
	});
};

/**
 * Express middleware to ensure response payloads never accidentally leak sensitive
 * internal hashes (e.g. tokenHash, codeHash, password) even if a service forgets to exclude them.
 */
const hideTokensResponseMiddleware = (req, res, next) => {
	const originalJson = res.json.bind(res);

	res.json = (body) => {
		if (body && typeof body === "object") {
			// Clean internal hashes from public JSON payloads
			const stripInternalHashes = (obj, d = 0) => {
				if (d > 5 || !obj || typeof obj !== "object") return;
				if (Array.isArray(obj)) {
					obj.forEach((item) => stripInternalHashes(item, d + 1));
					return;
				}
				// Remove critical server-only fields if present
				delete obj.password;
				delete obj.passwordHash;
				delete obj.tokenHash;
				delete obj.codeHash;
				delete obj.googleClientSecret;
				delete obj.razorpayKeySecret;
				delete obj.r2SecretAccessKey;

				for (const k of Object.keys(obj)) {
					if (typeof obj[k] === "object" && obj[k] !== null) {
						stripInternalHashes(obj[k], d + 1);
					}
				}
			};

			try {
				stripInternalHashes(body);
			} catch (_) {
				// Non-blocking fallback
			}
		}
		return originalJson(body);
	};

	return next();
};

module.exports = {
	maskToken,
	maskApiKey,
	maskDatabaseUrl,
	maskUrlTokens,
	isSensitiveKey,
	sanitizeSensitive,
	sanitizeLogArgs,
	hideTokensResponseMiddleware,
};
