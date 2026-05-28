const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const getEnv = (key, fallback) => {
	if (process.env[key]) return process.env[key];
	if (fallback !== undefined) return fallback;
	return undefined;
};

const parseList = (value) => {
	if (!value) return [];
	return value
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
};

const parseBool = (value, fallback = false) => {
	if (value === undefined) return fallback;
	return value === "true" || value === "1";
};

module.exports = {
	env: getEnv("NODE_ENV", "development"),
	port: Number(getEnv("PORT", 5000)),
	databaseUrl: getEnv("DATABASE_URL"),
	jwtSecret: getEnv("JWT_SECRET"),
	googleClientId: getEnv("GOOGLE_CLIENT_ID"),
	googleClientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
	resendApiKey: getEnv("RESEND_API_KEY"),
	resendFromEmail: getEnv("RESEND_FROM_EMAIL"),
	clientUrl: getEnv("CLIENT_URL", "https://wonder-world-adventures.vercel.app"),
	clientUrls: parseList(getEnv("CLIENT_URLS", "")),
	serverUrl: getEnv("SERVER_URL", "https://wonder-world-adventures.onrender.com"),
	logRequests: parseBool(getEnv("LOG_REQUESTS", "false")),
	authDebug: parseBool(getEnv("AUTH_DEBUG", "false")),
};
