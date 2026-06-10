const prisma = require("../../prisma/prismaClient");

const getStats = async () => {
	const [
		totalUsers,
		totalStories,
		totalLessons,
		totalSubscriptions,
		activeSubscriptions,
		totalPayments,
		successPayments,
	] = await Promise.all([
		prisma.user.count(),
		prisma.story.count(),
		prisma.lesson.count(),
		prisma.userSubscription.count(),
		prisma.userSubscription.count({ where: { status: "ACTIVE", endDate: { gt: new Date() } } }),
		prisma.payment.count(),
		prisma.payment.findMany({ where: { status: "SUCCESS" }, select: { amount: true } }),
	]);

	const totalRevenue = successPayments.reduce((sum, p) => sum + p.amount, 0);

	// Payments today
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const paymentsToday = await prisma.payment.count({
		where: { status: "SUCCESS", createdAt: { gte: today } },
	});

	// Premium users (active subscription)
	const premiumUsers = activeSubscriptions;

	// Monthly revenue (last 30 days)
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	const monthlyPayments = await prisma.payment.findMany({
		where: { status: "SUCCESS", createdAt: { gte: thirtyDaysAgo } },
		select: { amount: true },
	});
	const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

	// Revenue trend (last 7 days)
	const revenueTrend = [];
	for (let i = 6; i >= 0; i--) {
		const dayStart = new Date();
		dayStart.setDate(dayStart.getDate() - i);
		dayStart.setHours(0, 0, 0, 0);
		const dayEnd = new Date(dayStart);
		dayEnd.setHours(23, 59, 59, 999);
		const dayPayments = await prisma.payment.findMany({
			where: { status: "SUCCESS", createdAt: { gte: dayStart, lte: dayEnd } },
			select: { amount: true },
		});
		const revenue = dayPayments.reduce((sum, p) => sum + p.amount, 0);
		revenueTrend.push({
			date: dayStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
			revenue,
		});
	}

	// User growth (last 7 days)
	const userGrowth = [];
	for (let i = 6; i >= 0; i--) {
		const dayStart = new Date();
		dayStart.setDate(dayStart.getDate() - i);
		dayStart.setHours(0, 0, 0, 0);
		const dayEnd = new Date(dayStart);
		dayEnd.setHours(23, 59, 59, 999);
		const count = await prisma.user.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } });
		userGrowth.push({
			date: dayStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
			users: count,
		});
	}

	// Recent activity
	const recentUsers = await prisma.user.findMany({
		orderBy: { createdAt: "desc" },
		take: 3,
		select: { name: true, email: true, createdAt: true },
	});
	const recentPayments = await prisma.payment.findMany({
		where: { status: "SUCCESS" },
		orderBy: { createdAt: "desc" },
		take: 3,
		include: { user: { select: { name: true } } },
	});
	const recentSubscriptions = await prisma.userSubscription.findMany({
		orderBy: { createdAt: "desc" },
		take: 3,
		include: { user: { select: { name: true } }, plan: { select: { name: true } } },
	});

	const activity = [
		...recentUsers.map(u => ({ type: "new_user", name: u.name, detail: u.email, at: u.createdAt })),
		...recentPayments.map(p => ({ type: "payment", name: p.user.name, detail: `₹${p.amount}`, at: p.createdAt })),
		...recentSubscriptions.map(s => ({ type: "subscription", name: s.user.name, detail: s.plan.name, at: s.createdAt })),
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

module.exports = { getStats, getAllUsers, getAllSubscriptions, getAllPayments, updateSubscriptionStatus };
