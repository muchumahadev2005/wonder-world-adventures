const catchAsync = require("../../../utils/catchAsync");
const service = require("../services/levels.service");

const getLessonsByLevel = catchAsync(async (req, res) => {
	const result = await service.getLessonsByLevel(req.params.id, req.query);
	res.json({ success: true, ...result });
});

module.exports = {
	getLessonsByLevel,
};
