const { env } = require("../config/env");
const logger = require("../utils/logger");

const errorMiddleware = (err, req, res, next) => {
	let status = err.status || err.statusCode || 500;
	let message = err.message || (err.error && err.error.description) || "Server error";
	let errors = undefined;

	// Handle Zod validation errors
	if (err.name === "ZodError" || (err.errors && Array.isArray(err.errors) && err.issues)) {
		status = 400;
		message = "Validation error";
		errors = (err.errors || err.issues).map((issue) => ({
			field: issue.path.join("."),
			message: issue.message,
		}));
	}

	// Handle Prisma errors
	if (err.code && typeof err.code === "string" && err.code.startsWith("P")) {
		// Prisma errors: https://www.prisma.io/docs/reference/api-reference/error-reference
		if (err.code === "P2002") {
			status = 409;
			const fields = err.meta && err.meta.target ? err.meta.target.join(", ") : "fields";
			message = `Unique constraint failed on ${fields}`;
		} else if (err.code === "P2025") {
			status = 404;
			message = err.meta?.cause || "Record not found";
		} else {
			status = 400;
			message = `Database error: ${err.message}`;
		}
	}

	if (env !== "production") {
		logger.error(`[Error] ${status} - ${message}`, err);
	} else if (status === 500) {
		logger.error(`[500 Internal Server Error]`, err);
	}

	res.status(status).json({
		success: false,
		message,
		...(errors ? { errors } : {}),
		...(err.code ? { code: err.code } : {}),
		...(env !== "production" ? { stack: err.stack } : {}),
	});
};

module.exports = errorMiddleware;

