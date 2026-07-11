const prisma = require("../../../prisma/prismaClient");

// ── Shared include ────────────────────────────────────────────────
const includeStory = {
	language: true,
	quizzes: {
		where: { isPublished: true },
		include: { questions: { orderBy: { sortOrder: "asc" } } },
	},
};

// ── Language filter builder ───────────────────────────────────────
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

// ── List (supports rich admin + public filtering) ─────────────────
const list = ({
	language, category, ageGroup, difficulty,
	isPremium, isFeatured, isTrending, isRecommended,
	isPublished, search,
	limit = 100, page = 1,
	sortBy = "createdAt", sortOrder: sortDir = "desc",
} = {}) => {
	const where = {};

	// Only apply isPublished filter if explicitly provided
	if (typeof isPublished === "boolean") where.isPublished = isPublished;
	// For public listings (no explicit flag), default to published only
	// (callers that want all set isPublished: undefined explicitly)

	if (category)   where.category  = { equals: category,  mode: "insensitive" };
	if (ageGroup)   where.ageGroup   = ageGroup;
	if (difficulty) where.difficulty = { equals: difficulty, mode: "insensitive" };

	if (typeof isPremium    === "boolean") where.isPremium    = isPremium;
	if (typeof isFeatured   === "boolean") where.isFeatured   = isFeatured;
	if (typeof isTrending   === "boolean") where.isTrending   = isTrending;
	if (typeof isRecommended=== "boolean") where.isRecommended= isRecommended;

	if (search) {
		where.OR = [
			{ title:       { contains: search, mode: "insensitive" } },
			{ author:      { contains: search, mode: "insensitive" } },
			{ description: { contains: search, mode: "insensitive" } },
		];
	}

	const langFilter = buildLanguageFilter(language);
	if (langFilter) Object.assign(where, langFilter);

	const allowedSort = ["createdAt", "title", "readingTime", "starsReward", "xpReward", "readsCount", "likesCount", "sortOrder"];
	const orderField  = allowedSort.includes(sortBy) ? sortBy : "createdAt";

	return prisma.story.findMany({
		where,
		include: includeStory,
		orderBy: [{ [orderField]: sortDir === "asc" ? "asc" : "desc" }],
		take:    Math.min(Number(limit) || 100, 500),
		skip:    (Math.max(Number(page) || 1, 1) - 1) * (Math.min(Number(limit) || 100, 500)),
	});
};

// ── Find by id or slug ────────────────────────────────────────────
const findByIdOrSlug = (id) =>
	prisma.story.findFirst({
		where: { OR: [{ id }, { slug: id }] },
		include: includeStory,
	});

// ── Category listing ──────────────────────────────────────────────
const listByCategory = (category) =>
	list({ category, isPublished: true });

// ── Recommended ───────────────────────────────────────────────────
const recommended = (limit = 6) =>
	prisma.story.findMany({
		where: { isPublished: true },
		include: includeStory,
		orderBy: [{ isPremium: "asc" }, { starsReward: "desc" }, { sortOrder: "asc" }],
		take: limit,
	});

// ── Language lookup ───────────────────────────────────────────────
const findLanguage = ({ languageId, languageCode }) => {
	if (!languageId && !languageCode) return null;
	return prisma.language.findFirst({
		where: {
			OR: [
				...(languageId   ? [{ id: languageId }] : []),
				...(languageCode ? [{ code: { equals: languageCode, mode: "insensitive" } }] : []),
			],
		},
	});
};

// ── CRUD ──────────────────────────────────────────────────────────
const create = (data)       => prisma.story.create({ data, include: includeStory });
const update = (id, data)   => prisma.story.update({ where: { id }, data, include: includeStory });
const remove = (id)         => prisma.story.delete({ where: { id } });

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
