const repository = require("../repositories/subscriptions.repository");

const buildEndDate = (startDate, durationDays) => {
	const end = new Date(startDate);
	end.setDate(end.getDate() + durationDays);
	return end;
};

const listPlans = async () => {
	return repository.listPlans();
};

const getCurrent = async (userId) => {
	return repository.getActiveSubscriptionByUserId(userId);
};

const getStatus = async (userId) => {
	const active = await repository.getActiveSubscriptionByUserId(userId);
	return {
		status: active ? "ACTIVE" : "INACTIVE",
		subscription: active || null,
	};
};

const subscribe = async (userId, planId) => {
	const plan = await repository.getPlanById(planId);
	if (!plan || !plan.isActive) {
		const error = new Error("Plan not available");
		error.status = 404;
		throw error;
	}

	const startDate = new Date();
	const endDate = buildEndDate(startDate, plan.durationDays);
	return repository.createSubscription({ userId, planId, startDate, endDate });
};

const cancel = async (userId) => {
	await repository.cancelSubscription({ userId });
	return { status: "CANCELLED" };
};

const canAccessPremium = async (userId) => {
	const active = await repository.getActiveSubscriptionByUserId(userId);
	return Boolean(active);
};

module.exports = {
	listPlans,
	getCurrent,
	getStatus,
	subscribe,
	cancel,
	canAccessPremium,
};
