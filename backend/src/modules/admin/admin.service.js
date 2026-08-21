const prisma = require("../../prisma/prismaClient");
const { autoExpireSubscriptions } = require("../subscriptions/repositories/subscriptions.repository");

const getStats = async () => {
	// Auto expire subscriptions in background (non-blocking)
	autoExpireSubscriptions().catch(() => {});

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const sevenDaysAgo = new Date(today);
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	const [
		totalUsers,
		totalStories,
		totalLessons,
		totalSubscriptions,
		activeSubscriptions,
		totalPayments,
		successPayments,
		paymentsToday,
		last7DaysPayments,
		last7DaysUsers,
		recentUsers,
		recentPayments,
		recentSubscriptions,
	] = await Promise.all([
		prisma.user.count(),
		prisma.story.count(),
		prisma.lesson.count(),
		prisma.userSubscription.count(),
		prisma.userSubscription.count({ where: { status: "ACTIVE", endDate: { gt: now } } }),
		prisma.payment.count(),
		prisma.payment.findMany({ where: { status: "SUCCESS" }, select: { amount: true, createdAt: true } }),
		prisma.payment.count({ where: { status: "SUCCESS", createdAt: { gte: today } } }),
		prisma.payment.findMany({
			where: { status: "SUCCESS", createdAt: { gte: sevenDaysAgo } },
			select: { amount: true, createdAt: true },
		}),
		prisma.user.findMany({
			where: { createdAt: { gte: sevenDaysAgo } },
			select: { createdAt: true },
		}),
		prisma.user.findMany({
			orderBy: { createdAt: "desc" },
			take: 3,
			select: { name: true, email: true, createdAt: true },
		}),
		prisma.payment.findMany({
			where: { status: "SUCCESS" },
			orderBy: { createdAt: "desc" },
			take: 3,
			include: { user: { select: { name: true } } },
		}),
		prisma.userSubscription.findMany({
			orderBy: { createdAt: "desc" },
			take: 3,
			include: { user: { select: { name: true } }, plan: { select: { name: true } } },
		}),
	]);

	const totalRevenue = successPayments.reduce((sum, p) => sum + p.amount, 0);
	const premiumUsers = activeSubscriptions;

	// Monthly revenue (last 30 days) computed in memory from successPayments
	const monthlyRevenue = successPayments
		.filter((p) => new Date(p.createdAt) >= thirtyDaysAgo)
		.reduce((sum, p) => sum + p.amount, 0);

	// Revenue trend (last 7 days) computed in memory
	const revenueTrend = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const dateStr = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
		const nextD = new Date(d);
		nextD.setDate(nextD.getDate() + 1);

		const daySum = last7DaysPayments
			.filter((p) => {
				const t = new Date(p.createdAt);
				return t >= d && t < nextD;
			})
			.reduce((sum, p) => sum + p.amount, 0);

		revenueTrend.push({ date: dateStr, revenue: daySum });
	}

	// User growth (last 7 days) computed in memory
	const userGrowth = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const dateStr = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
		const nextD = new Date(d);
		nextD.setDate(nextD.getDate() + 1);

		const count = last7DaysUsers.filter((u) => {
			const t = new Date(u.createdAt);
			return t >= d && t < nextD;
		}).length;

		userGrowth.push({ date: dateStr, users: count });
	}

	const activity = [
		...recentUsers.map((u) => ({ type: "new_user", name: u.name, detail: u.email, at: u.createdAt })),
		...recentPayments.map((p) => ({ type: "payment", name: p.user.name, detail: `₹${p.amount}`, at: p.createdAt })),
		...recentSubscriptions.map((s) => ({ type: "subscription", name: s.user.name, detail: s.plan.name, at: s.createdAt })),
	].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);

	return {
		totalUsers,
		premiumUsers,
		activeSubscriptions,
		totalSubscriptions,
		totalStories,
		totalLessons,
		totalRevenue,
		monthlyRevenue,
		paymentsToday,
		totalPayments,
		revenueTrend,
		userGrowth,
		activity,
	};
};

const getAllUsers = async ({ page = 1, limit = 20, search = "" }) => {
	const skip = (page - 1) * limit;
	const where = search
		? {
				OR: [
					{ name: { contains: search, mode: "insensitive" } },
					{ email: { contains: search, mode: "insensitive" } },
				],
		  }
		: {};

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where,
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				name: true,
				email: true,
				provider: true,
				isVerified: true,
				createdAt: true,
				profileImage: true,
				subscriptions: {
					where: { status: "ACTIVE", endDate: { gt: new Date() } },
					take: 1,
					include: { plan: { select: { name: true } } },
				},
			},
		}),
		prisma.user.count({ where }),
	]);

	return { users, total, page, limit };
};

const getAllSubscriptions = async ({ page = 1, limit = 20, status = "" }) => {
	await autoExpireSubscriptions();
	const skip = (page - 1) * limit;
	const where = status ? { status } : {};

	const [subscriptions, total] = await Promise.all([
		prisma.userSubscription.findMany({
			where,
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
			include: {
				user: { select: { name: true, email: true } },
				plan: { select: { name: true, price: true } },
				payments: { select: { id: true, razorpayOrderId: true, razorpayPaymentId: true, amount: true, status: true } },
			},
		}),
		prisma.userSubscription.count({ where }),
	]);

	return { subscriptions, total, page, limit };
};

const getAllPayments = async ({ page = 1, limit = 20, status = "" }) => {
	const skip = (page - 1) * limit;
	const where = status ? { status } : {};

	const [payments, total] = await Promise.all([
		prisma.payment.findMany({
			where,
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
			include: {
				user: { select: { name: true, email: true } },
				subscription: { include: { plan: { select: { name: true } } } },
			},
		}),
		prisma.payment.count({ where }),
	]);

	return { payments, total, page, limit };
};

const updateSubscriptionStatus = async (id, status) => {
	return prisma.userSubscription.update({ where: { id }, data: { status } });
};

const grantPremium = async (userId, durationDays = 30) => {
	// Find the first active subscription plan
	const plan = await prisma.subscriptionPlan.findFirst({
		where: { isActive: true },
		orderBy: { price: "asc" },
	});

	if (!plan) {
		const err = new Error("No active subscription plan found");
		err.status = 404;
		throw err;
	}

	// Cancel any existing active subscriptions for this user
	await prisma.userSubscription.updateMany({
		where: { userId, status: "ACTIVE" },
		data: { status: "CANCELLED" },
	});

	const startDate = new Date();
	const endDate = new Date(startDate);
	endDate.setDate(endDate.getDate() + durationDays);

	const subscription = await prisma.userSubscription.create({
		data: {
			userId,
			planId: plan.id,
			status: "ACTIVE",
			startDate,
			endDate,
		},
		include: { plan: { select: { name: true } } },
	});

	return subscription;
};

module.exports = { getStats, getAllUsers, getAllSubscriptions, getAllPayments, updateSubscriptionStatus, grantPremium };
