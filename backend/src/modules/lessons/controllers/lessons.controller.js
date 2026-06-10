const catchAsync = require("../../../utils/catchAsync");
const service = require("../services/lessons.service");

const listLessons = catchAsync(async (req, res) => {
	const lessons = await service.listLessons(req.query);
	res.json({ success: true, lessons });
});

const getLessonsByLevel = catchAsync(async (req, res) => {
	const lessons = await service.getLessonsByLevel(req.params.id, req.query);
	res.json({ success: true, lessons });
});

const getLesson = catchAsync(async (req, res) => {
	const lesson = await service.getLesson(req.params.id);
	res.json({ success: true, lesson });
});

const getLessonCards = catchAsync(async (req, res) => {
	const result = await service.getLessonCards(req.params.id);
	res.json({ success: true, ...result });
});

const getLessonQuiz = catchAsync(async (req, res) => {
	const result = await service.getLessonQuiz(req.params.id);
	res.json({ success: true, ...result });
});

module.exports = {
	listLessons,
	getLessonsByLevel,
	getLesson,
	getLessonCards,
	getLessonQuiz,
};
