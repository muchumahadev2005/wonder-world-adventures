const repository = require("../repositories/stories.repository");

const slugify = (value) =>
	String(value || "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

const normalizeQuiz = (quiz) => ({
	id: quiz.id,
	title: quiz.title,
	description: quiz.description,
	isPremium: quiz.isPremium,
	questions: (quiz.questions || []).map((question) => ({
		id: question.id,
		type: question.type,
		question: question.question,
		emoji: question.emoji,
		options: question.options || undefined,
		answer: question.answer,
		hint: question.hint || undefined,
		points: question.points,
	})),
});

const normalizeStory = (story) => ({
	id: story.slug || story.id,
	storyId: story.id,
	slug: story.slug,
	title: story.title,
	description: story.description,
	content: story.content,
	pages: story.pages || undefined,
	author: story.author,
	category: story.category,
	ageGroup: story.ageGroup,
	tags: story.tags || [],
	thumbnail: story.thumbnail,
	coverEmoji: story.coverEmoji,
	coverGradient: story.coverGradient,
	readingTime: story.readingTime,
	duration: story.duration,
	isPremium: story.isPremium,
	premium: story.isPremium,
	audioUrl: story.audioUrl,
	starsReward: story.starsReward,
	stars: story.starsReward,
	language: story.language
		? {
			id: story.language.id,
			code: story.language.code,
			name: story.language.name,
			native: story.language.native,
		}
		: null,
	quiz: story.quizzes?.[0] ? normalizeQuiz(story.quizzes[0]).questions : [],
	quizzes: (story.quizzes || []).map(normalizeQuiz),
});

const normalizeStoryData = async (input, { partial = false } = {}) => {
	const language = await repository.findLanguage({
		languageId: input.languageId,
		languageCode: input.languageCode,
	});

	const data = { ...input };
	if (input.slug || (!partial && input.title)) data.slug = input.slug || slugify(input.title);
	if (input.pages) data.pages = input.pages;
	if (!partial) {
		data.starsReward = input.starsReward ?? 0;
		data.isPremium = input.isPremium ?? false;
		data.isPublished = input.isPublished ?? true;
		data.sortOrder = input.sortOrder ?? 0;
	}

	delete data.languageCode;
	delete data.languageId;

	if (language) {
		data.language = { connect: { id: language.id } };
	}

	return data;
};

const listStories = async (query) => {
	const stories = await repository.list({
		...query,
		language: query.language || query.languageId,
	});
	return stories.map(normalizeStory);
};

const getStory = async (id) => {
	const story = await repository.findByIdOrSlug(id);
	if (!story) {
		const error = new Error("Story not found");
		error.status = 404;
		throw error;
	}
	return normalizeStory(story);
};

const listByCategory = async (category) => {
	const stories = await repository.listByCategory(category);
	return stories.map(normalizeStory);
};

const recommended = async () => {
	const stories = await repository.recommended();
	return stories.map(normalizeStory);
};

const createStory = async (body) => {
	const data = await normalizeStoryData(body);
	const story = await repository.create(data);
	return normalizeStory(story);
};

const updateStory = async (idOrSlug, body) => {
	const existing = await repository.findByIdOrSlug(idOrSlug);
	if (!existing) {
		const error = new Error("Story not found");
		error.status = 404;
		throw error;
	}
	const data = await normalizeStoryData(body, { partial: true });
	if (!body.slug) delete data.slug;
	const story = await repository.update(existing.id, data);
	return normalizeStory(story);
};

const deleteStory = async (idOrSlug) => {
	const existing = await repository.findByIdOrSlug(idOrSlug);
	if (!existing) {
		const error = new Error("Story not found");
		error.status = 404;
		throw error;
	}
	await repository.remove(existing.id);
	return { id: existing.id };
};

module.exports = {
	listStories,
	getStory,
	listByCategory,
	recommended,
	createStory,
	updateStory,
	deleteStory,
	normalizeStory,
};
