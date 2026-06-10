const repository = require("./progress.repository");

const getChildProfile = async (userId) => {
	const profile = await repository.getChildProfileByUserId(userId);
	if (!profile) {
		const error = new Error("Child profile not found");
		error.status = 404;
		throw error;
	}
	return profile;
};

const listProgress = async (userId) => {
	const childProfile = await getChildProfile(userId);
	return repository.listProgress(childProfile.id);
};

const resolveContentId = async (contentType, contentId) => {
	if (contentType === "STORY") {
		const story = await repository.findStory(contentId);
		if (!story) return null;
		return story.id;
	}
	if (contentType === "LESSON") {
		const lesson = await repository.findLesson(contentId);
		if (!lesson) return null;
		return lesson.id;
	}
	if (contentType === "GAME") {
		const game = await repository.findGame(contentId);
		if (!game) return null;
		return game.id;
	}
	return contentId;
};

const updateProgress = async (userId, body) => {
	const childProfile = await getChildProfile(userId);
	const resolvedContentId = await resolveContentId(body.contentType, body.contentId);
	if (!resolvedContentId) {
		const error = new Error(`${body.contentType.toLowerCase()} not found`);
		error.status = 404;
		throw error;
	}

	const isCompleted = body.isCompleted ?? body.progressPercentage >= 100;
	const progress = await repository.upsertProgressRecord({
		childProfileId: childProfile.id,
		contentType: body.contentType,
		contentId: resolvedContentId,
		progressPercentage: body.progressPercentage,
		isCompleted,
		metadata: body.metadata,
	});

	if (body.contentType === "STORY") {
		await repository.upsertStoryProgress({
			childProfileId: childProfile.id,
			storyId: resolvedContentId,
			progressPercentage: body.progressPercentage,
			isCompleted,
			lastReadPosition: body.lastReadPosition,
		});
	}

	if (body.contentType === "LESSON") {
		await repository.upsertLessonProgress({
			childProfileId: childProfile.id,
			lessonId: resolvedContentId,
			progressPercentage: body.progressPercentage,
			isCompleted,
		});
	}

	if (body.contentType === "GAME") {
		const existing = await repository.findGameProgress({
			childProfileId: childProfile.id,
			gameId: resolvedContentId,
		});
		const score = body.score || 0;
		await repository.upsertGameProgress({
			childProfileId: childProfile.id,
			gameId: resolvedContentId,
			score,
			highScore: Math.max(existing?.highScore || 0, score),
			isCompleted,
		});
	}

	return progress;
};

module.exports = {
	listProgress,
	updateProgress,
};
