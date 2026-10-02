/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Cache Service — Production-grade cache-aside + stampede protection
 *
 * Built on top of existing redis.js (Upstash REST).
 * Provides:
 *   - getOrSet()        — cache-aside with automatic DB fallback
 *   - deleteByPattern() — pattern-based invalidation (e.g. "stories:*")
 *   - dedup()           — request deduplication / stampede protection
 *   - buildKey()        — deterministic cache key builder
 *   - Configurable TTLs via environment variables
 *   - Graceful degradation when Redis is unavailable
 *
 * Usage:
 *   const cache = require("../utils/cache");
 *   const data = await cache.getOrSet("stories:list:p1", () => db.query(), 1800);
 * ═══════════════════════════════════════════════════════════════════════════
 */

const redis = require("./redis");
const logger = require("./logger");

// ── TTL defaults (seconds) — overridable via env ──────────────────────────

const TTL = {
	LANGUAGES:        parseInt(process.env.CACHE_TTL_LANGUAGES        || "86400", 10), // 24h
	LEVELS:           parseInt(process.env.CACHE_TTL_LEVELS           || "86400", 10), // 24h
	CATEGORIES:       parseInt(process.env.CACHE_TTL_CATEGORIES       || "86400", 10), // 24h
	STORIES_LIST:     parseInt(process.env.CACHE_TTL_STORIES_LIST     || "1800",  10), // 30min
	STORIES_DETAIL:   parseInt(process.env.CACHE_TTL_STORIES_DETAIL   || "3600",  10), // 1h
	LESSONS_LIST:     parseInt(process.env.CACHE_TTL_LESSONS_LIST     || "1800",  10), // 30min
	LESSONS_DETAIL:   parseInt(process.env.CACHE_TTL_LESSONS_DETAIL   || "3600",  10), // 1h
	GAMES_LIST:       parseInt(process.env.CACHE_TTL_GAMES_LIST       || "7200",  10), // 2h
	PLANS:            parseInt(process.env.CACHE_TTL_PLANS            || "21600", 10), // 6h
	ADMIN_STATS:      parseInt(process.env.CACHE_TTL_ADMIN_STATS      || "120",   10), // 2min
	STORYWEAVER_LIST: parseInt(process.env.CACHE_TTL_STORYWEAVER_LIST || "900",   10), // 15min
	STORYWEAVER_DETAIL: parseInt(process.env.CACHE_TTL_STORYWEAVER_DETAIL || "1800", 10), // 30min
	HOMEPAGE:         parseInt(process.env.CACHE_TTL_HOMEPAGE         || "300",   10), // 5min
	LIFE_SKILLS:      parseInt(process.env.CACHE_TTL_LIFE_SKILLS      || "3600",  10), // 1h
};

// ── In-flight request map for deduplication ───────────────────────────────
// Key → Promise — prevents multiple identical concurrent DB queries
const _inflight = new Map();

/**
 * Build a deterministic cache key from a prefix and an object of params.
 * Sorts keys alphabetically, lowercases string values, omits undefined/null.
 *
 * @param {string} prefix — e.g. "stories:list"
 * @param {object} [params={}] — query params that affect the response
 * @returns {string} — e.g. "stories:list:language:en:page:1:limit:20"
 */
const buildKey = (prefix, params = {}) => {
	const parts = [prefix];
	const sorted = Object.keys(params).sort();
	for (const k of sorted) {
		const v = params[k];
		if (v === undefined || v === null || v === "") continue;
		const val = typeof v === "string" ? v.toLowerCase().trim() : v;
		parts.push(`${k}:${val}`);
	}
	return parts.join(":");
};

/**
 * Cache-aside pattern: get from Redis → on miss, call fetcher → store & return.
 * Gracefully falls back to fetcher() if Redis is unavailable.
 *
 * @param {string} key — cache key
 * @param {Function} fetcher — async function that returns the fresh data
 * @param {number} [ttl=1800] — time-to-live in seconds
 * @returns {Promise<{data: *, source: string}>} — { data, source: "cache"|"db" }
 */
const getOrSet = async (key, fetcher, ttl = 1800) => {
	// 1. Try cache
	try {
		const cached = await redis.get(key);
		if (cached !== null && cached !== undefined) {
			const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
			return { data: parsed, source: "cache" };
		}
	} catch (err) {
		logger.warn("[cache] getOrSet read failed, falling through to DB", { key, error: err.message });
	}

	// 2. Cache miss → call fetcher
	const fresh = await fetcher();

	// 3. Store in cache (fire-and-forget, don't block response)
	try {
		const serialized = JSON.stringify(fresh);
		redis.set(key, serialized, ttl).catch((err) => {
			logger.warn("[cache] getOrSet write failed", { key, error: err.message });
		});
	} catch (err) {
		logger.warn("[cache] getOrSet serialization failed", { key, error: err.message });
	}

	return { data: fresh, source: "db" };
};

/**
 * Request deduplication / stampede protection.
 * If the same key is already in-flight, wait for it instead of hitting DB again.
 *
 * @param {string} key — cache key
 * @param {Function} fetcher — async function
 * @param {number} [ttl=1800]
 * @returns {Promise<{data: *, source: string}>}
 */
const dedup = async (key, fetcher, ttl = 1800) => {
	// If another request is already fetching this key, piggyback on it
	if (_inflight.has(key)) {
		try {
			const result = await _inflight.get(key);
			return { data: result.data, source: "dedup" };
		} catch {
			// If the in-flight request failed, fall through and try ourselves
		}
	}

	// Register this request as in-flight
	const promise = getOrSet(key, fetcher, ttl).finally(() => {
		_inflight.delete(key);
	});

	_inflight.set(key, promise);
	return promise;
};

/**
 * Delete a single cache key or multiple keys.
 * @param {...string} keys
 */
const del = async (...keys) => {
	try {
		await redis.del(...keys);
	} catch (err) {
		logger.warn("[cache] del failed", { keys, error: err.message });
	}
};

/**
 * Invalidate all cached data related to a content type.
 * Uses Upstash Redis pattern deletion (delPattern) to cleanly purge all matching keys across all instances.
 *
 * @param {"stories"|"lessons"|"games"|"languages"|"plans"|"admin"|"storyweaver"|"life-skills"|"homepage"} type
 */
const invalidate = async (type) => {
	try {
		let count = 0;
		switch (type) {
			case "stories":
				count += await redis.delPattern("stories:*");
				count += await redis.delPattern("homepage:*");
				break;
			case "lessons":
				count += await redis.delPattern("lessons:*");
				count += await redis.delPattern("homepage:*");
				break;
			case "games":
				count += await redis.delPattern("games:*");
				break;
			case "languages":
				count += await redis.delPattern("languages:*");
				count += await redis.delPattern("levels:*");
				break;
			case "plans":
				count += await redis.delPattern("plans:*");
				break;
			case "admin":
				count += await redis.delPattern("admin:*");
				break;
			case "storyweaver":
				count += await redis.delPattern("storyweaver:*");
				break;
			case "life-skills":
				count += await redis.delPattern("life-skills:*");
				break;
			case "homepage":
				count += await redis.delPattern("homepage:*");
				break;
			default:
				break;
		}
		logger.info("[cache] invalidated", { type, count });
	} catch (err) {
		logger.warn("[cache] invalidate failed", { type, error: err.message });
	}
};

const cachedQuery = getOrSet;
const cachedDedup = dedup;

module.exports = {
	TTL,
	buildKey,
	getOrSet,
	dedup,
	del,
	deleteKeys: del,
	invalidate,
	cachedQuery,
	cachedDedup,
};
