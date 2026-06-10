const prisma = require("../../../prisma/prismaClient");

const lessonInclude = {
	language: true,
	level: true,
	cards: { orderBy: { sortOrder: "asc" } },
	quizzes: {
		where: { isPublished: true },
		include: { questions: { orderBy: { sortOrder: "asc" } } },
	},
};

const findLevelByIdOrCode = (id) => {
	return prisma.level.findFirst({
		where: {
			OR: [
				{ id },
				{ code: { equals: id, mode: "insensitive" } },
				{ name: { equals: id, mode: "insensitive" } },
			],
		},
	});
};

const listByLevel = (levelId, filters = {}) => {
	return prisma.lesson.findMany({
		where: {
			levelId,
			isPublished: true,
			...(filters.languageId ? { languageId: filters.languageId } : {}),
			...(filters.language
				? {
					language: {
						OR: [
							{ id: filters.language },
							{ code: { equals: filters.language, mode: "insensitive" } },
							{ name: { equals: filters.language, mode: "insensitive" } },
						],
					},
				}
				: {}),
		},
		include: lessonInclude,
		orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
	});
};

const list = (filters = {}) => {
	return prisma.lesson.findMany({
		where: {
			isPublished: true,
			...(filters.languageId ? { languageId: filters.languageId } : {}),
			...(filters.levelId ? { levelId: filters.levelId } : {}),
			...(filters.language
				? {
					language: {
						OR: [
							{ id: filters.language },
							{ code: { equals: filters.language, mode: "insensitive" } },
							{ name: { equals: filters.language, mode: "insensitive" } },
						],
					},
				}
				: {}),
			...(filters.level
				? {
					level: {
						OR: [
							{ id: filters.level },
							{ code: { equals: filters.level, mode: "insensitive" } },
							{ name: { equals: filters.level, mode: "insensitive" } },
						],
					},
				}
				: {}),
		},
		include: lessonInclude,
		orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
	});
};

const findByIdOrSlug = (id) => {
	return prisma.lesson.findFirst({
		where: { OR: [{ id }, { slug: id }] },
		include: lessonInclude,
	});
};

module.exports = {
	findLevelByIdOrCode,
	listByLevel,
	list,
	findByIdOrSlug,
};
