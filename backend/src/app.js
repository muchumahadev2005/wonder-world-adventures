const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const errorMiddleware = require("./middleware/error.middleware");
const { clientUrl, clientUrls } = require("./config/env");

const app = express();

const normalizeOrigin = (origin) => origin?.replace(/\/$/, "");
const allowedOrigins = new Set([
	normalizeOrigin(clientUrl),
	...clientUrls.map(normalizeOrigin),
	"http://localhost:5173",
	"http://localhost:8080",
]);
const isVercelPreview = (origin) => /https:\/\/.+\.vercel\.app$/.test(origin || "");

app.use(cors({
	origin: (origin, callback) => {
		if (!origin) return callback(null, true);
		const normalized = normalizeOrigin(origin);
		if (allowedOrigins.has(normalized) || isVercelPreview(normalized)) {
			return callback(null, true);
		}
		return callback(new Error("Not allowed by CORS"));
	},
	credentials: true,
}));
app.use(express.json({ limit: "2mb" }));

app.use("/api", routes);

app.use(errorMiddleware);

module.exports = app;
