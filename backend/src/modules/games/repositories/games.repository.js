const prisma = require("../../../prisma/prismaClient");

const gameInclude = {
	language: true,
	level: true,
};

const listGames = () => {
	return prisma.game.findMany({
		where: { isActive: true },
		include: gameInclude,
		orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
	});
};

const findByIdOrSlug = (id) => {
	return prisma.game.findFirst({
		where: { OR: [{ id }, { slug: id }] },
		include: gameInclude,
	});
};

const getChildProfileByUserId = (userId) => {
	return prisma.childProfile.findUnique({ where: { userId } });
};

const findProgress = ({ childProfileId, gameId }) => {
	return prisma.gameProgress.findUnique({
		where: { childProfileId_gameId: { childProfileId, gameId } },
	});
};

const upsertProgress = ({ childProfileId, gameId, score, highScore, isCompleted }) => {
	return prisma.gameProgress.upsert({
		where: { childProfileId_gameId: { childProfileId, gameId } },
		update: {
			score,
			highScore,
			attempts: { increment: 1 },
			isCompleted,
			lastPlayedAt: new Date(),
		},
		create: {
			childProfileId,
			gameId,
			score,
			highScore: score,
			attempts: 1,
			isCompleted,
			lastPlayedAt: new Date(),
		},
		include: { game: true },
	});
};

const listProgress = (childProfileId) => {
	return prisma.gameProgress.findMany({
		where: { childProfileId },
		include: { game: true },
		orderBy: { updatedAt: "desc" },
	});
};

module.exports = {
	listGames,
	findByIdOrSlug,
	getChildProfileByUserId,
	findProgress,
	upsertProgress,
	listProgress,
};
