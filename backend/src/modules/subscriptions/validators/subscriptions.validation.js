const { z } = require("zod");

const subscribeSchema = z.object({
	planId: z.string().min(1),
});

const emptySchema = z.object({});

module.exports = {
	subscribeSchema,
	emptySchema,
};
