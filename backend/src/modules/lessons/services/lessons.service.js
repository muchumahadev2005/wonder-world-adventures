const repository = require("../repositories/lessons.repository");
const cache = require("../../../utils/cache");

const normalizeCard = (card) => ({
	id: card.id,
	word: card.word,
	translit: card.translit,
	meaning: card.meaning,
	emoji: card.emoji,
	imageUrl: card.imageUrl,
	audioUrl: card.audioUrl,
	sortOrder: card.sortOrder,
});

const normalizeQuestion = (question) => ({
	id: question.id,
	type: question.type,
	question: question.question,
	emoji: question.emoji,
	options: question.options || undefined,
	answer: question.answer,
	hint: question.hint || undefined,
	points: question.points,
});

const normalizeQuiz = (quiz) => ({
	id: quiz.id,
	title: quiz.title,
	description: quiz.description,
	isPremium: quiz.isPremium,
	questions: (quiz.questions || []).map(normalizeQuestion),
});

const normalizeLesson = (lesson) => ({
	id: lesson.slug || lesson.id,
	lessonId: lesson.id,
	slug: lesson.slug,
	title: lesson.title,
	description: lesson.description,
	intro: lesson.intro,
	emoji: lesson.emoji,
	color: lesson.color,
	category: lesson.category,
	isPremium: lesson.isPremium,
	premium: lesson.isPremium,
	sortOrder: lesson.sortOrder,
	language: lesson.language
		? {
			id: lesson.language.id,
			code: lesson.language.code,
			name: lesson.language.name,
			native: lesson.language.native,
		}
		: null,
	level: lesson.level
		? {
			id: lesson.level.id,
			code: lesson.level.code,
			name: lesson.level.name,
			title: lesson.level.name,
			description: lesson.level.description,
		}
		: null,
	words: (lesson.cards || []).map(normalizeCard),
	cards: (lesson.cards || []).map(normalizeCard),
	quiz: lesson.quizzes?.[0] ? normalizeQuiz(lesson.quizzes[0]).questions : [],
	quizzes: (lesson.quizzes || []).map(normalizeQuiz),
});

const getLessonsByLevel = async (levelId, query = {}) => {
	const level = await repository.findLevelByIdOrCode(levelId);
	if (!level) {
		const error = new Error("Level not found");
		error.status = 404;
		throw error;
	}

	const cacheKey = cache.buildKey("lessons:level", { levelId: level.id, ...query });
	const { data, source } = await cache.cachedQuery(
		cacheKey,
		async () => {
			const rows = await repository.listByLevel(level.id, query);
			return rows.map(normalizeLesson);
		},
		cache.TTL.LESSONS_LIST
	);

	const result = Array.isArray(data) ? [...data] : data;
	result._cacheSource = source;
	return result;
};

const listLessons = async (query = {}) => {
	const cacheKey = cache.buildKey("lessons:list", query);
	const { data, source } = await cache.cachedQuery(
		cacheKey,
		async () => {
			const rows = await repository.list(query);
			return rows.map(normalizeLesson);
		},
		cache.TTL.LESSONS_LIST
	);

	const result = Array.isArray(data) ? [...data] : data;
	result._cacheSource = source;
	return result;
};

const getLesson = async (id) => {
	const cacheKey = `lessons:detail:${id.toLowerCase().trim()}`;
	const { data, source } = await cache.cachedQuery(
		cacheKey,
		async () => {
			const lesson = await repository.findByIdOrSlug(id);
			if (!lesson) {
				const error = new Error("Lesson not found");
				error.status = 404;
				throw error;
			}
			return normalizeLesson(lesson);
		},
		cache.TTL.LESSONS_DETAIL
	);

	const result = { ...data, _cacheSource: source };
	return result;
};

const getLessonCards = async (id) => {
	const lesson = await getLesson(id);
	return {
		lesson,
		cards: lesson.cards,
		words: lesson.words,
		_cacheSource: lesson._cacheSource,
	};
};

const getLessonQuiz = async (id) => {
	const lesson = await getLesson(id);
	const quiz = lesson.quizzes?.[0] || null;
	if (!quiz) {
		const error = new Error("Quiz not found");
		error.status = 404;
		throw error;
	}
	return { lesson, quiz, _cacheSource: lesson._cacheSource };
};

module.exports = {
	listLessons,
	getLessonsByLevel,
	getLesson,
	getLessonCards,
	getLessonQuiz,
	normalizeLesson,
};
