const repository = require("../repositories/languages.repository");

const normalizeLanguage = (language) => ({
	id: language.id,
	code: language.code,
	name: language.name,
	native: language.native,
	flag: language.flag,
	isActive: language.isActive,
	sortOrder: language.sortOrder,
});

const normalizeLevel = (level) => ({
	id: level.id,
	code: level.code,
	name: level.name,
	title: level.name,
	description: level.description,
	sortOrder: level.sortOrder,
});

const listLanguages = async () => {
	const languages = await repository.listLanguages();
	return languages.map(normalizeLanguage);
};

const getLevelsForLanguage = async (id) => {
	const language = await repository.findLanguageByIdOrCode(id);
	if (!language) {
		const error = new Error("Language not found");
		error.status = 404;
		throw error;
	}

	const links = await repository.listLevelsForLanguage(language.id);
	return {
		language: normalizeLanguage(language),
		levels: links.map((link) => normalizeLevel(link.level)),
	};
};

module.exports = {
	listLanguages,
	getLevelsForLanguage,
	normalizeLanguage,
	normalizeLevel,
};
