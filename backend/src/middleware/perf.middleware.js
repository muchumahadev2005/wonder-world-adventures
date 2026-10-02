/**
 * Performance logging middleware.
 * Tracks API response time, cache hit/miss status, and endpoint.
 * Adds X-Response-Time and X-Cache-Source headers to responses.
 *
 * Usage:
 *   app.use(perfMiddleware);                    // global
 *   router.get("/", perfMiddleware, handler);   // per-route
 */

const logger = require("../utils/logger");

const SLOW_THRESHOLD_MS = parseInt(process.env.PERF_SLOW_THRESHOLD_MS || "500", 10);

const perfMiddleware = (req, res, next) => {
	const start = Date.now();

	// Attach a helper for controllers to report cache source
	req._cacheSource = null;
	req.setCacheSource = (source) => {
		req._cacheSource = source;
	};

	const originalJson = res.json.bind(res);
	res.json = function (body) {
		const ms = Date.now() - start;
		const source = req._cacheSource || "none";

		// Set response headers
		res.setHeader("X-Response-Time", `${ms}ms`);
		if (source !== "none") {
			res.setHeader("X-Cache-Source", source);
		}

		// Structured log (only for API routes, skip health checks)
		if (req.originalUrl !== "/api/health") {
			const entry = {
				method: req.method,
				path: req.originalUrl.split("?")[0],
				status: res.statusCode,
				ms,
				cache: source,
			};

			if (ms > SLOW_THRESHOLD_MS) {
				logger.warn("[perf] SLOW", entry);
			} else if (process.env.PERF_LOG_ALL === "true") {
				logger.info("[perf]", entry);
			}
		}

		return originalJson(body);
	};

	next();
};

module.exports = perfMiddleware;
