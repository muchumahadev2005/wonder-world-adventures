const { z } = require("zod");

const levelLessonsQuerySchema = z.object({
	language: z.string().trim().optional(),
	languageId: z.string().trim().optional(),
});

module.exports = {
	levelLessonsQuerySchema,
};
