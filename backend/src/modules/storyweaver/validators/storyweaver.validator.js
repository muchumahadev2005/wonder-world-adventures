const { z } = require("zod");

const listStoriesSchema = z.object({
	page:     z.coerce.number().int().min(1).optional().default(1),
	limit:    z.coerce.number().int().min(1).max(50).optional().default(12),
	language: z.string().optional(),
	level:    z.coerce.number().int().min(1).max(10).optional(),
	category: z.string().optional(),
	query:    z.string().max(200).optional(),
});

const storyIdSchema = z.object({
	id: z.string().min(1).max(200),
});

module.exports = { listStoriesSchema, storyIdSchema };
