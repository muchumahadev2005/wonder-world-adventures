const { z } = require("zod");

const gameProgressSchema = z.object({
	gameId: z.string().trim().min(1),
	score: z.coerce.number().int().min(0).default(0),
	isCompleted: z.boolean().optional(),
});

module.exports = {
	gameProgressSchema,
};
