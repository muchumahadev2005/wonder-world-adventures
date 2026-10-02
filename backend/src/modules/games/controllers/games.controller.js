const catchAsync = require("../../../utils/catchAsync");
const service = require("../services/games.service");

const listGames = catchAsync(async (req, res) => {
	const games = await service.listGames(req.user?.id);
	if (req.setCacheSource) req.setCacheSource(games._cacheSource);
	res.json({ success: true, games });
});

const getGame = catchAsync(async (req, res) => {
	const game = await service.getGame(req.params.id, req.user?.id);
	if (req.setCacheSource) req.setCacheSource(game._cacheSource);
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

// ─── Gamezop ─────────────────────────────────────────────────────────────────
const listGamezopGames = catchAsync(async (req, res) => {
	const games = await service.getGamezopGames();
	if (req.setCacheSource) req.setCacheSource(games._cacheSource);
	res.json({ success: true, games });
});
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
	listGames,
	getGame,
	updateProgress,
	listProgress,
	listGamezopGames,
};
