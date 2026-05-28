const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const errorMiddleware = require("./middleware/error.middleware");
const { clientUrl, clientUrls } = require("./config/env");
const logger = require("./utils/logger");

const app = express();

const normalizeOrigin = (origin) => origin?.replace(/\/$/, "");
const allowedOrigins = new Set([
	normalizeOrigin(clientUrl),
	...clientUrls.map(normalizeOrigin),
	"http://localhost:5173",
	"http://localhost:8080",
]);
const isVercelPreview = (origin) => /https:\/\/.+\.vercel\.app$/.test(origin || "");
const isAllowedOrigin = (origin) => {
	const normalized = normalizeOrigin(origin);
	return Boolean(normalized) && (allowedOrigins.has(normalized) || isVercelPreview(normalized));
};

const corsOptions = {
	origin: (origin, callback) => {
		if (!origin) return callback(null, true);
		if (isAllowedOrigin(origin)) {
			return callback(null, true);
		}
		logger.warn("CORS rejected origin", {
			origin,
			allowedOrigins: Array.from(allowedOrigins),
		});
		return callback(new Error("Not allowed by CORS"));
	},
	credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "2mb" }));

app.use("/api", routes);

app.use(errorMiddleware);

module.exports = app;
