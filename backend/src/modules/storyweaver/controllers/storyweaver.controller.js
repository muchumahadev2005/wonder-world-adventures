const catchAsync = require("../../../utils/catchAsync");
const service    = require("../services/storyweaver.service");

// GET /api/storyweaver/stories
const listStories = catchAsync(async (req, res) => {
	const { page, limit, language, level, query, category, source, audioOnly } = req.query;
	const result = await service.listStories({
		page:      page      ? Number(page)    : undefined,
		limit:     limit     ? Number(limit)   : undefined,
		language:  language  || undefined,
		level:     level     ? Number(level)   : undefined,
		query:     query     || undefined,
		category:  category  || undefined,
		source:    source    || undefined,
		audioOnly: audioOnly !== undefined ? Boolean(audioOnly) : undefined,
	});
	res.json({ success: true, ...result });
});

// GET /api/storyweaver/stories/db
const listDbStories = catchAsync(async (req, res) => {
	const { page, limit, language, level, query } = req.query;
	const result = await service.listDbAudioStories({
		page:     page     ? Number(page)  : undefined,
		limit:    limit    ? Number(limit) : undefined,
		language: language || undefined,
		level:    level    ? Number(level) : undefined,
		query:    query    || undefined,
	});
	res.json({ success: true, ...result });
});

// GET /api/storyweaver/stories/stats
const getDbStats = catchAsync(async (req, res) => {
	const stats = await service.getDbAudioStats();
	res.json({ success: true, stats });
});

// POST /api/storyweaver/stories/sync
const triggerSync = catchAsync(async (req, res) => {
	const { limit, language, level, storyType } = req.body || {};
	const result = await service.syncStories({
		limit:     limit     ? Number(limit)  : 50,
		language:  language  || undefined,
		level:     level     ? Number(level)  : undefined,
		storyType: storyType || undefined,   // omit for ALL story types
	});
	res.json({ success: true, result });
});

// GET /api/storyweaver/stories/:id
const getStory = catchAsync(async (req, res) => {
	const story = await service.getStory(req.params.id);
	res.json({ success: true, story });
});

// POST /api/storyweaver/stories/:id/generate-audio
const generateAudio = catchAsync(async (req, res) => {
	const story = await service.ensurePageAudios(req.params.id);
	res.json({ success: true, story });
});

module.exports = {
	listStories,
	listDbStories,
	getDbStats,
	triggerSync,
	getStory,
	generateAudio,
};
