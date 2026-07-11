const catchAsync = require("../../../utils/catchAsync");
const service    = require("../services/stories.service");

// ── Story CRUD ────────────────────────────────────────────────────

const listStories = catchAsync(async (req, res) => {
	const stories = await service.listStories(req.query);
	res.json({ success: true, stories });
});

const getStory = catchAsync(async (req, res) => {
	const story = await service.getStory(req.params.id);
	res.json({ success: true, story });
});

const listByCategory = catchAsync(async (req, res) => {
	const stories = await service.listByCategory(req.params.category);
	res.json({ success: true, stories });
});

const recommended = catchAsync(async (req, res) => {
	const stories = await service.recommended();
	res.json({ success: true, stories });
});

const createStory = catchAsync(async (req, res) => {
	const story = await service.createStory(req.body);
	res.status(201).json({ success: true, story });
});

const updateStory = catchAsync(async (req, res) => {
	const story = await service.updateStory(req.params.id, req.body);
	res.json({ success: true, story });
});

const deleteStory = catchAsync(async (req, res) => {
	const result = await service.deleteStory(req.params.id);
	res.json({ success: true, ...result });
});

// ── Duplicate ─────────────────────────────────────────────────────

const duplicateStory = catchAsync(async (req, res) => {
	const story = await service.duplicateStory(req.params.id);
	res.status(201).json({ success: true, story });
});

// ── Excel Import ──────────────────────────────────────────────────

const importExcel = catchAsync(async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ success: false, message: "No file uploaded" });
	}
	const results = await service.importFromExcel(req.file.buffer, req.user?.id);
	res.json({ success: true, ...results });
});

// ── Excel Export ──────────────────────────────────────────────────

const exportExcel = catchAsync(async (req, res) => {
	const { category, language, isPremium, isPublished } = req.query;
	const buffer = await service.exportToExcel({
		category,
		language,
		isPremium:  isPremium === "true" ? true : isPremium === "false" ? false : undefined,
		isPublished:isPublished === "true" ? true : isPublished === "false" ? false : undefined,
	});
	res.setHeader("Content-Type",        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
	res.setHeader("Content-Disposition", "attachment; filename=stories-export.xlsx");
	res.send(Buffer.from(buffer));
});

// ── Template Download ─────────────────────────────────────────────

const downloadTemplate = catchAsync(async (req, res) => {
	const buffer = service.generateExcelTemplate();
	res.setHeader("Content-Type",        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
	res.setHeader("Content-Disposition", "attachment; filename=stories-template.xlsx");
	res.send(Buffer.from(buffer));
});

module.exports = {
	listStories,
	getStory,
	listByCategory,
	recommended,
	createStory,
	updateStory,
	deleteStory,
	duplicateStory,
	importExcel,
	exportExcel,
	downloadTemplate,
};
