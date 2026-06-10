const { z } = require("zod");

const claimRewardSchema = z.object({
	stars: z.coerce.number().int().min(0).default(0),
	coins: z.coerce.number().int().min(0).default(0),
	xp: z.coerce.number().int().min(0).default(0),
	badgeCode: z.string().trim().optional(),
	badgeName: z.string().trim().optional(),
	reason: z.string().trim().optional(),
	sourceType: z.string().trim().optional(),
	sourceId: z.string().trim().optional(),
});

module.exports = {
	claimRewardSchema,
};
