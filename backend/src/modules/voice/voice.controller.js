const catchAsync = require("../../utils/catchAsync");
const service = require("./voice.service");

const prompt = catchAsync(async (req, res) => {
	res.json({ success: true, voice: service.createPrompt(req.body?.word || req.query?.word) });
});

module.exports = {
	prompt,
};
