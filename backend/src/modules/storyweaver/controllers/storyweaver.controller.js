const catchAsync = require("../../../utils/catchAsync");
const service    = require("../services/storyweaver.service");

// GET /api/storyweaver/stories
const listStories = catchAsync(async (req, res) => {
	const { page, limit, language, level, query, category } = req.query;
	const result = await service.listStories({
		page:     page    ? Number(page)    : undefined,
		limit:    limit   ? Number(limit)   : undefined,
		language: language || undefined,
		level:    level   ? Number(level)   : undefined,
		query:    query   || undefined,
		category: category || undefined,
	});
	res.json({ success: true, ...result });
});

// GET /api/storyweaver/stories/:id
const getStory = catchAsync(async (req, res) => {
	const story = await service.getStory(req.params.id);
	res.json({ success: true, story });
});

module.exports = { listStories, getStory };
