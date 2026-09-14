const { z } = require("zod");

const listStoriesSchema = z.object({
	page:      z.coerce.number().int().min(1).optional().default(1),
	limit:     z.coerce.number().int().min(1).max(50).optional().default(12),
	language:  z.string().optional(),
	level:     z.coerce.number().int().min(1).max(10).optional(),
	category:  z.string().optional(),
	query:     z.string().max(200).optional(),
	source:    z.enum(["api", "database", "db"]).optional(),
	audioOnly: z.coerce.boolean().optional(),
});

const storyIdSchema = z.object({
	id: z.string().min(1).max(200),
});

const syncAudiosSchema = z.object({
	limit:    z.coerce.number().int().min(1).max(1000).optional().default(50),
	language: z.string().optional(),
	level:    z.coerce.number().int().min(1).max(10).optional(),
});

module.exports = { listStoriesSchema, storyIdSchema, syncAudiosSchema };
