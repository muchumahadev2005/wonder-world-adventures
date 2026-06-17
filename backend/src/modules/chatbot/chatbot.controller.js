const catchAsync = require("../../utils/catchAsync");
const ragService = require("../rag/rag.service");

const sendMessage = catchAsync(async (req, res) => {
	const { message, sessionId } = req.body;
	const userId = req.user?.id; // If authenticated

	const result = await ragService.processQuestion({ message, sessionId, userId });
	
	// Ensure we return the expected structure to the frontend
	res.json({ 
		success: true, 
		reply: result.reply,
		sources: result.sources || [],
		cached: result.cached || false
	});
});

module.exports = {
	sendMessage,
};
