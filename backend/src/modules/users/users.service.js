const prisma = require("../../prisma/prismaClient");

const getUserById = (id) => {
	return prisma.user.findUnique({
		where: { id },
		select: {
			id: true,
			name: true,
			email: true,
			profileImage: true,
			provider: true,
			isVerified: true,
			createdAt: true,
		},
	});
};

const getActiveSubscription = (userId) => {
	return prisma.userSubscription.findFirst({
		where: {
			userId,
			status: "ACTIVE",
			endDate: { gt: new Date() },
		},
		include: { plan: true },
	});
};

const getChildProfile = (userId) => {
	return prisma.childProfile.findUnique({
		where: { userId },
		include: {
			rewardWallet: true,
			storyProgress: { where: { isCompleted: true } },
			lessonProgress: { where: { isCompleted: true } },
			gameProgress: { where: { isCompleted: true } },
		},
	});
};

const updateUserProfile = (id, data) => {
	return prisma.user.update({
		where: { id },
		data,
		select: {
			id: true,
			name: true,
			email: true,
			profileImage: true,
			isVerified: true,
		},
	});
};

module.exports = { getUserById, getActiveSubscription, getChildProfile, updateUserProfile };
