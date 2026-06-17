const app = require("./app");
const { connectDb } = require("./config/db");
const { port } = require("./config/env");
const logger = require("./utils/logger");
const { initRedis } = require("./utils/redis");

const start = async () => {
	try {
		await connectDb();
		// Initialize Redis (no-op graceful fallback if REDIS_URL not set)
		await initRedis();
		app.listen(port, () => {
			logger.info(`StoryNest World API running on port ${port}`);
			logger.info(`Database: ${(process.env.DATABASE_URL || "").substring(0, 50)}...`);
		});
	} catch (err) {
		logger.error("Failed to start server", err);
		process.exit(1);
	}
};

start();
