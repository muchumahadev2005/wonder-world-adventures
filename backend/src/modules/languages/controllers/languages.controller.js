const catchAsync = require("../../../utils/catchAsync");
const service = require("../services/languages.service");

const listLanguages = catchAsync(async (req, res) => {
	const languages = await service.listLanguages();
	if (req.setCacheSource) req.setCacheSource(languages._cacheSource);
	res.json({ success: true, languages });
});

const getLevelsForLanguage = catchAsync(async (req, res) => {
	const result = await service.getLevelsForLanguage(req.params.id);
	if (req.setCacheSource) req.setCacheSource(result._cacheSource);
	res.json({ success: true, ...result });
});

module.exports = {
	listLanguages,
	getLevelsForLanguage,
};
