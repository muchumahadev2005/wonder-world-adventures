const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const errorMiddleware = require("./middleware/error.middleware");
const { clientUrl } = require("./config/env");

const app = express();

const allowedOrigins = Array.from(new Set([
	clientUrl,
	"http://localhost:5173",
	"http://localhost:8080",
]));

app.use(cors({
	origin: allowedOrigins,
	credentials: true,
}));
app.use(express.json({ limit: "2mb" }));

app.use("/api", routes);

app.use(errorMiddleware);

module.exports = app;
