const prisma = require("../../../prisma/prismaClient");

const getChildProfileByUserId = (userId) => {
	return prisma.childProfile.findUnique({ where: { userId } });
};

const getDashboard = async (childProfileId) => {
	const [
		wallet,
		storyCount,
		lessonCount,
		gameCount,
		quizAttempts,
		progress,
		badges,
		rewardTransactions,
	] = await Promise.all([
		prisma.rewardWallet.findUnique({ where: { childProfileId } }),
		prisma.storyProgress.count({ where: { childProfileId, isCompleted: true } }),
		prisma.lessonProgress.count({ where: { childProfileId, isCompleted: true } }),
		prisma.gameProgress.count({ where: { childProfileId, isCompleted: true } }),
		prisma.quizAttempt.findMany({
			where: { childProfileId },
			orderBy: { createdAt: "desc" },
			take: 10,
			include: { quiz: true },
		}),
		prisma.progressRecord.findMany({
			where: { childProfileId },
			orderBy: { updatedAt: "desc" },
			take: 20,
		}),
		prisma.childBadge.findMany({
			where: { childProfileId },
			include: { badge: true },
			orderBy: { earnedAt: "desc" },
		}),
		prisma.rewardTransaction.findMany({
			where: { childProfileId },
			orderBy: { createdAt: "desc" },
			take: 20,
		}),
	]);

	return {
		wallet,
		counts: {
			storiesCompleted: storyCount,
			lessonsCompleted: lessonCount,
			gamesCompleted: gameCount,
			quizAttempts: quizAttempts.length,
			badgesEarned: badges.length,
		},
		quizAttempts,
		progress,
		badges,
		rewardTransactions,
	};
};

module.exports = {
	getChildProfileByUserId,
	getDashboard,
};
