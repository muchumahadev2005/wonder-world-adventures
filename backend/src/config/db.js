const prisma = require("../prisma/prismaClient");
const logger = require("../utils/logger");

const connectDb = async () => {
	try {
		await prisma.$connect();
		logger.info("Database connected successfully");
	} catch (err) {
		logger.error("Database connection failed", err);
		throw err;
	}
};

module.exports = { prisma, connectDb };
