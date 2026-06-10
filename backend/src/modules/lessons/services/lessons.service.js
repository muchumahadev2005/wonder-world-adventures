const repository = require("../repositories/lessons.repository");

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
	const lessons = await repository.listByLevel(level.id, query);
	return lessons.map(normalizeLesson);
};

const listLessons = async (query = {}) => {
	const lessons = await repository.list(query);
	return lessons.map(normalizeLesson);
};

const getLesson = async (id) => {
	const lesson = await repository.findByIdOrSlug(id);
	if (!lesson) {
		const error = new Error("Lesson not found");
		error.status = 404;
		throw error;
	}
	return normalizeLesson(lesson);
};

const getLessonCards = async (id) => {
	const lesson = await getLesson(id);
	return {
		lesson,
		cards: lesson.cards,
		words: lesson.words,
	};
};

const getLessonQuiz = async (id) => {
	const lesson = await getLesson(id);
	const quiz = lesson.quizzes[0] || null;
	if (!quiz) {
		const error = new Error("Quiz not found");
		error.status = 404;
		throw error;
	}
	return { lesson, quiz };
};

module.exports = {
	listLessons,
	getLessonsByLevel,
	getLesson,
	getLessonCards,
	getLessonQuiz,
	normalizeLesson,
};
