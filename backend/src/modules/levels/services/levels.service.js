const lessonsService = require("../../lessons/services/lessons.service");
const repository = require("../repositories/levels.repository");

const getLessonsByLevel = async (id, query) => {
	const level = await repository.findByIdOrCode(id);
	if (!level) {
		const error = new Error("Level not found");
		error.status = 404;
		throw error;
	}
	const lessons = await lessonsService.getLessonsByLevel(level.id, query);
	return {
		level: {
			id: level.id,
			code: level.code,
			name: level.name,
			title: level.name,
			description: level.description,
		},
		lessons,
	};
};

module.exports = {
	getLessonsByLevel,
};
