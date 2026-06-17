/**
 * Retrieval Service
 *
 * Performs cosine similarity search against ContentEmbedding table using pgvector.
 * Returns the top-K most relevant chunks above a similarity threshold.
 *
 * Uses prisma.$queryRaw because Prisma does not support the vector type natively.
 */

const prisma = require("../../prisma/prismaClient");
const logger = require("../../utils/logger");

const DEFAULT_TOP_K = 5;
const DEFAULT_THRESHOLD = 0.15; // cosine similarity floor (1 - cosine_distance)

/**
 * Run a similarity search for a query embedding.
 *
 * @param {number[]} queryEmbedding  - 1536-dim float array
 * @param {object}  [opts]
 * @param {number}  [opts.topK=5]           - Max results to return
 * @param {number}  [opts.threshold=0.30]   - Minimum similarity score
 * @returns {Promise<Array<{sourceType, sourceId, title, chunkText, similarity}>>}
 */
const similaritySearch = async (queryEmbedding, { topK = DEFAULT_TOP_K, threshold = DEFAULT_THRESHOLD } = {}) => {
	if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
		throw new Error("Invalid query embedding: must be a non-empty number array");
	}

	// Use $queryRawUnsafe because Prisma tagged templates can struggle with vector casting
	const vectorString = `[${queryEmbedding.join(",")}]`;

	// pgvector: <=> is cosine distance (lower = more similar)
	// 1 - distance = cosine similarity (higher = more similar)
	const results = await prisma.$queryRawUnsafe(`
		SELECT
			id,
			source_type   AS "sourceType",
			source_id     AS "sourceId",
			title,
			chunk_text    AS "chunkText",
			ROUND((1 - (embedding <=> '${vectorString}'::vector))::numeric, 4) AS similarity
		FROM content_embeddings
		WHERE 1 - (embedding <=> '${vectorString}'::vector) >= ${threshold}
		ORDER BY embedding <=> '${vectorString}'::vector
		LIMIT ${topK}
	`);

	logger.info("[retrieval] Search complete", { results: results.length, topK, threshold });
	
	// Log the actual results as requested by user
	results.forEach((row, i) => {
		logger.info(`[retrieval] Match ${i+1}`, {
			similarity: row.similarity,
			title: row.title,
			sourceType: row.sourceType
		});
	});

	return results.map((row) => ({
		sourceType: row.sourceType,
		sourceId: row.sourceId,
		title: row.title,
		chunkText: row.chunkText,
		similarity: parseFloat(row.similarity),
	}));
};

/**
 * Build a clean context string from retrieved chunks, deduplicated by source.
 * @param {Array<{sourceType, sourceId, title, chunkText}>} chunks
 * @returns {string}
 */
const buildContext = (chunks) => {
	if (!chunks || chunks.length === 0) return "";

	// Group chunks by source to avoid repetition
	const bySource = new Map();
	for (const chunk of chunks) {
		const key = `${chunk.sourceType}:${chunk.sourceId}`;
		if (!bySource.has(key)) {
			bySource.set(key, { ...chunk, texts: [chunk.chunkText] });
		} else {
			bySource.get(key).texts.push(chunk.chunkText);
		}
	}

	const sections = [];
	for (const { sourceType, title, texts } of bySource.values()) {
		const typeLabel = sourceType.charAt(0).toUpperCase() + sourceType.slice(1);
		const combined = texts.join("\n\n");
		sections.push(`[${typeLabel}: ${title}]\n${combined}`);
	}

	return sections.join("\n\n---\n\n");
};

/**
 * Extract unique source citations for the API response.
 * @param {Array<{sourceType, sourceId, title}>} chunks
 * @returns {Array<{title, type, sourceId}>}
 */
const extractSources = (chunks) => {
	const seen = new Set();
	const sources = [];
	for (const chunk of chunks) {
		const key = `${chunk.sourceType}:${chunk.sourceId}`;
		if (!seen.has(key)) {
			seen.add(key);
			sources.push({ title: chunk.title, type: chunk.sourceType, sourceId: chunk.sourceId });
		}
	}
	return sources;
};

module.exports = { similaritySearch, buildContext, extractSources };
