/**
 * Redis client with graceful no-op fallback.
 * Uses @upstash/redis via HTTP REST.
 * If UPSTASH_REDIS_REST_URL is not set, all operations silently succeed with null/void.
 */

const logger = require("./logger");

let Redis = null;
try {
	Redis = require("@upstash/redis").Redis;
} catch {
	// @upstash/redis not installed
}

let client = null;
let redisAvailable = false;

const initRedis = async () => {
	const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
	const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
	
	if (!redisUrl || !redisToken) {
		logger.info("[redis] UPSTASH_REDIS_REST_URL or TOKEN not set — caching disabled (no-op mode)");
		return;
	}
	if (!Redis) {
		logger.warn("[redis] @upstash/redis not installed — caching disabled");
		return;
	}

	try {
		client = new Redis({
			url: redisUrl,
			token: redisToken,
		});
		
		// Ping to verify connection
		const res = await client.ping();
		if (res === "PONG") {
			redisAvailable = true;
			logger.info("[redis] Connected to Upstash Redis");
		}
	} catch (err) {
		logger.warn("[redis] Failed to initialize Upstash — continuing without cache", { message: err.message });
		client = null;
		redisAvailable = false;
	}
};

/**
 * Get a cached value by key.
 * @param {string} key
 * @returns {Promise<string|null>}
 */
const get = async (key) => {
	if (!client || !redisAvailable) return null;
	try {
		const val = await client.get(key);
		// Upstash redis client automatically parses JSON if it is stored as JSON.
		// If our app expects a string, we might need to stringify it if Upstash parsed it.
		if (val && typeof val === "object") {
			return JSON.stringify(val);
		}
		return val;
	} catch (err) {
		logger.warn("[redis] GET failed", { key, message: err.message });
		return null;
	}
};

/**
 * Set a key with an optional TTL in seconds.
 * @param {string} key
 * @param {string} value
 * @param {number} [ttlSeconds=86400]
 */
const set = async (key, value, ttlSeconds = 86400) => {
	if (!client || !redisAvailable) return;
	try {
		await client.set(key, value, { ex: ttlSeconds });
	} catch (err) {
		logger.warn("[redis] SET failed", { key, message: err.message });
	}
};

/**
 * Delete a key.
 * @param {string} key
 */
const del = async (key) => {
	if (!client || !redisAvailable) return;
	try {
		await client.del(key);
	} catch (err) {
		logger.warn("[redis] DEL failed", { key, message: err.message });
	}
};

const isAvailable = () => redisAvailable;

module.exports = { initRedis, get, set, del, isAvailable };
