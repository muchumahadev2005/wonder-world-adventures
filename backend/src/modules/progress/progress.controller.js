const catchAsync = require("../../utils/catchAsync");
const service = require("./progress.service");

const getProgress = catchAsync(async (req, res) => {
	const progress = await service.listProgress(req.user.id);
	res.json({ success: true, progress });
});

const updateProgress = catchAsync(async (req, res) => {
	const progress = await service.updateProgress(req.user.id, req.body);
	res.status(201).json({ success: true, progress });
});

module.exports = {
	getProgress,
	updateProgress,
};
