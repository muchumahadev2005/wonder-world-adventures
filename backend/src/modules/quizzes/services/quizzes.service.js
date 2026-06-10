const repository = require("../repositories/quizzes.repository");

const normalizeAnswer = (value) => String(value || "").trim().toLowerCase();

const normalizeAttempt = (attempt) => ({
	id: attempt.id,
	quizId: attempt.quizId,
	score: attempt.score,
	totalPoints: attempt.totalPoints,
	starsEarned: attempt.starsEarned,
	answers: attempt.answers,
	isCompleted: attempt.isCompleted,
	createdAt: attempt.createdAt,
	quiz: attempt.quiz
		? {
			id: attempt.quiz.id,
			title: attempt.quiz.title,
			lessonId: attempt.quiz.lessonId,
			storyId: attempt.quiz.storyId,
		}
		: undefined,
});

const getChildProfile = async (userId) => {
	const profile = await repository.getChildProfileByUserId(userId);
	if (!profile) {
		const error = new Error("Child profile not found");
		error.status = 404;
		throw error;
	}
	return profile;
};

const submitQuiz = async (userId, body) => {
	const childProfile = await getChildProfile(userId);
	const quiz = await repository.findQuizById(body.quizId);
	if (!quiz || !quiz.isPublished) {
		const error = new Error("Quiz not found");
		error.status = 404;
		throw error;
	}

	const answersByQuestion = new Map(
		body.answers.map((answer) => [answer.questionId, answer.answer])
	);
	let score = 0;
	let totalPoints = 0;

	const evaluatedAnswers = quiz.questions.map((question) => {
		const submitted = answersByQuestion.get(question.id) || "";
		const isCorrect = normalizeAnswer(submitted) === normalizeAnswer(question.answer);
		totalPoints += question.points;
		if (isCorrect) score += question.points;
		return {
			questionId: question.id,
			answer: submitted,
			correctAnswer: question.answer,
			isCorrect,
			points: isCorrect ? question.points : 0,
		};
	});

	const starsEarned = totalPoints > 0 ? Math.ceil((score / totalPoints) * 3) : 0;
	const attempt = await repository.createAttempt({
		childProfileId: childProfile.id,
		quizId: quiz.id,
		score,
		totalPoints,
		starsEarned,
		answers: evaluatedAnswers,
		isCompleted: true,
	});

	return normalizeAttempt(attempt);
};

const getResult = async (id) => {
	const attempt = await repository.findAttemptById(id);
	if (!attempt) {
		const error = new Error("Quiz result not found");
		error.status = 404;
		throw error;
	}
	return normalizeAttempt(attempt);
};

module.exports = {
	submitQuiz,
	getResult,
};
