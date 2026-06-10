const catchAsync = require("../../utils/catchAsync");
const service = require("./rewards.service");

const getRewards = catchAsync(async (req, res) => {
	const rewards = await service.getRewards(req.user.id);
	res.json({ success: true, rewards });
});

const claimReward = catchAsync(async (req, res) => {
	const result = await service.claimReward(req.user.id, req.body);
	res.status(201).json({ success: true, ...result });
});

module.exports = {
	getRewards,
	claimReward,
};
