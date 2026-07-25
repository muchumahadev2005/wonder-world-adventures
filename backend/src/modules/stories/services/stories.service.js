const XLSX = require("xlsx");
const prisma = require("../../../prisma/prismaClient");
const repository = require("../repositories/stories.repository");
const { indexContentAsync, deleteEmbeddings } = require("../../rag/embedding.service");
const {
	STORY_CATEGORIES,
	STORY_AGE_GROUPS,
	STORY_DIFFICULTIES,
	normalizeAgeGroup,
} = require("../validators/stories.validation");

// ── Helpers ───────────────────────────────────────────────────────

const slugify = (value) =>
	String(value || "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 100);

const parseBool = (v, fallback = false) => {
	if (typeof v === "boolean") return v;
	if (v === undefined || v === null) return fallback;
	const s = String(v).trim().toLowerCase();
	if (s === "true" || s === "1" || s === "yes" || s === "y" || s === "true") return true;
	if (s === "false" || s === "0" || s === "no" || s === "n" || s === "false") return false;
	return fallback;
};

const parseTags = (v) => {
	if (!v) return [];
	if (Array.isArray(v)) return v.map(String).filter(Boolean);
	return String(v).split(",").map((t) => t.trim()).filter(Boolean);
};

const getVal = (row, possibleKeys) => {
	for (const k of Object.keys(row)) {
		const cleanK = k.trim().toLowerCase().replace(/[\s_-]+/g, "");
		for (const pk of possibleKeys) {
			const cleanPk = pk.toLowerCase().replace(/[\s_-]+/g, "");
			if (cleanK === cleanPk) {
				return row[k];
			}
		}
	}
	return undefined;
};

const normalizeRow = (row) => {
	const get = (keys, fallback = "") => {
		const val = getVal(row, keys);
		return val !== undefined && val !== null ? val : fallback;
	};

	return {
		title:            String(get(["title"])).trim(),
		subtitle:         String(get(["subtitle"])).trim(),
		description:      String(get(["description", "desc"])).trim(),
		content:          String(get(["content"])).trim(),
		author:           String(get(["author"])).trim(),
		category:         String(get(["category"])).trim(),
		language:         String(get(["language", "lang", "languageCode", "language_code"])).trim(),
		ageGroup:         String(get(["ageGroup", "age_group", "age group"])).trim(),
		difficulty:       String(get(["difficulty", "diff"])).trim(),
		readingTime:      get(["readingTime", "reading_time", "reading time"], null),
		listeningTime:    get(["listeningTime", "listening_time", "listening time"], null),
		premium:          get(["premium", "isPremium", "is_premium", "is premium"], false),
		published:        get(["published", "isPublished", "is_published", "is published"], false),
		featured:         get(["featured", "isFeatured", "is_featured", "is featured"], false),
		trending:         get(["trending", "isTrending", "is_trending", "is trending"], false),
		recommended:      get(["recommended", "isRecommended", "is_recommended", "is recommended"], false),
		readAloudEnabled: get(["readAloudEnabled", "read_aloud_enabled", "read_aloud", "read aloud"], false),
		narratorVoice:    String(get(["narratorVoice", "narrator_voice", "narrator voice"])).trim(),
		xpReward:         get(["xpReward", "xp_reward", "xp reward"], 0),
		starsReward:      get(["starsReward", "stars_reward", "stars reward", "starReward", "star_reward", "star reward"], 0),
		tags:             String(get(["tags"])).trim(),
		coverImageUrl:    String(get(["coverImageUrl", "cover_image_url", "cover image url", "coverImage", "cover_image", "cover image"])).trim(),
		thumbnailUrl:     String(get(["thumbnailUrl", "thumbnail_url", "thumbnail url", "thumbnail"])).trim(),
		backgroundUrl:    String(get(["backgroundUrl", "background_url", "background url"])).trim(),
	};
};

// ── Normalise ─────────────────────────────────────────────────────

const normalizeStory = (story) => ({
	id:              story.slug || story.id,
	storyId:         story.id,
	slug:            story.slug,
	title:           story.title,
	subtitle:        story.subtitle || null,
	description:     story.description,
	content:         story.content,
	pages:           story.pages || undefined,
	author:          story.author,
	category:        story.category,
	ageGroup:        story.ageGroup,
	difficulty:      story.difficulty || null,
	tags:            story.tags || [],
	coverImage:      story.coverImage || null,
	thumbnailUrl:    story.thumbnailUrl || null,
	backgroundUrl:   story.backgroundUrl || null,
	thumbnail:       story.thumbnail,
	coverEmoji:      story.coverEmoji,
	coverGradient:   story.coverGradient,
	readingTime:     story.readingTime,
	listeningTime:   story.listeningTime || null,
	duration:        story.duration,
	isPremium:       story.isPremium,
	premium:         story.isPremium,
	isPublished:     story.isPublished,
	isFeatured:      story.isFeatured ?? false,
	isTrending:      story.isTrending ?? false,
	isRecommended:   story.isRecommended ?? false,
	readAloudEnabled:story.readAloudEnabled ?? false,
	narratorVoice:   story.narratorVoice || null,
	audioUrl:        story.audioUrl,
	xpReward:        story.xpReward ?? 0,
	starsReward:     story.starsReward,
	stars:           story.starsReward,
	likesCount:      story.likesCount ?? 0,
	readsCount:      story.readsCount ?? 0,
	favoritesCount:  story.favoritesCount ?? 0,
	sortOrder:       story.sortOrder,
	createdAt:       story.createdAt,
	updatedAt:       story.updatedAt,
	language:        story.language
		? {
				id:     story.language.id,
				code:   story.language.code,
				name:   story.language.name,
				native: story.language.native,
		  }
		: null,
	quiz:    story.quizzes?.[0] ? normalizeQuiz(story.quizzes[0]).questions : [],
	quizzes: (story.quizzes || []).map(normalizeQuiz),
});

const normalizeQuiz = (quiz) => ({
	id:          quiz.id,
	title:       quiz.title,
	description: quiz.description,
	isPremium:   quiz.isPremium,
	questions:   (quiz.questions || []).map((q) => ({
		id:      q.id,
		type:    q.type,
		question:q.question,
		emoji:   q.emoji,
		options: q.options || undefined,
		answer:  q.answer,
		hint:    q.hint || undefined,
		points:  q.points,
	})),
});

// ── Input normalisation ───────────────────────────────────────────

const normalizeStoryData = async (input, { partial = false } = {}) => {
	const language = await repository.findLanguage({
		languageId:   input.languageId,
		languageCode: input.languageCode,
	});

	const data = { ...input };

	// Auto-generate slug from title if not provided
	if (input.slug || (!partial && input.title)) {
		data.slug = input.slug || slugify(input.title);
	}

	if (input.pages) data.pages = input.pages;
	if (!partial) {
		data.starsReward     = input.starsReward ?? 0;
		data.xpReward        = input.xpReward ?? 0;
		data.isPremium       = input.isPremium ?? false;
		data.isPublished     = input.isPublished ?? false;
		data.isFeatured      = input.isFeatured ?? false;
		data.isTrending      = input.isTrending ?? false;
		data.isRecommended   = input.isRecommended ?? false;
		data.readAloudEnabled= input.readAloudEnabled ?? false;
		data.likesCount      = input.likesCount ?? 0;
		data.readsCount      = input.readsCount ?? 0;
		data.favoritesCount  = input.favoritesCount ?? 0;
		data.sortOrder       = input.sortOrder ?? 0;
	}

	// Clean derived/join fields
	delete data.languageCode;
	delete data.languageId;

	if (language) {
		data.language = { connect: { id: language.id } };
	}

	return data;
};

// ── CRUD ──────────────────────────────────────────────────────────

const listStories = async (query) => {
	const stories = await repository.list({
		...query,
		language: query.language || query.languageId,
	});
	return stories.map(normalizeStory);
};

const getStory = async (id) => {
	const story = await repository.findByIdOrSlug(id);
	if (!story) {
		const error = new Error("Story not found");
		error.status = 404;
		throw error;
	}
	return normalizeStory(story);
};

const listByCategory = async (category) => {
	const stories = await repository.listByCategory(category);
	return stories.map(normalizeStory);
};

const recommended = async () => {
	const stories = await repository.recommended();
	return stories.map(normalizeStory);
};

const createStory = async (body) => {
	const data = await normalizeStoryData(body);
	const story = await repository.create(data);
	indexContentAsync("story", story.id);
	return normalizeStory(story);
};

const updateStory = async (idOrSlug, body) => {
	const existing = await repository.findByIdOrSlug(idOrSlug);
	if (!existing) {
		const error = new Error("Story not found");
		error.status = 404;
		throw error;
	}
	const data = await normalizeStoryData(body, { partial: true });
	if (!body.slug) delete data.slug;
	const story = await repository.update(existing.id, data);
	indexContentAsync("story", story.id);
	return normalizeStory(story);
};

const deleteStory = async (idOrSlug) => {
	const existing = await repository.findByIdOrSlug(idOrSlug);
	if (!existing) {
		const error = new Error("Story not found");
		error.status = 404;
		throw error;
	}
	await repository.remove(existing.id);
	setImmediate(() => deleteEmbeddings("story", existing.id));
	return { id: existing.id };
};

// ── Duplicate ─────────────────────────────────────────────────────

const duplicateStory = async (idOrSlug) => {
	const existing = await repository.findByIdOrSlug(idOrSlug);
	if (!existing) {
		const error = new Error("Story not found");
		error.status = 404;
		throw error;
	}

	const baseTitle = `${existing.title} - Copy`;
	// Make slug unique by appending a timestamp
	const newSlug = slugify(`${existing.slug}-copy-${Date.now()}`);

	const {
		id, slug, createdAt, updatedAt, quizzes, progress, language,
		languageId, ...rest
	} = existing;

	const story = await repository.create({
		...rest,
		title:      baseTitle,
		slug:       newSlug,
		isPublished:false,
		isFeatured: false,
		isTrending: false,
		readsCount:  0,
		likesCount:  0,
		favoritesCount: 0,
		...(languageId ? { language: { connect: { id: languageId } } } : {}),
	});

	indexContentAsync("story", story.id);
	return normalizeStory(story);
};

// ── Excel Template ────────────────────────────────────────────────

const generateExcelTemplate = () => {
	const wb = XLSX.utils.book_new();
	const sample = [
		{
			title:           "Sample Story Title",
			subtitle:        "An optional subtitle",
			description:     "Short description visible on the story card.",
			content:         "Once upon a time, in a land far away...",
			author:          "Author Name",
			category:        "Adventure",         // Animal|Moral|Adventure|Fantasy|Science|Space|Nature|History|Friendship|Family|Festival|Bedtime|Educational
			language:        "en",                // language code e.g. en, hi
			age_group:       "6-8",               // 3-5 | 6-8 | 9-12
			difficulty:      "Beginner",          // Beginner | Intermediate | Advanced
			reading_time:    5,                   // minutes >= 0
			listening_time:  7,                   // minutes >= 0
			premium:         false,               // true | false
			published:       false,               // true | false
			featured:        false,               // true | false
			trending:        false,               // true | false
			recommended:     false,               // true | false
			read_aloud:      false,               // true | false
			narrator_voice:  "",                  // optional voice name
			xp_reward:       10,                  // >= 0
			star_reward:     2,                   // >= 0
			tags:            "adventure,animals", // comma-separated
			cover_image_url: "https://example.com/cover.jpg",
			thumbnail_url:   "https://example.com/thumbnail.jpg",
			background_url:  "https://example.com/background.jpg",
		},
	];
	XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sample), "Stories");
	return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ── Excel Export ──────────────────────────────────────────────────

const exportToExcel = async (filters = {}) => {
	const stories = await prisma.story.findMany({
		where: buildExportWhere(filters),
		include: { language: true },
		orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
	});

	const rows = stories.map((s) => ({
		title:           s.title,
		subtitle:        s.subtitle || "",
		description:     s.description || "",
		content:         s.content,
		author:          s.author || "",
		category:        s.category || "",
		language:        s.language?.code || "",
		age_group:       s.ageGroup || "",
		difficulty:      s.difficulty || "",
		reading_time:    s.readingTime ?? "",
		listening_time:  s.listeningTime ?? "",
		premium:         s.isPremium,
		published:       s.isPublished,
		featured:        s.isFeatured ?? false,
		trending:        s.isTrending ?? false,
		recommended:     s.isRecommended ?? false,
		read_aloud:      s.readAloudEnabled ?? false,
		narrator_voice:  s.narratorVoice || "",
		xp_reward:       s.xpReward ?? 0,
		star_reward:     s.starsReward,
		tags:            (s.tags || []).join(", "),
		cover_image_url: s.coverImage || s.thumbnail || "",
		thumbnail_url:   s.thumbnailUrl || "",
		background_url:  s.backgroundUrl || "",
	}));

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Stories");
	return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
};

const buildExportWhere = (filters) => {
	const where = {};
	if (filters.category) where.category = filters.category;
	if (filters.language) {
		where.language = {
			OR: [
				{ id: filters.language },
				{ code: { equals: filters.language, mode: "insensitive" } },
			],
		};
	}
	if (typeof filters.isPremium === "boolean") where.isPremium = filters.isPremium;
	if (typeof filters.isPublished === "boolean") where.isPublished = filters.isPublished;
	return where;
};

// ── Excel Import ──────────────────────────────────────────────────

const importFromExcel = async (buffer, userId) => {
	const workbook   = XLSX.read(buffer, { type: "buffer" });
	const sheet      = workbook.Sheets["Stories"] || workbook.Sheets[workbook.SheetNames[0]];
	const rows       = sheet ? XLSX.utils.sheet_to_json(sheet) : [];
	const results    = { success: [], errors: [], total: rows.length };

	if (rows.length === 0) {
		results.errors.push({ index: 0, error: "The spreadsheet contains no rows." });
		return results;
	}

	// ── Phase 1: validate ALL rows before inserting any ───────────
	const validatedRows = [];

	for (let i = 0; i < rows.length; i++) {
		const rawRow   = rows[i];
		const row      = normalizeRow(rawRow);
		const rowNum   = i + 2; // Excel row number (header = 1)
		const rowErrors= [];

		const title   = row.title;
		const content = row.content;
		const langCode= row.language;
		const category= row.category;
		const ageGroup= normalizeAgeGroup(row.ageGroup);
		const difficulty = row.difficulty;
		const readingTime  = row.readingTime  != null && row.readingTime  !== "" ? Number(row.readingTime)  : undefined;
		const listeningTime= row.listeningTime!= null && row.listeningTime !== "" ? Number(row.listeningTime): undefined;
		const xpReward     = row.xpReward     != null && row.xpReward     !== "" ? Number(row.xpReward)     : 0;
		const starsReward  = row.starsReward  != null && row.starsReward  !== "" ? Number(row.starsReward)  : 0;

		if (!title)   rowErrors.push("Title is required");
		if (!content) rowErrors.push("Content is required");
		if (category  && !STORY_CATEGORIES.includes(category))  rowErrors.push(`Invalid category: ${category}`);
		if (ageGroup  && !STORY_AGE_GROUPS.includes(ageGroup))  rowErrors.push(`Invalid age group: ${ageGroup}`);
		if (difficulty && !STORY_DIFFICULTIES.includes(difficulty)) rowErrors.push(`Invalid difficulty: ${difficulty}`);
		if (readingTime   != null && readingTime   < 0) rowErrors.push("Reading time must be >= 0");
		if (listeningTime != null && listeningTime < 0) rowErrors.push("Listening time must be >= 0");
		if (xpReward    < 0) rowErrors.push("XP reward must be >= 0");
		if (starsReward < 0) rowErrors.push("Star reward must be >= 0");

		// Duplicate check within the file
		if (title && validatedRows.some((r) => r.title === title)) {
			rowErrors.push(`Duplicate title in sheet: "${title}"`);
		}

		if (rowErrors.length > 0) {
			results.errors.push({ index: i, rowNum, title: title || `Row ${rowNum}`, errors: rowErrors });
			continue;
		}

		// Resolve language
		let language = null;
		if (langCode) {
			language = await prisma.language.findFirst({
				where: {
					OR: [
						{ id: langCode },
						{ code: { equals: langCode, mode: "insensitive" } },
						{ name: { equals: langCode, mode: "insensitive" } },
					],
				},
			});
			if (!language) {
				results.errors.push({ index: i, rowNum, title, errors: [`Language not found: "${langCode}"`] });
				continue;
			}
		}

		// Duplicate check in DB
		const existingByTitle = await prisma.story.findFirst({ where: { title } });
		if (existingByTitle) {
			results.errors.push({ index: i, rowNum, title, errors: [`A story with title "${title}" already exists`] });
			continue;
		}

		const slug = slugify(title);
		const existingBySlug = await prisma.story.findUnique({ where: { slug } });
		if (existingBySlug) {
			results.errors.push({ index: i, rowNum, title, errors: [`Slug "${slug}" already exists`] });
			continue;
		}

		validatedRows.push({
			_index: i,
			_rowNum: rowNum,
			slug,
			title,
			subtitle:        row.subtitle || null,
			description:     row.description || null,
			content,
			author:          row.author || null,
			category:        category || null,
			ageGroup:        ageGroup || null,
			difficulty:      difficulty || null,
			tags:            parseTags(row.tags),
			coverImage:      row.coverImageUrl || null,
			thumbnailUrl:    row.thumbnailUrl || null,
			backgroundUrl:   row.backgroundUrl || null,
			readingTime:     readingTime ?? null,
			listeningTime:   listeningTime ?? null,
			isPremium:       parseBool(row.premium),
			isPublished:     parseBool(row.published),
			isFeatured:      parseBool(row.featured),
			isTrending:      parseBool(row.trending),
			isRecommended:   parseBool(row.recommended),
			readAloudEnabled:parseBool(row.readAloudEnabled),
			narratorVoice:   row.narratorVoice || null,
			xpReward:        xpReward,
			starsReward:     starsReward,
			sortOrder:       0,
			...(language ? { languageId: language.id } : {}),
		});
	}

	// If any validation errors, abort — do not partially import
	if (results.errors.length > 0) {
		return results;
	}

	// ── Phase 2: insert all rows in a single transaction ──────────
	try {
		const created = await prisma.$transaction(
			validatedRows.map((row) => {
				const { _index, _rowNum, languageId, ...data } = row;
				return prisma.story.create({
					data: {
						...data,
						...(languageId ? { language: { connect: { id: languageId } } } : {}),
					},
					include: { language: true },
				});
			})
		);

		for (const story of created) {
			results.success.push({ id: story.id, title: story.title, slug: story.slug });
			// Fire-and-forget embeddings
			indexContentAsync("story", story.id);
		}
	} catch (err) {
		results.errors.push({ index: -1, error: `Transaction failed: ${err.message}` });
	}

	// ── Audit log ─────────────────────────────────────────────────
	await prisma.importAuditLog.create({
		data: {
			importType:   "stories-excel",
			importedBy:   userId || "admin",
			totalRecords: results.total,
			successCount: results.success.length,
			failureCount: results.errors.length,
			errors:       results.errors.length > 0 ? results.errors : null,
			status:
				results.errors.length === 0
					? "completed"
					: results.success.length > 0
					? "partial"
					: "failed",
		},
	});

	return results;
};

// ── Exports ───────────────────────────────────────────────────────

module.exports = {
	listStories,
	getStory,
	listByCategory,
	recommended,
	createStory,
	updateStory,
	deleteStory,
	duplicateStory,
	importFromExcel,
	exportToExcel,
	generateExcelTemplate,
	normalizeStory,
};
