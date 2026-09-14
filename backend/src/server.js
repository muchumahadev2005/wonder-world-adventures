const app    = require("./app");
const { connectDb } = require("./config/db");
const { port } = require("./config/env");
const logger = require("./utils/logger");
const { initRedis } = require("./utils/redis");
const prisma = require("./prisma/prismaClient");

// ── Neon keep-alive ───────────────────────────────────────────────────────────
// Neon free tier auto-suspends after 5 min of inactivity.
// Ping the DB every 4 minutes to keep the compute awake.
const startKeepAlive = () => {
	const INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
	setInterval(async () => {
		try {
			await prisma.$queryRaw`SELECT 1`;
			logger.debug("[keep-alive] DB ping OK");
		} catch (err) {
			logger.warn("[keep-alive] DB ping failed", { error: err.message });
		}
	}, INTERVAL_MS);
	logger.info("[keep-alive] Neon DB keep-alive started (every 4 min)");
};

const start = async () => {
	try {
		await connectDb().catch((err) => {
			logger.error("Database connection failed, running in degraded mode", err);
		});
		// Initialize Redis (no-op graceful fallback if REDIS_URL not set)
		await initRedis().catch((err) => {
			logger.warn("Redis initialization failed, continuing without cache", err);
		});
		app.listen(port, () => {
			logger.info(`StoryNest World API running on port ${port}`);
			logger.info(`Database: ${(process.env.DATABASE_URL || "").substring(0, 50)}...`);
			startKeepAlive();
		});
	} catch (err) {
		logger.error("Failed to start server", err);
		process.exit(1);
	}
};

start();
