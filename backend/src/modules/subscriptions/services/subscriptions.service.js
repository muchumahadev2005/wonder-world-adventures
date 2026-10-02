const repository = require("../repositories/subscriptions.repository");
const cache = require("../../../utils/cache");

const buildEndDate = (startDate, durationDays) => {
	const end = new Date(startDate);
	end.setDate(end.getDate() + durationDays);
	return end;
};

const listPlans = async () => {
	const { data, source } = await cache.cachedDedup("plans:list", () => repository.listPlans(), cache.TTL.PLANS);
	const result = Array.isArray(data) ? [...data] : data;
	result._cacheSource = source;
	return result;
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
	const subscription = await repository.createSubscription({ userId, planId, startDate, endDate });
	// Invalidate admin stats on new subscription
	cache.invalidate("admin").catch(() => {});
	return subscription;
};

const cancel = async (userId) => {
	await repository.cancelSubscription({ userId });
	cache.invalidate("admin").catch(() => {});
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
