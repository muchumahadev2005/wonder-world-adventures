const { z } = require("zod");

const progressUpdateSchema = z.object({
	contentType: z.enum(["LANGUAGE", "LESSON", "STORY", "GAME"]),
	contentId: z.string().trim().min(1),
	progressPercentage: z.coerce.number().int().min(0).max(100).default(0),
	isCompleted: z.boolean().optional(),
	metadata: z.record(z.unknown()).optional(),
	lastReadPosition: z.coerce.number().int().min(0).optional(),
	score: z.coerce.number().int().min(0).optional(),
});

module.exports = {
	progressUpdateSchema,
};
