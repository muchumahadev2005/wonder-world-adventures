const { z } = require("zod");

const submitQuizSchema = z.object({
	quizId: z.string().trim().min(1),
	answers: z.array(
		z.object({
			questionId: z.string().trim().min(1),
			answer: z.union([z.string(), z.number(), z.boolean()]).transform(String),
		})
	).min(1),
});

module.exports = {
	submitQuizSchema,
};
