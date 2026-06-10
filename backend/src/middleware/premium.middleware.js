const prisma = require("../../prisma/prismaClient");
const { requireAuth } = require("../../middleware/auth.middleware");

/**
 * requirePremium middleware
 *
 * Must be used AFTER requireAuth (req.user must be set).
 * Checks the user has an ACTIVE, non-expired UserSubscription.
 * If not, responds 403 with a structured error and payment redirect hint.
 */
const requirePremium = async (req, res, next) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ success: false, message: "Unauthorized" });
		}

		const active = await prisma.userSubscription.findFirst({
			where: {
				userId,
				status: "ACTIVE",
				endDate: { gt: new Date() },
			},
		});

		if (!active) {
			return res.status(403).json({
				success: false,
				code: "PREMIUM_REQUIRED",
				message: "This content requires an active Premium subscription.",
			});
		}

		req.subscription = active;
		return next();
	} catch (err) {
		return next(err);
	}
};

module.exports = { requirePremium };
