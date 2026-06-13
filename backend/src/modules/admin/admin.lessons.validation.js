const { z } = require("zod");

const cardSchema = z.object({
	word: z.string().trim().min(1, "Title is required"),
	translit: z.string().trim().optional().nullable(),
	meaning: z.string().trim().optional().nullable(),
	emoji: z.string().trim().optional().nullable(),
	imageUrl: z.string().trim().optional().nullable(),
	sortOrder: z.coerce.number().int().optional().default(0),
});

const quizQuestionSchema = z.object({
	question: z.string().trim().min(1, "Question is required"),
	type: z.string().trim().optional().default("mcq"),
	emoji: z.string().trim().optional().nullable(),
	options: z.array(z.string()).min(2, "At least 2 options required").optional(),
	answer: z.string().trim().min(1, "Answer is required"),
	hint: z.string().trim().optional().nullable(),
	explanation: z.string().trim().optional().nullable(),
	points: z.coerce.number().int().optional().default(1),
	sortOrder: z.coerce.number().int().optional().default(0),
});

const createLessonSchema = z.object({
	lessonCode: z.string().trim().optional().nullable(),
	title: z.string().trim().min(1, "Title is required"),
	description: z.string().trim().optional().nullable(),
	intro: z.string().trim().optional().nullable(),
	emoji: z.string().trim().optional().nullable(),
	color: z.string().trim().optional().nullable(),
	category: z.string().trim().optional().nullable(),
	tags: z.array(z.string()).optional().default([]),
	status: z.enum(["draft", "review", "published", "archived"]).optional().default("draft"),
	isPremium: z.boolean().optional().default(false),
	sortOrder: z.coerce.number().int().optional().default(0),
	languageId: z.string().trim().min(1, "Language is required"),
	levelId: z.string().trim().min(1, "Level is required"),
	cards: z.array(cardSchema).optional().default([]),
	quiz: z.array(quizQuestionSchema).optional().default([]),
});

const updateLessonSchema = z.object({
	lessonCode: z.string().trim().optional().nullable(),
	title: z.string().trim().min(1).optional(),
	description: z.string().trim().optional().nullable(),
	intro: z.string().trim().optional().nullable(),
	emoji: z.string().trim().optional().nullable(),
	color: z.string().trim().optional().nullable(),
	category: z.string().trim().optional().nullable(),
	tags: z.array(z.string()).optional(),
	status: z.enum(["draft", "review", "published", "archived"]).optional(),
	isPremium: z.boolean().optional(),
	sortOrder: z.coerce.number().int().optional(),
	languageId: z.string().trim().min(1).optional(),
	levelId: z.string().trim().min(1).optional(),
	cards: z.array(cardSchema).optional(),
	quiz: z.array(quizQuestionSchema).optional(),
	changeNote: z.string().trim().optional(),
});

const importJsonSchema = z.object({
	lessons: z.array(
		z.object({
			lessonCode: z.string().trim().optional(),
			title: z.string().trim().min(1),
			description: z.string().trim().optional().nullable(),
			intro: z.string().trim().optional().nullable(),
			emoji: z.string().trim().optional().nullable(),
			color: z.string().trim().optional().nullable(),
			category: z.string().trim().optional().nullable(),
			tags: z.array(z.string()).optional().default([]),
			language: z.string().trim().min(1, "Language code is required"),
			level: z.string().trim().min(1, "Level code is required"),
			isPremium: z.boolean().optional().default(false),
			sortOrder: z.coerce.number().int().optional().default(0),
			cards: z.array(cardSchema).optional().default([]),
			quiz: z.array(quizQuestionSchema).optional().default([]),
		})
	).min(1, "At least one lesson is required"),
});

const bulkReorderSchema = z.object({
	items: z.array(
		z.object({
			id: z.string().min(1),
			sortOrder: z.coerce.number().int(),
		})
	),
});

module.exports = {
	cardSchema,
	quizQuestionSchema,
	createLessonSchema,
	updateLessonSchema,
	importJsonSchema,
	bulkReorderSchema,
};
