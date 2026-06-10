const { env } = require("../config/env");

const errorMiddleware = (err, req, res, next) => {
	const status = err.status || err.statusCode || 500;
	const message = err.message || (err.error && err.error.description) || "Server error";

	if (env !== "production") {
		// eslint-disable-next-line no-console
		console.error(err);
	}

	res.status(status).json({
		success: false,
		message,
		...(err.code ? { code: err.code } : {}),
		...(env !== "production" ? { stack: err.stack } : {}),
	});
};

module.exports = errorMiddleware;
