const catchAsync = require("../../utils/catchAsync");
const service = require("./admin.lessons.service");

// ── Lesson CRUD ──────────────────────────────────────────────────

const listLessons = catchAsync(async (req, res) => {
	const { page, limit, search, language, level, status, premium } = req.query;
	const data = await service.listLessons({
		page: parseInt(page) || 1,
		limit: parseInt(limit) || 20,
		search,
		language,
		level,
		status,
		premium,
	});
	res.json({ success: true, ...data });
});

const getLesson = catchAsync(async (req, res) => {
	const lesson = await service.getLesson(req.params.id);
	res.json({ success: true, lesson });
});

const createLesson = catchAsync(async (req, res) => {
	const lesson = await service.createLesson(req.body, req.user?.id);
	res.status(201).json({ success: true, lesson });
});

const updateLesson = catchAsync(async (req, res) => {
	const lesson = await service.updateLesson(req.params.id, req.body, req.user?.id);
	res.json({ success: true, lesson });
});

const deleteLesson = catchAsync(async (req, res) => {
	const result = await service.deleteLesson(req.params.id);
	res.json({ success: true, ...result });
});

const duplicateLesson = catchAsync(async (req, res) => {
	const lesson = await service.duplicateLesson(req.params.id);
	res.status(201).json({ success: true, lesson });
});

const archiveLesson = catchAsync(async (req, res) => {
	const lesson = await service.archiveLesson(req.params.id);
	res.json({ success: true, lesson });
});

const restoreLesson = catchAsync(async (req, res) => {
	const lesson = await service.restoreLesson(req.params.id);
	res.json({ success: true, lesson });
});

const publishLesson = catchAsync(async (req, res) => {
	const lesson = await service.publishLesson(req.params.id);
	res.json({ success: true, lesson });
});

// ── Cards ────────────────────────────────────────────────────────

const addCard = catchAsync(async (req, res) => {
	const card = await service.addCard(req.params.id, req.body);
	res.status(201).json({ success: true, card });
});

const updateCard = catchAsync(async (req, res) => {
	const card = await service.updateCard(req.params.id, req.params.cardId, req.body);
	res.json({ success: true, card });
});

const deleteCard = catchAsync(async (req, res) => {
	const result = await service.deleteCard(req.params.id, req.params.cardId);
	res.json({ success: true, ...result });
});

const reorderCards = catchAsync(async (req, res) => {
	const result = await service.reorderCards(req.params.id, req.body.items);
	res.json({ success: true, ...result });
});

// ── Quiz ─────────────────────────────────────────────────────────

const addQuizQuestion = catchAsync(async (req, res) => {
	const question = await service.addQuizQuestion(req.params.id, req.body);
	res.status(201).json({ success: true, question });
});

const updateQuizQuestion = catchAsync(async (req, res) => {
	const question = await service.updateQuizQuestion(req.params.id, req.params.qId, req.body);
	res.json({ success: true, question });
});

const deleteQuizQuestion = catchAsync(async (req, res) => {
	const result = await service.deleteQuizQuestion(req.params.id, req.params.qId);
	res.json({ success: true, ...result });
});

// ── Import / Export ──────────────────────────────────────────────

const importJson = catchAsync(async (req, res) => {
	const results = await service.importFromJson(req.body, req.user?.id);
	res.json({ success: true, ...results });
});

const importExcel = catchAsync(async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ success: false, message: "No file uploaded" });
	}
	const results = await service.importFromExcel(req.file.buffer, req.user?.id);
	res.json({ success: true, ...results });
});

const exportJson = catchAsync(async (req, res) => {
	const { language, level, lessonId } = req.query;
	const data = await service.exportToJson({ language, level, lessonId });
	res.json({ success: true, ...data });
});

const exportExcel = catchAsync(async (req, res) => {
	const { language, level, lessonId } = req.query;
	const buffer = await service.exportToExcel({ language, level, lessonId });
	res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
	res.setHeader("Content-Disposition", "attachment; filename=lessons-export.xlsx");
	res.send(Buffer.from(buffer));
});

const downloadTemplate = catchAsync(async (req, res) => {
	const buffer = service.generateExcelTemplate();
	res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
	res.setHeader("Content-Disposition", "attachment; filename=lesson-template.xlsx");
	res.send(Buffer.from(buffer));
});

// ── Versioning ───────────────────────────────────────────────────

const listVersions = catchAsync(async (req, res) => {
	const versions = await service.listVersions(req.params.id);
	res.json({ success: true, versions });
});

const getVersion = catchAsync(async (req, res) => {
	const version = await service.getVersion(req.params.id, req.params.ver);
	res.json({ success: true, version });
});

const restoreVersion = catchAsync(async (req, res) => {
	const lesson = await service.restoreVersion(req.params.id, req.params.ver, req.user?.id);
	res.json({ success: true, lesson });
});

// ── Analytics ────────────────────────────────────────────────────

const getAnalytics = catchAsync(async (req, res) => {
	const analytics = await service.getContentAnalytics();
	res.json({ success: true, ...analytics });
});

// ── Import History ───────────────────────────────────────────────

const getImportHistory = catchAsync(async (req, res) => {
	const { page, limit } = req.query;
	const data = await service.getImportHistory({ page: parseInt(page) || 1, limit: parseInt(limit) || 20 });
	res.json({ success: true, ...data });
});

module.exports = {
	listLessons,
	getLesson,
	createLesson,
	updateLesson,
	deleteLesson,
	duplicateLesson,
	archiveLesson,
	restoreLesson,
	publishLesson,
	addCard,
	updateCard,
	deleteCard,
	reorderCards,
	addQuizQuestion,
	updateQuizQuestion,
	deleteQuizQuestion,
	importJson,
	importExcel,
	exportJson,
	exportExcel,
	downloadTemplate,
	listVersions,
	getVersion,
	restoreVersion,
	getAnalytics,
	getImportHistory,
};
