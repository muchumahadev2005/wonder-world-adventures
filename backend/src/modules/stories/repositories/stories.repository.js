const prisma = require("../../../prisma/prismaClient");

const includeStory = {
	language: true,
	quizzes: {
		where: { isPublished: true },
		include: { questions: { orderBy: { sortOrder: "asc" } } },
	},
};

const buildLanguageFilter = (language) => {
	if (!language) return undefined;
	return {
		OR: [
			{ languageId: language },
			{ language: { code: { equals: language, mode: "insensitive" } } },
			{ language: { name: { equals: language, mode: "insensitive" } } },
		],
	};
};

const list = ({ language, category, ageGroup, isPremium, limit } = {}) => {
	const where = {
		isPublished: true,
		...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
		...(ageGroup ? { ageGroup } : {}),
		...(typeof isPremium === "boolean" ? { isPremium } : {}),
		...(buildLanguageFilter(language) || {}),
	};

	return prisma.story.findMany({
		where,
		include: includeStory,
		orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
		take: limit,
	});
};

const findByIdOrSlug = (id) => {
	return prisma.story.findFirst({
		where: { OR: [{ id }, { slug: id }] },
		include: includeStory,
	});
};

const listByCategory = (category) => list({ category });

const recommended = (limit = 6) => {
	return prisma.story.findMany({
		where: { isPublished: true },
		include: includeStory,
		orderBy: [{ isPremium: "asc" }, { starsReward: "desc" }, { sortOrder: "asc" }],
		take: limit,
	});
};

const findLanguage = ({ languageId, languageCode }) => {
	if (!languageId && !languageCode) return null;
	return prisma.language.findFirst({
		where: {
			OR: [
				...(languageId ? [{ id: languageId }] : []),
				...(languageCode ? [{ code: { equals: languageCode, mode: "insensitive" } }] : []),
			],
		},
	});
};

const create = (data) => {
	return prisma.story.create({ data, include: includeStory });
};

const update = (id, data) => {
	return prisma.story.update({ where: { id }, data, include: includeStory });
};

const remove = (id) => {
	return prisma.story.delete({ where: { id } });
};

module.exports = {
	list,
	findByIdOrSlug,
	listByCategory,
	recommended,
	findLanguage,
	create,
	update,
	remove,
};
