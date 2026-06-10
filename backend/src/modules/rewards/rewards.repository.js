const prisma = require("../../prisma/prismaClient");

const getChildProfileByUserId = (userId) => {
	return prisma.childProfile.findUnique({ where: { userId } });
};

const getWallet = (childProfileId) => {
	return prisma.rewardWallet.upsert({
		where: { childProfileId },
		update: {},
		create: { childProfileId },
	});
};

const listBadges = (childProfileId) => {
	return prisma.childBadge.findMany({
		where: { childProfileId },
		include: { badge: true },
		orderBy: { earnedAt: "desc" },
	});
};

const listTransactions = (childProfileId) => {
	return prisma.rewardTransaction.findMany({
		where: { childProfileId },
		orderBy: { createdAt: "desc" },
		take: 50,
	});
};

const claimReward = async ({ childProfileId, stars, coins, xp, badgeCode, badgeName, reason, sourceType, sourceId }) => {
	return prisma.$transaction(async (tx) => {
		const current = await tx.rewardWallet.upsert({
			where: { childProfileId },
			update: {
				stars: { increment: stars },
				coins: { increment: coins },
				xp: { increment: xp },
			},
			create: { childProfileId, stars, coins, xp },
		});

		const level = Math.floor(current.xp / 100) + 1;
		const wallet = await tx.rewardWallet.update({
			where: { childProfileId },
			data: { level },
		});

		const transactions = [];
		if (stars > 0) {
			transactions.push(tx.rewardTransaction.create({
				data: { childProfileId, type: "STARS", amount: stars, reason, sourceType, sourceId },
			}));
		}
		if (coins > 0) {
			transactions.push(tx.rewardTransaction.create({
				data: { childProfileId, type: "COINS", amount: coins, reason, sourceType, sourceId },
			}));
		}

		let childBadge = null;
		if (badgeCode) {
			const badge = await tx.badge.upsert({
				where: { code: badgeCode },
				update: { name: badgeName || badgeCode },
				create: { code: badgeCode, name: badgeName || badgeCode },
			});
			childBadge = await tx.childBadge.upsert({
				where: { childProfileId_badgeId: { childProfileId, badgeId: badge.id } },
				update: {},
				create: { childProfileId, badgeId: badge.id },
				include: { badge: true },
			});
			transactions.push(tx.rewardTransaction.create({
				data: { childProfileId, type: "BADGE", amount: 1, reason, sourceType, sourceId },
			}));
		}

		await Promise.all(transactions);
		return { wallet, badge: childBadge };
	});
};

module.exports = {
	getChildProfileByUserId,
	getWallet,
	listBadges,
	listTransactions,
	claimReward,
};
