const prisma = require("../../prisma/prismaClient");

const getProfile = async (userId) => {
	return prisma.childProfile.findUnique({ where: { userId } });
};

const upsertProfile = async (userId, data) => {
	return prisma.childProfile.upsert({
		where: { userId },
		update: {
			name: data.name,
			ageGroup: data.ageGroup,
			favoriteColor: data.favoriteColor,
			favoriteCharacter: data.favoriteCharacter,
		},
		create: {
			userId,
			name: data.name,
			ageGroup: data.ageGroup,
			favoriteColor: data.favoriteColor,
			favoriteCharacter: data.favoriteCharacter,
		},
	});
};

module.exports = { getProfile, upsertProfile };
