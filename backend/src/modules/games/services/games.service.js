const repository = require("../repositories/games.repository");
const subscriptionsService = require("../../subscriptions/services/subscriptions.service");
const { indexContentAsync, deleteEmbeddings } = require("../../rag/embedding.service");
const cache = require("../../../utils/cache");

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
	const { data: rawGames, source } = await cache.cachedDedup(
		"games:raw_list",
		() => repository.listGames(),
		cache.TTL.GAMES_LIST
	);
	const games = (rawGames || []).map((game) => normalizeGame(game, canAccessPremium));
	games._cacheSource = source;
	return games;
};

const getGame = async (id, userId) => {
	const key = `games:raw:${id.toLowerCase().trim()}`;
	const { data: game, source } = await cache.cachedDedup(
		key,
		async () => {
			const found = await repository.findByIdOrSlug(id);
			if (!found || !found.isActive) {
				const error = new Error("Game not found");
				error.status = 404;
				throw error;
			}
			return found;
		},
		cache.TTL.GAMES_LIST
	);

	const canAccessPremium = userId ? await subscriptionsService.canAccessPremium(userId) : false;
	const normalized = normalizeGame(game, canAccessPremium);
	normalized._cacheSource = source;
	return normalized;
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
const logger = require("../../../utils/logger");

const fetchGamezopGames = () =>
	new Promise((resolve, reject) => {
		const https = require("https");
		const req = https.get(GAMEZOP_API_URL, { timeout: 10_000 }, (res) => {
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
		});

		req.on("timeout", () => {
			req.destroy();
			reject(new Error("Gamezop API request timed out"));
		});

		req.on("error", reject);
	});

const _fetchAndNormalizeGamezop = async () => {
	const data = await fetchGamezopGames();
	const games = Array.isArray(data?.games) ? data.games : [];
	return games.map((g) => {
		const categoryNames = Array.isArray(g.categories?.en) ? g.categories.en : [];
		const tagNames = Array.isArray(g.tags?.en) ? g.tags.en : [];
		const allTags = [...new Set([...categoryNames, ...tagNames])].filter(Boolean);
		const primaryCategory = categoryNames[0] || "";

		const rawName = g.name?.en || (typeof g.name === "string" ? g.name : "");
		const rawDesc = g.description?.en || (typeof g.description === "string" ? g.description : "");

		const isPremium = Boolean(g.isPremium || (g.rating && g.rating >= 4.35) || (g.code && g.code.charCodeAt(0) % 3 === 0));

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
			isPremium,
		};
	});
};

const getGamezopGames = async () => {
	try {
		const { data, source } = await cache.cachedDedup(
			"games:gamezop",
			async () => {
				const games = await _fetchAndNormalizeGamezop();
				if (!games || games.length === 0) {
					throw new Error("Gamezop returned no games");
				}
				return games;
			},
			cache.TTL.GAMES_LIST
		);
		const result = Array.isArray(data) ? [...data] : data;
		result._cacheSource = source;
		return result;
	} catch (err) {
		logger.warn("[games] Gamezop fetch failed, returning graceful fallback", { error: err.message });
		const fallback = [];
		fallback._cacheSource = "fallback";
		return fallback;
	}
};
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
	listGames,
	getGame,
	updateProgress,
	listProgress,
	getGamezopGames,
};
