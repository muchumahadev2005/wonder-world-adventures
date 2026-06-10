const catchAsync = require("../../../utils/catchAsync");
const service = require("../services/quizzes.service");

const submitQuiz = catchAsync(async (req, res) => {
	const result = await service.submitQuiz(req.user.id, req.body);
	res.status(201).json({ success: true, result });
});

const getResult = catchAsync(async (req, res) => {
	const result = await service.getResult(req.params.id);
	res.json({ success: true, result });
});

module.exports = {
	submitQuiz,
	getResult,
};
