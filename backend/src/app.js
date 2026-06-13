const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const errorMiddleware = require("./middleware/error.middleware");
const { clientUrl, clientUrls, logRequests } = require("./config/env");
const logger = require("./utils/logger");

const app = express();

const normalizeOrigin = (origin) => origin?.replace(/\/$/, "");
const allowedOrigins = new Set([
	normalizeOrigin(clientUrl),
	...clientUrls.map(normalizeOrigin),
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

app.use((req, res, next) => {
	if (!logRequests) return next();
	logger.info("Incoming request", {
		method: req.method,
		path: req.originalUrl,
		origin: req.headers.origin || null,
	});
	return next();
});

app.use((req, res, next) => {
	if (!logRequests) return next();
	if (!req.path.startsWith("/api/auth")) return next();
	const startedAt = Date.now();
	res.on("finish", () => {
		logger.info("Auth request", {
			method: req.method,
			path: req.originalUrl,
			status: res.statusCode,
			ms: Date.now() - startedAt,
			origin: req.headers.origin || null,
		});
	});
	return next();
});
app.use(express.json({ limit: "10mb" }));

// Serve uploaded media files
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.use("/api", routes);

app.use(errorMiddleware);

module.exports = app;
