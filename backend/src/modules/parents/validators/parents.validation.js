const { z } = require("zod");

const emptyQuerySchema = z.object({});

module.exports = {
	emptyQuerySchema,
};
