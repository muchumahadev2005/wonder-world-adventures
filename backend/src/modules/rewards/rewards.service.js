const repository = require("./rewards.repository");

const normalizeBadge = (childBadge) => ({
	id: childBadge.badge.id,
	code: childBadge.badge.code,
	name: childBadge.badge.name,
	description: childBadge.badge.description,
	imageUrl: childBadge.badge.imageUrl,
	earnedAt: childBadge.earnedAt,
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

const getRewards = async (userId) => {
	const childProfile = await getChildProfile(userId);
	const [wallet, badges, transactions] = await Promise.all([
		repository.getWallet(childProfile.id),
		repository.listBadges(childProfile.id),
		repository.listTransactions(childProfile.id),
	]);

	return {
		wallet,
		stars: wallet.stars,
		coins: wallet.coins,
		xp: wallet.xp,
		level: wallet.level,
		streak: wallet.streak,
		badges: badges.map(normalizeBadge),
		transactions,
	};
};

const claimReward = async (userId, body) => {
	const childProfile = await getChildProfile(userId);
	const result = await repository.claimReward({
		childProfileId: childProfile.id,
		stars: body.stars,
		coins: body.coins,
		xp: body.xp,
		badgeCode: body.badgeCode,
		badgeName: body.badgeName,
		reason: body.reason,
		sourceType: body.sourceType,
		sourceId: body.sourceId,
	});

	return {
		wallet: result.wallet,
		badge: result.badge ? normalizeBadge(result.badge) : null,
	};
};

module.exports = {
	getRewards,
	claimReward,
};
