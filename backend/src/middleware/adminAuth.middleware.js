const jwt = require("jsonwebtoken");
const prisma = require("../prisma/prismaClient");
const { jwtSecret } = require("../config/env");

const ADMIN_EMAILS = ["admin@storynest.com"];

const requireAdmin = async (req, res, next) => {
	const authHeader = req.headers.authorization || "";
	const [, headerToken] = authHeader.split(" ");
	// Also accept token as query param for browser-tab downloads (template, export)
	const token = headerToken || req.query.token;

	if (!token) {
		return res.status(401).json({ success: false, message: "Unauthorized" });
	}

	try {
		const decoded = jwt.verify(token, jwtSecret);
		const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
		if (!user) {
			return res.status(401).json({ success: false, message: "Unauthorized" });
		}
		if (!ADMIN_EMAILS.includes(user.email)) {
			return res.status(403).json({ success: false, message: "Admin access required" });
		}
		req.user = user;
		return next();
	} catch (err) {
		return res.status(401).json({ success: false, message: "Invalid token" });
	}
};

module.exports = { requireAdmin };
