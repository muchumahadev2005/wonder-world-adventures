const { z } = require("zod");

const optionalString = z.string().trim().min(1).optional();
const optionalBoolean = z
	.union([z.boolean(), z.string()])
	.optional()
	.transform((value) => {
		if (typeof value === "boolean") return value;
		if (value === "true") return true;
		if (value === "false") return false;
		return undefined;
	});

const listStoriesSchema = z.object({
	language: optionalString,
	languageId: optionalString,
	category: optionalString,
	ageGroup: optionalString,
	isPremium: optionalBoolean,
	limit: z.coerce.number().int().min(1).max(100).optional(),
});

const storySchema = z.object({
	slug: optionalString,
	title: z.string().trim().min(1),
	description: z.string().trim().optional().nullable(),
	content: z.string().trim().min(1),
	pages: z.array(z.string()).optional(),
	author: z.string().trim().optional().nullable(),
	category: z.string().trim().optional().nullable(),
	ageGroup: z.string().trim().optional().nullable(),
	tags: z.array(z.string()).optional(),
	thumbnail: z.string().trim().optional().nullable(),
	coverEmoji: z.string().trim().optional().nullable(),
	coverGradient: z.string().trim().optional().nullable(),
	readingTime: z.coerce.number().int().min(0).optional().nullable(),
	duration: z.string().trim().optional().nullable(),
	isPremium: z.boolean().optional(),
	audioUrl: z.string().trim().optional().nullable(),
	starsReward: z.coerce.number().int().min(0).optional(),
	isPublished: z.boolean().optional(),
	languageId: z.string().trim().optional().nullable(),
	languageCode: z.string().trim().optional().nullable(),
	sortOrder: z.coerce.number().int().optional(),
});

const updateStorySchema = storySchema.partial().refine((value) => Object.keys(value).length > 0, {
	message: "At least one field is required",
});

module.exports = {
	listStoriesSchema,
	storySchema,
	updateStorySchema,
};
