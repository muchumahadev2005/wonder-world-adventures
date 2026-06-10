const prisma = require("../../prisma/prismaClient");

const getChildProfileByUserId = (userId) => {
	return prisma.childProfile.findUnique({ where: { userId } });
};

const listProgress = (childProfileId) => {
	return prisma.progressRecord.findMany({
		where: { childProfileId },
		orderBy: { updatedAt: "desc" },
	});
};

const upsertProgressRecord = ({ childProfileId, contentType, contentId, progressPercentage, isCompleted, metadata }) => {
	return prisma.progressRecord.upsert({
		where: { childProfileId_contentType_contentId: { childProfileId, contentType, contentId } },
		update: {
			progressPercentage,
			isCompleted,
			metadata,
			completedAt: isCompleted ? new Date() : null,
		},
		create: {
			childProfileId,
			contentType,
			contentId,
			progressPercentage,
			isCompleted,
			metadata,
			completedAt: isCompleted ? new Date() : null,
		},
	});
};

const findStory = (id) => {
	return prisma.story.findFirst({ where: { OR: [{ id }, { slug: id }] } });
};

const findLesson = (id) => {
	return prisma.lesson.findFirst({ where: { OR: [{ id }, { slug: id }] } });
};

const findGame = (id) => {
	return prisma.game.findFirst({ where: { OR: [{ id }, { slug: id }] } });
};

const upsertStoryProgress = ({ childProfileId, storyId, progressPercentage, isCompleted, lastReadPosition }) => {
	return prisma.storyProgress.upsert({
		where: { childProfileId_storyId: { childProfileId, storyId } },
		update: {
			progressPercentage,
			isCompleted,
			lastReadPosition,
			completedAt: isCompleted ? new Date() : null,
		},
		create: {
			childProfileId,
			storyId,
			progressPercentage,
			isCompleted,
			lastReadPosition,
			completedAt: isCompleted ? new Date() : null,
		},
	});
};

const upsertLessonProgress = ({ childProfileId, lessonId, progressPercentage, isCompleted }) => {
	return prisma.lessonProgress.upsert({
		where: { childProfileId_lessonId: { childProfileId, lessonId } },
		update: {
			progressPercentage,
			isCompleted,
			completedAt: isCompleted ? new Date() : null,
		},
		create: {
			childProfileId,
			lessonId,
			progressPercentage,
			isCompleted,
			completedAt: isCompleted ? new Date() : null,
		},
	});
};

const findGameProgress = ({ childProfileId, gameId }) => {
	return prisma.gameProgress.findUnique({
		where: { childProfileId_gameId: { childProfileId, gameId } },
	});
};

const upsertGameProgress = ({ childProfileId, gameId, score, highScore, isCompleted }) => {
	return prisma.gameProgress.upsert({
		where: { childProfileId_gameId: { childProfileId, gameId } },
		update: {
			score,
			highScore,
			attempts: { increment: 1 },
			isCompleted,
			lastPlayedAt: new Date(),
		},
		create: {
			childProfileId,
			gameId,
			score,
			highScore,
			attempts: 1,
			isCompleted,
			lastPlayedAt: new Date(),
		},
	});
};

module.exports = {
	getChildProfileByUserId,
	listProgress,
	upsertProgressRecord,
	findStory,
	findLesson,
	findGame,
	upsertStoryProgress,
	upsertLessonProgress,
	findGameProgress,
	upsertGameProgress,
};
