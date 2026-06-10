const { z } = require("zod");

const lessonQuerySchema = z.object({
	language: z.string().trim().optional(),
	languageId: z.string().trim().optional(),
	level: z.string().trim().optional(),
	levelId: z.string().trim().optional(),
});

const lessonSchema = z.object({
	slug: z.string().trim().optional(),
	title: z.string().trim().min(1),
	description: z.string().trim().optional().nullable(),
	intro: z.string().trim().optional().nullable(),
	emoji: z.string().trim().optional().nullable(),
	color: z.string().trim().optional().nullable(),
	category: z.string().trim().optional().nullable(),
	isPremium: z.boolean().optional(),
	isPublished: z.boolean().optional(),
	sortOrder: z.coerce.number().int().optional(),
	languageId: z.string().trim().min(1),
	levelId: z.string().trim().min(1),
});

module.exports = {
	lessonQuerySchema,
	lessonSchema,
};
