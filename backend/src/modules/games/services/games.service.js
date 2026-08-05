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

// ─── Gamezop Integration ──────────────────────────────────────────────────────
const GAMEZOP_API_URL = "https://pub.gamezop.com/v3/games?id=3443";

const fetchGamezopGames = () =>
	new Promise((resolve, reject) => {
		const https = require("https");
		https
			.get(GAMEZOP_API_URL, (res) => {
				let raw = "";
				res.on("data", (chunk) => {
					raw += chunk;
				});
				res.on("end", () => {
					try {
						resolve(JSON.parse(raw));
					} catch (e) {
						reject(new Error("Failed to parse Gamezop response"));
					}
				});
			})
			.on("error", reject);
	});

const getGamezopGames = async () => {
	const data = await fetchGamezopGames();
	// Gamezop v3 returns { games: [...] }
	// categories: { "en": ["Puzzle & Logic"] }  ← object with locale keys, NOT array of objects
	// tags:       { "en": ["Puzzle", "IQ", ...] } ← same shape
	const games = Array.isArray(data?.games) ? data.games : [];
	return games.map((g) => {
		const categoryNames = Array.isArray(g.categories?.en) ? g.categories.en : [];
		const tagNames = Array.isArray(g.tags?.en) ? g.tags.en : [];
		const allTags = [...new Set([...categoryNames, ...tagNames])].filter(Boolean);
		const primaryCategory = categoryNames[0] || "";

		const rawName = g.name?.en || (typeof g.name === "string" ? g.name : "");
		const rawDesc = g.description?.en || (typeof g.description === "string" ? g.description : "");

		return {
			code: g.code || "",
			name: String(rawName),
			description: String(rawDesc),
			thumbnail: g.assets?.cover || g.assets?.thumb || g.thumbnailUrl || "",
			category: String(primaryCategory),
			categories: allTags.map((t) => String(t)),
			rating: typeof g.rating === "number" ? g.rating : null,
			playCount: typeof g.gamePlays === "number" ? g.gamePlays : null,
			url: g.url || "",
		};
	});
};
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
	listGames,
	getGame,
	updateProgress,
	listProgress,
	getGamezopGames,
};
