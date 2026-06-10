const prisma = require("../../../prisma/prismaClient");

const findQuizById = (id) => {
	return prisma.quiz.findUnique({
		where: { id },
		include: {
			questions: { orderBy: { sortOrder: "asc" } },
			lesson: true,
			story: true,
		},
	});
};

const findAttemptById = (id) => {
	return prisma.quizAttempt.findUnique({
		where: { id },
		include: {
			quiz: {
				include: {
					questions: { orderBy: { sortOrder: "asc" } },
					lesson: true,
					story: true,
				},
			},
		},
	});
};

const createAttempt = (data) => {
	return prisma.quizAttempt.create({
		data,
		include: {
			quiz: {
				include: {
					questions: { orderBy: { sortOrder: "asc" } },
					lesson: true,
					story: true,
				},
			},
		},
	});
};

const getChildProfileByUserId = (userId) => {
	return prisma.childProfile.findUnique({ where: { userId } });
};

module.exports = {
	findQuizById,
	findAttemptById,
	createAttempt,
	getChildProfileByUserId,
};
