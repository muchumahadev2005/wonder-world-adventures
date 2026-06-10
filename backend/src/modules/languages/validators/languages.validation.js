const { z } = require("zod");

const languageSchema = z.object({
	code: z.string().trim().min(1),
	name: z.string().trim().min(1),
	native: z.string().trim().optional().nullable(),
	flag: z.string().trim().optional().nullable(),
	isActive: z.boolean().optional(),
	sortOrder: z.coerce.number().int().optional(),
});

module.exports = {
	languageSchema,
};
