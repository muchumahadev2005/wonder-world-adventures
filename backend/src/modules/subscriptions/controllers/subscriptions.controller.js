const catchAsync = require("../../../utils/catchAsync");
const service = require("../services/subscriptions.service");

const listPlans = catchAsync(async (req, res) => {
	const plans = await service.listPlans();
	res.json({ success: true, plans });
});

const getCurrent = catchAsync(async (req, res) => {
	const subscription = await service.getCurrent(req.user.id);
	res.json({ success: true, subscription });
});

const getStatus = catchAsync(async (req, res) => {
	const status = await service.getStatus(req.user.id);
	res.json({ success: true, ...status });
});

const subscribe = catchAsync(async (req, res) => {
	const subscription = await service.subscribe(req.user.id, req.body.planId);
	res.json({ success: true, subscription });
});

const cancel = catchAsync(async (req, res) => {
	const status = await service.cancel(req.user.id);
	res.json({ success: true, ...status });
});

module.exports = {
	listPlans,
	getCurrent,
	getStatus,
	subscribe,
	cancel,
};
