/**
 * Embedding Service
 *
 * Responsible for:
 * 1. Fetching content from DB (stories, lessons, games)
 * 2. Chunking content into 500-1000 char pieces with 100-char overlap
 * 3. Generating embeddings via the embedding provider
 * 4. Storing/updating ContentEmbedding records in PostgreSQL
 *
 * Auto-indexing hooks (called from stories/lessons/games services):
 *   - indexContent(sourceType, sourceId)
 *   - deleteEmbeddings(sourceType, sourceId)
 */

const prisma = require("../../prisma/prismaClient");
const { generateEmbedding } = require("./embedding.provider");
const logger = require("../../utils/logger");

const CHUNK_MIN = 500;
const CHUNK_MAX = 1000;
const CHUNK_OVERLAP = 100;

// ── Chunking helpers ──────────────────────────────────────────────

/**
 * Split text into overlapping chunks of 500-1000 characters.
 * Tries to split on paragraph/sentence boundaries before hard-splitting.
 * @param {string} text
 * @returns {string[]}
 */
const chunkText = (text) => {
	if (!text || typeof text !== "string") return [];
	const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
	if (cleaned.length <= CHUNK_MAX) return cleaned.length >= 50 ? [cleaned] : [];

	const chunks = [];
	// Try paragraph-based splitting first
	const paragraphs = cleaned.split(/\n\n+/);
	let current = "";

	for (const para of paragraphs) {
		const candidate = current ? `${current}\n\n${para}` : para;
		if (candidate.length <= CHUNK_MAX) {
			current = candidate;
		} else {
			// Flush current if it meets minimum
			if (current.length >= CHUNK_MIN) {
				chunks.push(current.trim());
				// Start new chunk with overlap from end of last chunk
				const overlapStart = Math.max(0, current.length - CHUNK_OVERLAP);
				current = current.slice(overlapStart) + "\n\n" + para;
			} else if (para.length > CHUNK_MAX) {
				// Para itself is too long — hard split
				if (current) chunks.push(current.trim());
				current = "";
				const words = para.split(" ");
				let segment = "";
				for (const word of words) {
					if ((segment + " " + word).length > CHUNK_MAX) {
						if (segment.length >= CHUNK_MIN) chunks.push(segment.trim());
						const overlap = segment.slice(-CHUNK_OVERLAP);
						segment = overlap + " " + word;
					} else {
						segment = segment ? segment + " " + word : word;
					}
				}
				if (segment.length >= CHUNK_MIN) chunks.push(segment.trim());
			} else {
				current = para;
			}
		}
	}
	if (current.trim().length >= CHUNK_MIN) chunks.push(current.trim());

	return chunks.length > 0 ? chunks : [cleaned.slice(0, CHUNK_MAX)];
};

// ── Content fetchers ──────────────────────────────────────────────

const fetchStoryContent = async (id) => {
	const story = await prisma.story.findUnique({
		where: { id },
		include: { quizzes: { include: { questions: true } } },
	});
	if (!story) return null;

	const parts = [];
	if (story.title) parts.push(`Story: ${story.title}`);
	if (story.author) parts.push(`Author: ${story.author}`);
	if (story.category) parts.push(`Category: ${story.category}`);
	if (story.ageGroup) parts.push(`Age Group: ${story.ageGroup}`);
	if (story.description) parts.push(story.description);
	if (story.content) parts.push(story.content);

	// Add pages if JSON array of strings
	if (Array.isArray(story.pages)) {
		story.pages.forEach((page, i) => {
			if (typeof page === "string") parts.push(`Page ${i + 1}: ${page}`);
			else if (typeof page === "object" && page.text) parts.push(`Page ${i + 1}: ${page.text}`);
		});
	}

	// Enrich with quiz Q&A for semantic coverage
	if (story.quizzes?.length) {
		const quizParts = [];
		story.quizzes.forEach((quiz) => {
			quiz.questions?.forEach((q) => {
				quizParts.push(`Q: ${q.question} A: ${q.answer}`);
				if (q.explanation) quizParts.push(`Explanation: ${q.explanation}`);
			});
		});
		if (quizParts.length) parts.push("Quiz:\n" + quizParts.join("\n"));
	}

	return { title: story.title, fullText: parts.join("\n\n") };
};

const fetchLessonContent = async (id) => {
	const lesson = await prisma.lesson.findUnique({
		where: { id },
		include: {
			cards: { orderBy: { sortOrder: "asc" } },
			quizzes: { include: { questions: true } },
		},
	});
	if (!lesson) return null;

	const parts = [];
	if (lesson.title) parts.push(`Lesson: ${lesson.title}`);
	if (lesson.description) parts.push(lesson.description);
	if (lesson.intro) parts.push(lesson.intro);
	if (lesson.category) parts.push(`Category: ${lesson.category}`);

	if (lesson.cards?.length) {
		const cardParts = lesson.cards.map((c) => {
			const items = [c.word];
			if (c.translit) items.push(`(${c.translit})`);
			if (c.meaning) items.push(`means: ${c.meaning}`);
			return items.join(" ");
		});
		parts.push("Vocabulary:\n" + cardParts.join("\n"));
	}

	if (lesson.quizzes?.length) {
		const quizParts = [];
		lesson.quizzes.forEach((quiz) => {
			quiz.questions?.forEach((q) => {
				quizParts.push(`Q: ${q.question} A: ${q.answer}`);
			});
		});
		if (quizParts.length) parts.push("Practice:\n" + quizParts.join("\n"));
	}

	return { title: lesson.title, fullText: parts.join("\n\n") };
};

const fetchGameContent = async (id) => {
	const game = await prisma.game.findUnique({ where: { id } });
	if (!game) return null;

	const parts = [];
	if (game.title) parts.push(`Game: ${game.title}`);
	if (game.category) parts.push(`Category: ${game.category}`);
	if (game.description) parts.push(game.description);
	if (game.starsReward) parts.push(`Stars Reward: ${game.starsReward}`);

	return { title: game.title, fullText: parts.join("\n\n") };
};

const FETCHERS = {
	story: fetchStoryContent,
	lesson: fetchLessonContent,
	game: fetchGameContent,
};

// ── Core embedding operations ─────────────────────────────────────

/**
 * Delete all existing embeddings for a specific source.
 * @param {string} sourceType story|lesson|game
 * @param {string} sourceId
 */
const deleteEmbeddings = async (sourceType, sourceId) => {
	try {
		const { count } = await prisma.contentEmbedding.deleteMany({
			where: { sourceType, sourceId },
		});
		logger.info("[embedding] Deleted old chunks", { sourceType, sourceId, count });
	} catch (err) {
		logger.warn("[embedding] Failed to delete embeddings", { sourceType, sourceId, message: err.message });
	}
};

/**
 * Index a single piece of content: fetch → chunk → embed → store.
 * Idempotent: deletes old embeddings before creating new ones.
 *
 * @param {string} sourceType story|lesson|game
 * @param {string} sourceId   DB primary key (not slug)
 */
const indexContent = async (sourceType, sourceId) => {
	const fetcher = FETCHERS[sourceType];
	if (!fetcher) {
		logger.warn("[embedding] Unknown source type", { sourceType });
		return;
	}

	try {
		const content = await fetcher(sourceId);
		if (!content) {
			logger.warn("[embedding] Content not found for indexing", { sourceType, sourceId });
			return;
		}

		const { title, fullText } = content;
		if (!fullText || fullText.trim().length < 20) {
			logger.warn("[embedding] Content too short to index", { sourceType, sourceId });
			return;
		}

		const chunks = chunkText(fullText);
		if (!chunks.length) {
			logger.warn("[embedding] No chunks generated", { sourceType, sourceId });
			return;
		}

		logger.info("[embedding] Indexing", { sourceType, sourceId, title, chunks: chunks.length });

		// Delete old embeddings first (idempotent re-index)
		await deleteEmbeddings(sourceType, sourceId);

		// Generate and store each chunk
		for (let i = 0; i < chunks.length; i++) {
			const chunk = chunks[i];
			const embedding = await generateEmbedding(`${title}: ${chunk}`);
			const vectorString = `[${embedding.join(",")}]`;

			// Use $executeRaw because Prisma doesn't support vector type natively
			await prisma.$executeRaw`
				INSERT INTO content_embeddings (id, source_type, source_id, title, chunk_text, embedding, created_at, updated_at)
				VALUES (
					gen_random_uuid()::text,
					${sourceType},
					${sourceId},
					${title},
					${chunk},
					${vectorString}::vector,
					NOW(),
					NOW()
				)
			`;

			logger.info("[embedding] Stored chunk", { sourceType, sourceId, chunk: i + 1, total: chunks.length });
		}

		logger.info("[embedding] Indexing complete", { sourceType, sourceId, title, totalChunks: chunks.length });
	} catch (err) {
		// Non-blocking — log but don't throw. Content saves must not fail due to embedding errors.
		logger.warn("[embedding] Indexing failed", { sourceType, sourceId, message: err.message });
	}
};

/**
 * Async wrapper — fire-and-forget indexing that never blocks the calling service.
 * @param {string} sourceType
 * @param {string} sourceId
 */
const indexContentAsync = (sourceType, sourceId) => {
	setImmediate(() => {
		indexContent(sourceType, sourceId).catch((err) => {
			logger.warn("[embedding] Background indexing error", { sourceType, sourceId, message: err.message });
		});
	});
};

module.exports = {
	indexContent,
	indexContentAsync,
	deleteEmbeddings,
	chunkText,
};
