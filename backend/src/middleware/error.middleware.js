const { env } = require("../config/env");

const errorMiddleware = (err, req, res, next) => {
	const status = err.status || 500;
	const message = err.message || "Server error";

	if (env !== "production") {
		// eslint-disable-next-line no-console
		console.error(err);
	}

	res.status(status).json({
		success: false,
		message,
		...(env !== "production" ? { stack: err.stack } : {}),
	});
};

module.exports = errorMiddleware;
