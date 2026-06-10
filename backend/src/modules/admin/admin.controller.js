const catchAsync = require("../../utils/catchAsync");
const service = require("./admin.service");

const getStats = catchAsync(async (req, res) => {
	const stats = await service.getStats();
	res.json({ success: true, ...stats });
});

const getUsers = catchAsync(async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 20;
	const search = req.query.search || "";
	const data = await service.getAllUsers({ page, limit, search });
	res.json({ success: true, ...data });
});

const getSubscriptions = catchAsync(async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 20;
	const status = req.query.status || "";
	const data = await service.getAllSubscriptions({ page, limit, status });
	res.json({ success: true, ...data });
});

const getPayments = catchAsync(async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 20;
	const status = req.query.status || "";
	const data = await service.getAllPayments({ page, limit, status });
	res.json({ success: true, ...data });
});

const updateSubscription = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { status } = req.body;
	const subscription = await service.updateSubscriptionStatus(id, status);
	res.json({ success: true, subscription });
});

module.exports = { getStats, getUsers, getSubscriptions, getPayments, updateSubscription };
