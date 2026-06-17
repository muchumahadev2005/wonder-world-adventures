const repository = require("../repositories/games.repository");
const subscriptionsService = require("../../subscriptions/services/subscriptions.service");
const { indexContentAsync, deleteEmbeddings } = require("../../rag/embedding.service");


const normalizeGame = (game, canAccessPremium = false) => ({
	id: game.slug || game.id,
	gameId: game.id,
	slug: game.slug,
	title: game.title,
	name: game.title,
	description: game.description,
	category: game.category,
	icon: game.icon,
	color: game.color,
	starsReward: game.starsReward,
	stars: game.starsReward,
	isPremium: game.isPremium,
	premium: game.isPremium,
	locked: game.isPremium && !canAccessPremium,
	language: game.language
		? {
			id: game.language.id,
			code: game.language.code,
			name: game.language.name,
		}
		: null,
	level: game.level
		? {
			id: game.level.id,
			code: game.level.code,
			name: game.level.name,
		}
		: null,
});

const normalizeProgress = (progress) => ({
	id: progress.id,
	gameId: progress.game.slug || progress.gameId,
	gameRecordId: progress.gameId,
	score: progress.score,
	highScore: progress.highScore,
	attempts: progress.attempts,
	isCompleted: progress.isCompleted,
	lastPlayedAt: progress.lastPlayedAt,
	game: normalizeGame(progress.game, true),
});

const getChildProfile = async (userId) => {
	const profile = await repository.getChildProfileByUserId(userId);
	if (!profile) {
		const error = new Error("Child profile not found");
		error.status = 404;
		throw error;
	}
	return profile;
};

const listGames = async (userId) => {
	const canAccessPremium = userId ? await subscriptionsService.canAccessPremium(userId) : false;
	const games = await repository.listGames();
	return games.map((game) => normalizeGame(game, canAccessPremium));
};

const getGame = async (id, userId) => {
	const game = await repository.findByIdOrSlug(id);
	if (!game || !game.isActive) {
		const error = new Error("Game not found");
		error.status = 404;
		throw error;
	}
	const canAccessPremium = userId ? await subscriptionsService.canAccessPremium(userId) : false;
	return normalizeGame(game, canAccessPremium);
};

const updateProgress = async (userId, body) => {
	const childProfile = await getChildProfile(userId);
	const game = await repository.findByIdOrSlug(body.gameId);
	if (!game || !game.isActive) {
		const error = new Error("Game not found");
		error.status = 404;
		throw error;
	}
	const existing = await repository.findProgress({ childProfileId: childProfile.id, gameId: game.id });
	const highScore = Math.max(existing?.highScore || 0, body.score);
	const progress = await repository.upsertProgress({
		childProfileId: childProfile.id,
		gameId: game.id,
		score: body.score,
		highScore,
		isCompleted: body.isCompleted ?? true,
	});
	return normalizeProgress(progress);
};

const listProgress = async (userId) => {
	const childProfile = await getChildProfile(userId);
	const progress = await repository.listProgress(childProfile.id);
	return progress.map(normalizeProgress);
};

module.exports = {
	listGames,
	getGame,
	updateProgress,
	listProgress,
};
