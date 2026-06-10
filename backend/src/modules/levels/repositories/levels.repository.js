const prisma = require("../../../prisma/prismaClient");

const findByIdOrCode = (id) => {
	return prisma.level.findFirst({
		where: {
			OR: [
				{ id },
				{ code: { equals: id, mode: "insensitive" } },
				{ name: { equals: id, mode: "insensitive" } },
			],
		},
	});
};

module.exports = {
	findByIdOrCode,
};
