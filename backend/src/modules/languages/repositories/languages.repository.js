const prisma = require("../../../prisma/prismaClient");

const listLanguages = () => {
	return prisma.language.findMany({
		where: { isActive: true },
		orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
	});
};

const findLanguageByIdOrCode = (id) => {
	return prisma.language.findFirst({
		where: {
			OR: [
				{ id },
				{ code: { equals: id, mode: "insensitive" } },
				{ name: { equals: id, mode: "insensitive" } },
			],
		},
	});
};

const listLevelsForLanguage = (languageId) => {
	return prisma.languageLevel.findMany({
		where: { languageId },
		include: { level: true },
		orderBy: [{ sortOrder: "asc" }, { level: { sortOrder: "asc" } }],
	});
};

module.exports = {
	listLanguages,
	findLanguageByIdOrCode,
	listLevelsForLanguage,
};
