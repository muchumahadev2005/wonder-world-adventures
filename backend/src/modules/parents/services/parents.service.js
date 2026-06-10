const repository = require("../repositories/parents.repository");

const getChildProfile = async (userId) => {
	const profile = await repository.getChildProfileByUserId(userId);
	if (!profile) {
		const error = new Error("Child profile not found");
		error.status = 404;
		throw error;
	}
	return profile;
};

const getSummary = async (userId) => {
	const childProfile = await getChildProfile(userId);
	const dashboard = await repository.getDashboard(childProfile.id);
	const wallet = dashboard.wallet || {
		stars: 0,
		coins: 0,
		xp: 0,
		level: 1,
		streak: 0,
	};

	return {
		child: childProfile,
		stats: {
			stars: wallet.stars,
			coins: wallet.coins,
			xp: wallet.xp,
			level: wallet.level,
			streak: wallet.streak,
			...dashboard.counts,
		},
		recentActivity: [
			...dashboard.progress.map((item) => ({
				type: item.contentType,
				contentId: item.contentId,
				progressPercentage: item.progressPercentage,
				isCompleted: item.isCompleted,
				at: item.updatedAt,
			})),
			...dashboard.rewardTransactions.map((item) => ({
				type: "REWARD",
				rewardType: item.type,
				amount: item.amount,
				reason: item.reason,
				sourceType: item.sourceType,
				sourceId: item.sourceId,
				at: item.createdAt,
			})),
		].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 20),
		badges: dashboard.badges.map((item) => ({
			id: item.badge.id,
			code: item.badge.code,
			name: item.badge.name,
			description: item.badge.description,
			imageUrl: item.badge.imageUrl,
			earnedAt: item.earnedAt,
		})),
		quizAttempts: dashboard.quizAttempts,
	};
};

module.exports = {
	getSummary,
};
