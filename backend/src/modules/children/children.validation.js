const { z } = require("zod");

const childProfileSchema = z.object({
	name: z.string().min(1),
	ageGroup: z.enum(["3-5", "6-8", "9-11"]),
	favoriteColor: z.string().min(1),
	favoriteCharacter: z.string().min(1),
});

module.exports = { childProfileSchema };
