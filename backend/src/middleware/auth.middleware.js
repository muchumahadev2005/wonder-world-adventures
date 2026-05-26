const jwt = require("jsonwebtoken");
const prisma = require("../prisma/prismaClient");
const { jwtSecret } = require("../config/env");

const requireAuth = async (req, res, next) => {
	const authHeader = req.headers.authorization || "";
	const [, token] = authHeader.split(" ");

	if (!token) {
		return res.status(401).json({ success: false, message: "Unauthorized" });
	}

	try {
		const decoded = jwt.verify(token, jwtSecret);
		const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
		if (!user) {
			return res.status(401).json({ success: false, message: "Unauthorized" });
		}
		req.user = user;
		return next();
	} catch (err) {
		return res.status(401).json({ success: false, message: "Invalid token" });
	}
};

module.exports = { requireAuth };
