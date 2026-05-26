const catchAsync = require("../../utils/catchAsync");
const service = require("./children.service");

const getMe = catchAsync(async (req, res) => {
	const profile = await service.getProfile(req.user.id);
	res.json({ success: true, profile });
});

const upsertMe = catchAsync(async (req, res) => {
	const profile = await service.upsertProfile(req.user.id, req.body);
	res.json({ success: true, profile });
});

module.exports = { getMe, upsertMe };
