const catchAsync = require("../../../utils/catchAsync");
const service = require("../services/games.service");

const listGames = catchAsync(async (req, res) => {
	const games = await service.listGames(req.user?.id);
	res.json({ success: true, games });
});

const getGame = catchAsync(async (req, res) => {
	const game = await service.getGame(req.params.id, req.user?.id);
	res.json({ success: true, game });
});

const updateProgress = catchAsync(async (req, res) => {
	const progress = await service.updateProgress(req.user.id, req.body);
	res.status(201).json({ success: true, progress });
});

const listProgress = catchAsync(async (req, res) => {
	const progress = await service.listProgress(req.user.id);
	res.json({ success: true, progress });
});

module.exports = {
	listGames,
	getGame,
	updateProgress,
	listProgress,
};
