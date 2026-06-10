const catchAsync = require("../../utils/catchAsync");
const service = require("./chatbot.service");

const sendMessage = catchAsync(async (req, res) => {
	const reply = service.getReply(req.body?.message);
	res.json({ success: true, reply });
});

module.exports = {
	sendMessage,
};
