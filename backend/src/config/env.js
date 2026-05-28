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

module.exports = {
	env: getEnv("NODE_ENV", "development"),
	port: Number(getEnv("PORT", 5000)),
	databaseUrl: getEnv("DATABASE_URL"),
	jwtSecret: getEnv("JWT_SECRET"),
	googleClientId: getEnv("GOOGLE_CLIENT_ID"),
	googleClientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
	smtpHost: getEnv("SMTP_HOST"),
	smtpPort: Number(getEnv("SMTP_PORT", 587)),
	smtpEmail: getEnv("SMTP_EMAIL"),
	smtpPassword: getEnv("SMTP_PASSWORD"),
	clientUrl: getEnv("CLIENT_URL", "http://localhost:8080"),
	clientUrls: parseList(getEnv("CLIENT_URLS", "")),
	serverUrl: getEnv("SERVER_URL", "http://localhost:5000"),
};
