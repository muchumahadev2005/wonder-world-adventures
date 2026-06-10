const catchAsync = require("../../../utils/catchAsync");
const service = require("../services/stories.service");

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

module.exports = {
	listStories,
	getStory,
	listByCategory,
	recommended,
	createStory,
	updateStory,
	deleteStory,
};
