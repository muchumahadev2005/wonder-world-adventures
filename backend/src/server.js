const app = require("./app");
const { connectDb } = require("./config/db");
const { port } = require("./config/env");
const logger = require("./utils/logger");

const start = async () => {
	try {
		await connectDb();
		app.listen(port, () => {
			logger.info(`StoryNest World API running on port ${port}`);
		});
	} catch (err) {
		logger.error("Failed to start server", err);
		process.exit(1);
	}
};

start();
