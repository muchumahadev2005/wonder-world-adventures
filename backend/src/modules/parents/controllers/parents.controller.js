const catchAsync = require("../../../utils/catchAsync");
const service = require("../services/parents.service");

const getSummary = catchAsync(async (req, res) => {
	const dashboard = await service.getSummary(req.user.id);
	res.json({ success: true, dashboard });
});

module.exports = {
	getSummary,
};
