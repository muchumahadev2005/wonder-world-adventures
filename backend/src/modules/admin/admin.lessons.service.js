const prisma = require("../../prisma/prismaClient");
const XLSX = require("xlsx");

// ── Helpers ──────────────────────────────────────────────────────

const toSlug = (text) =>
	text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.slice(0, 80);

const lessonInclude = {
	language: true,
	level: true,
	cards: { orderBy: { sortOrder: "asc" } },
	quizzes: {
		include: { questions: { orderBy: { sortOrder: "asc" } } },
	},
	_count: { select: { cards: true, versions: true } },
};

// ── CRUD ─────────────────────────────────────────────────────────

const listLessons = async ({ page = 1, limit = 20, search, language, level, status, premium } = {}) => {
	const skip = (page - 1) * limit;
	const where = {};

	if (search) {
		where.OR = [
			{ title: { contains: search, mode: "insensitive" } },
			{ lessonCode: { contains: search, mode: "insensitive" } },
			{ tags: { hasSome: [search.toLowerCase()] } },
		];
	}
	if (language) {
		where.language = {
			OR: [{ id: language }, { code: { equals: language, mode: "insensitive" } }],
		};
	}
	if (level) {
		where.level = {
			OR: [{ id: level }, { code: { equals: level, mode: "insensitive" } }],
		};
	}
	if (status && status !== "all") where.status = status;
	if (premium === "true") where.isPremium = true;
	if (premium === "false") where.isPremium = false;

	const [lessons, total] = await Promise.all([
		prisma.lesson.findMany({
			where,
			skip,
			take: limit,
			orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
			include: {
				language: { select: { id: true, code: true, name: true } },
				level: { select: { id: true, code: true, name: true } },
				_count: { select: { cards: true } },
				quizzes: { select: { _count: { select: { questions: true } } } },
			},
		}),
		prisma.lesson.count({ where }),
	]);

	// Flatten quiz question count
	const mapped = lessons.map((l) => ({
		...l,
		_count: {
			...l._count,
			quizQuestions: l.quizzes.reduce((sum, q) => sum + q._count.questions, 0),
		},
		quizzes: undefined,
	}));

	return { lessons: mapped, total, page, limit };
};

const getLesson = async (id) => {
	const lesson = await prisma.lesson.findFirst({
		where: { OR: [{ id }, { slug: id }, { lessonCode: id }] },
		include: lessonInclude,
	});
	if (!lesson) {
		const err = new Error("Lesson not found");
		err.status = 404;
		throw err;
	}
	return lesson;
};

const createLesson = async (data, userId) => {
	const { cards, quiz, ...lessonData } = data;

	// Generate slug
	const slugBase = toSlug(lessonData.lessonCode || lessonData.title);
	let slug = slugBase;
	let suffix = 0;
	while (await prisma.lesson.findUnique({ where: { slug } })) {
		suffix++;
		slug = `${slugBase}-${suffix}`;
	}

	// Resolve status → isPublished
	const isPublished = lessonData.status === "published";
	const publishedAt = isPublished ? new Date() : null;

	const lesson = await prisma.lesson.create({
		data: {
			...lessonData,
			slug,
			isPublished,
			publishedAt,
			cards: {
				create: (cards || []).map((c, i) => ({
					word: c.word,
					translit: c.translit || null,
					meaning: c.meaning || null,
					emoji: c.emoji || null,
					imageUrl: c.imageUrl || null,
					sortOrder: c.sortOrder ?? i,
				})),
			},
			...(quiz && quiz.length > 0
				? {
						quizzes: {
							create: {
								title: `${lessonData.title} Quiz`,
								isPremium: lessonData.isPremium || false,
								isPublished,
								languageId: lessonData.languageId,
								levelId: lessonData.levelId,
								questions: {
									create: quiz.map((q, i) => ({
										type: q.type || "mcq",
										question: q.question,
										emoji: q.emoji || null,
										options: q.options || null,
										answer: q.answer,
										hint: q.hint || null,
										explanation: q.explanation || null,
										points: q.points || 1,
										sortOrder: q.sortOrder ?? i,
									})),
								},
							},
						},
				  }
				: {}),
		},
		include: lessonInclude,
	});

	return lesson;
};

const updateLesson = async (id, data, userId) => {
	const existing = await getLesson(id);
	const { cards, quiz, changeNote, ...lessonData } = data;

	// Create version snapshot of current state before update
	const versionCount = await prisma.lessonVersion.count({ where: { lessonId: existing.id } });
	await prisma.lessonVersion.create({
		data: {
			lessonId: existing.id,
			version: versionCount + 1,
			snapshot: JSON.parse(JSON.stringify(existing)),
			changeNote: changeNote || null,
			createdBy: userId || null,
		},
	});

	// Resolve status
	if (lessonData.status) {
		lessonData.isPublished = lessonData.status === "published";
		if (lessonData.status === "published" && !existing.publishedAt) {
			lessonData.publishedAt = new Date();
		}
		if (lessonData.status === "archived") {
			lessonData.archivedAt = new Date();
		}
	}

	// Update lesson fields
	const lesson = await prisma.lesson.update({
		where: { id: existing.id },
		data: lessonData,
		include: lessonInclude,
	});

	// Update cards if provided (replace all)
	if (cards) {
		await prisma.lessonCard.deleteMany({ where: { lessonId: existing.id } });
		if (cards.length > 0) {
			await prisma.lessonCard.createMany({
				data: cards.map((c, i) => ({
					lessonId: existing.id,
					word: c.word,
					translit: c.translit || null,
					meaning: c.meaning || null,
					emoji: c.emoji || null,
					imageUrl: c.imageUrl || null,
					sortOrder: c.sortOrder ?? i,
				})),
			});
		}
	}

	// Update quiz if provided (replace all)
	if (quiz) {
		// Delete existing quizzes for this lesson
		const existingQuizzes = await prisma.quiz.findMany({ where: { lessonId: existing.id } });
		for (const q of existingQuizzes) {
			await prisma.quizQuestion.deleteMany({ where: { quizId: q.id } });
			await prisma.quiz.delete({ where: { id: q.id } });
		}

		if (quiz.length > 0) {
			await prisma.quiz.create({
				data: {
					title: `${lesson.title} Quiz`,
					isPremium: lesson.isPremium,
					isPublished: lesson.isPublished,
					languageId: lesson.languageId,
					levelId: lesson.levelId,
					lessonId: existing.id,
					questions: {
						create: quiz.map((q, i) => ({
							type: q.type || "mcq",
							question: q.question,
							emoji: q.emoji || null,
							options: q.options || null,
							answer: q.answer,
							hint: q.hint || null,
							explanation: q.explanation || null,
							points: q.points || 1,
							sortOrder: q.sortOrder ?? i,
						})),
					},
				},
			});
		}
	}

	return getLesson(existing.id);
};

const deleteLesson = async (id) => {
	const lesson = await getLesson(id);
	await prisma.lesson.delete({ where: { id: lesson.id } });
	return { deleted: true };
};

const duplicateLesson = async (id) => {
	const source = await getLesson(id);

	const newCode = source.lessonCode ? `${source.lessonCode}-COPY` : null;
	const data = {
		title: `${source.title} (Copy)`,
		lessonCode: newCode,
		description: source.description,
		intro: source.intro,
		emoji: source.emoji,
		color: source.color,
		category: source.category,
		tags: source.tags || [],
		status: "draft",
		isPremium: source.isPremium,
		sortOrder: source.sortOrder + 1,
		languageId: source.languageId,
		levelId: source.levelId,
	};

	const cards = (source.cards || []).map((c) => ({
		word: c.word,
		translit: c.translit,
		meaning: c.meaning,
		emoji: c.emoji,
		imageUrl: c.imageUrl,
		sortOrder: c.sortOrder,
	}));

	const quiz =
		source.quizzes?.[0]?.questions?.map((q) => ({
			question: q.question,
			type: q.type,
			emoji: q.emoji,
			options: q.options,
			answer: q.answer,
			hint: q.hint,
			explanation: q.explanation,
			points: q.points,
			sortOrder: q.sortOrder,
		})) || [];

	return createLesson({ ...data, cards, quiz });
};

const archiveLesson = async (id) => {
	const lesson = await getLesson(id);
	return prisma.lesson.update({
		where: { id: lesson.id },
		data: { status: "archived", isPublished: false, archivedAt: new Date() },
		include: lessonInclude,
	});
};

const restoreLesson = async (id) => {
	const lesson = await getLesson(id);
	return prisma.lesson.update({
		where: { id: lesson.id },
		data: { status: "draft", archivedAt: null },
		include: lessonInclude,
	});
};

const publishLesson = async (id) => {
	const lesson = await getLesson(id);
	return prisma.lesson.update({
		where: { id: lesson.id },
		data: { status: "published", isPublished: true, publishedAt: new Date() },
		include: lessonInclude,
	});
};

// ── Cards ────────────────────────────────────────────────────────

const addCard = async (lessonId, cardData) => {
	const lesson = await getLesson(lessonId);
	const maxSort = await prisma.lessonCard.aggregate({
		where: { lessonId: lesson.id },
		_max: { sortOrder: true },
	});
	return prisma.lessonCard.create({
		data: {
			lessonId: lesson.id,
			word: cardData.word,
			translit: cardData.translit || null,
			meaning: cardData.meaning || null,
			emoji: cardData.emoji || null,
			imageUrl: cardData.imageUrl || null,
			sortOrder: cardData.sortOrder ?? (maxSort._max.sortOrder || 0) + 1,
		},
	});
};

const updateCard = async (lessonId, cardId, cardData) => {
	await getLesson(lessonId);
	return prisma.lessonCard.update({
		where: { id: cardId },
		data: {
			word: cardData.word,
			translit: cardData.translit,
			meaning: cardData.meaning,
			emoji: cardData.emoji,
			imageUrl: cardData.imageUrl,
			sortOrder: cardData.sortOrder,
		},
	});
};

const deleteCard = async (lessonId, cardId) => {
	await getLesson(lessonId);
	await prisma.lessonCard.delete({ where: { id: cardId } });
	return { deleted: true };
};

const reorderCards = async (lessonId, items) => {
	await getLesson(lessonId);
	const ops = items.map((item) =>
		prisma.lessonCard.update({
			where: { id: item.id },
			data: { sortOrder: item.sortOrder },
		})
	);
	await prisma.$transaction(ops);
	return { reordered: true };
};

// ── Quiz ─────────────────────────────────────────────────────────

const addQuizQuestion = async (lessonId, qData) => {
	const lesson = await getLesson(lessonId);
	let quiz = lesson.quizzes?.[0];

	if (!quiz) {
		quiz = await prisma.quiz.create({
			data: {
				title: `${lesson.title} Quiz`,
				isPremium: lesson.isPremium,
				isPublished: lesson.isPublished,
				languageId: lesson.languageId,
				levelId: lesson.levelId,
				lessonId: lesson.id,
			},
		});
	}

	return prisma.quizQuestion.create({
		data: {
			quizId: quiz.id,
			type: qData.type || "mcq",
			question: qData.question,
			emoji: qData.emoji || null,
			options: qData.options || null,
			answer: qData.answer,
			hint: qData.hint || null,
			explanation: qData.explanation || null,
			points: qData.points || 1,
			sortOrder: qData.sortOrder || 0,
		},
	});
};

const updateQuizQuestion = async (lessonId, questionId, qData) => {
	await getLesson(lessonId);
	return prisma.quizQuestion.update({
		where: { id: questionId },
		data: {
			question: qData.question,
			emoji: qData.emoji,
			options: qData.options,
			answer: qData.answer,
			hint: qData.hint,
			explanation: qData.explanation,
			points: qData.points,
			sortOrder: qData.sortOrder,
		},
	});
};

const deleteQuizQuestion = async (lessonId, questionId) => {
	await getLesson(lessonId);
	await prisma.quizQuestion.delete({ where: { id: questionId } });
	return { deleted: true };
};

// ── Import ───────────────────────────────────────────────────────

const resolveLanguageAndLevel = async (langCode, levelCode) => {
	const language = await prisma.language.findFirst({
		where: {
			OR: [{ id: langCode }, { code: { equals: langCode, mode: "insensitive" } }, { name: { equals: langCode, mode: "insensitive" } }],
		},
	});
	const level = await prisma.level.findFirst({
		where: {
			OR: [{ id: levelCode }, { code: { equals: levelCode, mode: "insensitive" } }, { name: { equals: levelCode, mode: "insensitive" } }],
		},
	});
	return { language, level };
};

const importFromJson = async (data, userId) => {
	const results = { success: [], errors: [], total: data.lessons.length };

	for (let i = 0; i < data.lessons.length; i++) {
		const item = data.lessons[i];
		try {
			const { language, level } = await resolveLanguageAndLevel(item.language, item.level);
			if (!language) throw new Error(`Language "${item.language}" not found`);
			if (!level) throw new Error(`Level "${item.level}" not found`);

			// Check duplicate lesson code
			if (item.lessonCode) {
				const existing = await prisma.lesson.findUnique({ where: { lessonCode: item.lessonCode } });
				if (existing) throw new Error(`Lesson code "${item.lessonCode}" already exists`);
			}

			const lesson = await createLesson({
				...item,
				languageId: language.id,
				levelId: level.id,
				status: "draft",
			});

			results.success.push({ index: i, lessonCode: item.lessonCode, title: item.title, id: lesson.id });
		} catch (err) {
			results.errors.push({ index: i, lessonCode: item.lessonCode, title: item.title, error: err.message });
		}
	}

	// Audit log
	await prisma.importAuditLog.create({
		data: {
			importType: "json",
			importedBy: userId || "admin",
			totalRecords: results.total,
			successCount: results.success.length,
			failureCount: results.errors.length,
			errors: results.errors.length > 0 ? results.errors : null,
			status: results.errors.length === 0 ? "completed" : results.success.length > 0 ? "partial" : "failed",
		},
	});

	return results;
};

const importFromExcel = async (buffer, userId) => {
	const workbook = XLSX.read(buffer, { type: "buffer" });
	const results = { success: [], errors: [], total: 0 };

	// Parse sheets
	const lessonsSheet = workbook.Sheets["Lessons"] || workbook.Sheets[workbook.SheetNames[0]];
	const cardsSheet = workbook.Sheets["Cards"] || workbook.Sheets[workbook.SheetNames[1]];
	const quizSheet = workbook.Sheets["Quiz"] || workbook.Sheets[workbook.SheetNames[2]];

	const lessonsData = lessonsSheet ? XLSX.utils.sheet_to_json(lessonsSheet) : [];
	const cardsData = cardsSheet ? XLSX.utils.sheet_to_json(cardsSheet) : [];
	const quizData = quizSheet ? XLSX.utils.sheet_to_json(quizSheet) : [];

	results.total = lessonsData.length;

	// Group cards and quiz by lesson_code
	const cardsByCode = {};
	for (const card of cardsData) {
		const code = card.lesson_code || card.lessonCode;
		if (!code) continue;
		if (!cardsByCode[code]) cardsByCode[code] = [];
		cardsByCode[code].push({
			word: String(card.title || card.word || ""),
			translit: card.subtitle || card.translit || null,
			meaning: card.description || card.meaning || null,
			emoji: card.emoji || null,
			imageUrl: card.image_url || card.imageUrl || null,
			sortOrder: parseInt(card.sort_order || card.sortOrder || 0),
		});
	}

	const quizByCode = {};
	for (const q of quizData) {
		const code = q.lesson_code || q.lessonCode;
		if (!code) continue;
		if (!quizByCode[code]) quizByCode[code] = [];
		quizByCode[code].push({
			question: q.question || "",
			options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean),
			answer: q.correct_answer || q.answer || "",
			explanation: q.explanation || null,
			type: "mcq",
		});
	}

	for (let i = 0; i < lessonsData.length; i++) {
		const row = lessonsData[i];
		try {
			const langCode = row.language || row.lang;
			const levelCode = row.level;
			const code = row.lesson_code || row.lessonCode;
			const title = row.lesson_name || row.title || row.name;

			if (!title) throw new Error("Missing lesson name/title");
			if (!langCode) throw new Error("Missing language");
			if (!levelCode) throw new Error("Missing level");

			const { language, level } = await resolveLanguageAndLevel(langCode, levelCode);
			if (!language) throw new Error(`Language "${langCode}" not found`);
			if (!level) throw new Error(`Level "${levelCode}" not found`);

			if (code) {
				const existing = await prisma.lesson.findUnique({ where: { lessonCode: code } });
				if (existing) throw new Error(`Lesson code "${code}" already exists`);
			}

			const lesson = await createLesson({
				lessonCode: code || null,
				title,
				description: row.description || null,
				languageId: language.id,
				levelId: level.id,
				isPremium: String(row.premium).toLowerCase() === "true" || row.premium === true,
				sortOrder: parseInt(row.sort_order || row.sortOrder || 0),
				tags: row.tags ? String(row.tags).split(",").map((t) => t.trim()) : [],
				status: "draft",
				cards: code ? cardsByCode[code] || [] : [],
				quiz: code ? quizByCode[code] || [] : [],
			});

			results.success.push({ index: i, lessonCode: code, title, id: lesson.id });
		} catch (err) {
			results.errors.push({ index: i, title: row.lesson_name || row.title, error: err.message });
		}
	}

	// Audit log
	await prisma.importAuditLog.create({
		data: {
			importType: "excel",
			importedBy: userId || "admin",
			totalRecords: results.total,
			successCount: results.success.length,
			failureCount: results.errors.length,
			errors: results.errors.length > 0 ? results.errors : null,
			status: results.errors.length === 0 ? "completed" : results.success.length > 0 ? "partial" : "failed",
		},
	});

	return results;
};

// ── Export ────────────────────────────────────────────────────────

const exportToJson = async ({ language, level, lessonId } = {}) => {
	const where = { isPublished: undefined };
	if (language) {
		where.language = { OR: [{ id: language }, { code: { equals: language, mode: "insensitive" } }] };
	}
	if (level) {
		where.level = { OR: [{ id: level }, { code: { equals: level, mode: "insensitive" } }] };
	}
	if (lessonId) where.id = lessonId;

	const lessons = await prisma.lesson.findMany({
		where,
		include: lessonInclude,
		orderBy: [{ sortOrder: "asc" }],
	});

	return {
		exportedAt: new Date().toISOString(),
		count: lessons.length,
		lessons: lessons.map((l) => ({
			lessonCode: l.lessonCode,
			title: l.title,
			description: l.description,
			intro: l.intro,
			emoji: l.emoji,
			color: l.color,
			category: l.category,
			tags: l.tags,
			language: l.language?.code,
			level: l.level?.code,
			isPremium: l.isPremium,
			status: l.status,
			sortOrder: l.sortOrder,
			cards: (l.cards || []).map((c) => ({
				title: c.word,
				subtitle: c.translit,
				description: c.meaning,
				emoji: c.emoji,
				image_url: c.imageUrl,
				sort_order: c.sortOrder,
			})),
			quiz: (l.quizzes?.[0]?.questions || []).map((q) => ({
				question: q.question,
				option_a: q.options?.[0] || "",
				option_b: q.options?.[1] || "",
				option_c: q.options?.[2] || "",
				option_d: q.options?.[3] || "",
				correct_answer: q.answer,
				explanation: q.explanation,
			})),
		})),
	};
};

const exportToExcel = async (params = {}) => {
	const data = await exportToJson(params);
	const wb = XLSX.utils.book_new();

	// Lessons sheet
	const lessonsRows = data.lessons.map((l) => ({
		lesson_code: l.lessonCode || "",
		lesson_name: l.title,
		description: l.description || "",
		language: l.language,
		level: l.level,
		premium: l.isPremium,
		published: l.status === "published",
		sort_order: l.sortOrder,
		tags: (l.tags || []).join(", "),
	}));
	XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lessonsRows), "Lessons");

	// Cards sheet
	const cardsRows = [];
	for (const l of data.lessons) {
		for (const c of l.cards || []) {
			cardsRows.push({
				lesson_code: l.lessonCode || "",
				title: c.title,
				subtitle: c.subtitle || "",
				description: c.description || "",
				emoji: c.emoji || "",
				image_url: c.image_url || "",
				sort_order: c.sort_order,
			});
		}
	}
	XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cardsRows), "Cards");

	// Quiz sheet
	const quizRows = [];
	for (const l of data.lessons) {
		for (const q of l.quiz || []) {
			quizRows.push({
				lesson_code: l.lessonCode || "",
				question: q.question,
				option_a: q.option_a,
				option_b: q.option_b,
				option_c: q.option_c,
				option_d: q.option_d,
				correct_answer: q.correct_answer,
				explanation: q.explanation || "",
			});
		}
	}
	XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(quizRows), "Quiz");

	return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
};

const generateExcelTemplate = () => {
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(
		wb,
		XLSX.utils.json_to_sheet([
			{ lesson_code: "ENG-001", lesson_name: "English Alphabets", description: "Learn A-E", language: "en", level: "beginner", premium: false, sort_order: 1, tags: "alphabets,letters" },
		]),
		"Lessons"
	);
	XLSX.utils.book_append_sheet(
		wb,
		XLSX.utils.json_to_sheet([
			{ lesson_code: "ENG-001", title: "A", subtitle: "", description: "Apple", emoji: "🍎", image_url: "", sort_order: 1 },
			{ lesson_code: "ENG-001", title: "B", subtitle: "", description: "Ball", emoji: "⚽", image_url: "", sort_order: 2 },
		]),
		"Cards"
	);
	XLSX.utils.book_append_sheet(
		wb,
		XLSX.utils.json_to_sheet([
			{ lesson_code: "ENG-001", question: "Which letter starts Apple?", option_a: "A", option_b: "B", option_c: "C", option_d: "D", correct_answer: "A", explanation: "Apple starts with A" },
		]),
		"Quiz"
	);
	return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ── Versioning ───────────────────────────────────────────────────

const listVersions = async (lessonId) => {
	const lesson = await getLesson(lessonId);
	return prisma.lessonVersion.findMany({
		where: { lessonId: lesson.id },
		orderBy: { version: "desc" },
		select: { id: true, version: true, changeNote: true, createdBy: true, createdAt: true },
	});
};

const getVersion = async (lessonId, version) => {
	const lesson = await getLesson(lessonId);
	const v = await prisma.lessonVersion.findUnique({
		where: { lessonId_version: { lessonId: lesson.id, version: parseInt(version) } },
	});
	if (!v) {
		const err = new Error("Version not found");
		err.status = 404;
		throw err;
	}
	return v;
};

const restoreVersion = async (lessonId, version, userId) => {
	const v = await getVersion(lessonId, version);
	const snapshot = v.snapshot;

	// Use updateLesson which auto-creates a new version of current state
	return updateLesson(
		lessonId,
		{
			title: snapshot.title,
			description: snapshot.description,
			intro: snapshot.intro,
			emoji: snapshot.emoji,
			color: snapshot.color,
			category: snapshot.category,
			tags: snapshot.tags || [],
			status: "draft",
			isPremium: snapshot.isPremium,
			sortOrder: snapshot.sortOrder,
			languageId: snapshot.languageId,
			levelId: snapshot.levelId,
			cards: (snapshot.cards || []).map((c) => ({
				word: c.word,
				translit: c.translit,
				meaning: c.meaning,
				emoji: c.emoji,
				imageUrl: c.imageUrl,
				sortOrder: c.sortOrder,
			})),
			quiz: (snapshot.quizzes?.[0]?.questions || []).map((q) => ({
				question: q.question,
				type: q.type,
				emoji: q.emoji,
				options: q.options,
				answer: q.answer,
				hint: q.hint,
				explanation: q.explanation,
				points: q.points,
				sortOrder: q.sortOrder,
			})),
			changeNote: `Restored from version ${version}`,
		},
		userId
	);
};

// ── Analytics ────────────────────────────────────────────────────

const getContentAnalytics = async () => {
	const [totalLessons, totalCards, totalQuizQuestions, draftLessons, publishedLessons, archivedLessons, premiumLessons, freeLessons, byLanguage, byLevel] = await Promise.all([
		prisma.lesson.count(),
		prisma.lessonCard.count(),
		prisma.quizQuestion.count(),
		prisma.lesson.count({ where: { status: "draft" } }),
		prisma.lesson.count({ where: { status: "published" } }),
		prisma.lesson.count({ where: { status: "archived" } }),
		prisma.lesson.count({ where: { isPremium: true } }),
		prisma.lesson.count({ where: { isPremium: false } }),
		prisma.language.findMany({
			select: { code: true, name: true, _count: { select: { lessons: true } } },
			orderBy: { sortOrder: "asc" },
		}),
		prisma.level.findMany({
			select: { code: true, name: true, _count: { select: { lessons: true } } },
			orderBy: { sortOrder: "asc" },
		}),
	]);

	return {
		totalLessons,
		totalCards,
		totalQuizQuestions,
		draftLessons,
		publishedLessons,
		archivedLessons,
		premiumLessons,
		freeLessons,
		byLanguage: byLanguage.map((l) => ({ code: l.code, name: l.name, count: l._count.lessons })),
		byLevel: byLevel.map((l) => ({ code: l.code, name: l.name, count: l._count.lessons })),
	};
};

// ── Audit Logs ───────────────────────────────────────────────────

const getImportHistory = async ({ page = 1, limit = 20 } = {}) => {
	const skip = (page - 1) * limit;
	const [logs, total] = await Promise.all([
		prisma.importAuditLog.findMany({
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
		}),
		prisma.importAuditLog.count(),
	]);
	return { logs, total, page, limit };
};

module.exports = {
	listLessons,
	getLesson,
	createLesson,
	updateLesson,
	deleteLesson,
	duplicateLesson,
	archiveLesson,
	restoreLesson,
	publishLesson,
	addCard,
	updateCard,
	deleteCard,
	reorderCards,
	addQuizQuestion,
	updateQuizQuestion,
	deleteQuizQuestion,
	importFromJson,
	importFromExcel,
	exportToJson,
	exportToExcel,
	generateExcelTemplate,
	listVersions,
	getVersion,
	restoreVersion,
	getContentAnalytics,
	getImportHistory,
};
