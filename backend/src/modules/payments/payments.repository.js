const prisma = require("../../prisma/prismaClient");

const createPayment = ({ userId, amount, razorpayOrderId, status = "PENDING" }) => {
	return prisma.payment.create({
		data: { userId, amount, razorpayOrderId, status },
	});
};

const updatePayment = ({ razorpayOrderId, razorpayPaymentId, status, subscriptionId }) => {
	return prisma.payment.updateMany({
		where: { razorpayOrderId },
		data: { razorpayPaymentId, status, subscriptionId },
	});
};

const getPaymentsByUserId = (userId) => {
	return prisma.payment.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		include: { subscription: { include: { plan: true } } },
	});
};

const getPaymentByOrderId = (razorpayOrderId) => {
	return prisma.payment.findFirst({ where: { razorpayOrderId } });
};

const createSubscription = ({ userId, planId, startDate, endDate }) => {
	return prisma.userSubscription.create({
		data: { userId, planId, status: "ACTIVE", startDate, endDate },
		include: { plan: true },
	});
};

const cancelOldSubscriptions = (userId) => {
	return prisma.userSubscription.updateMany({
		where: { userId, status: "ACTIVE" },
		data: { status: "CANCELLED" },
	});
};

const getPlanById = (planId) => {
	return prisma.subscriptionPlan.findUnique({ where: { id: planId } });
};

module.exports = {
	createPayment,
	updatePayment,
	getPaymentsByUserId,
	getPaymentByOrderId,
	createSubscription,
	cancelOldSubscriptions,
	getPlanById,
};
