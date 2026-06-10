const catchAsync = require("../../utils/catchAsync");
const service = require("./payments.service");

const createOrder = catchAsync(async (req, res) => {
	const { planId } = req.body;
	const result = await service.createOrder(req.user.id, planId);
	res.json({ success: true, ...result });
});

const verifyPayment = catchAsync(async (req, res) => {
	const result = await service.verifyPayment(req.user.id, req.body);
	res.json({ success: true, ...result });
});

const getHistory = catchAsync(async (req, res) => {
	const payments = await service.getHistory(req.user.id);
	res.json({ success: true, payments });
});

module.exports = { createOrder, verifyPayment, getHistory };
