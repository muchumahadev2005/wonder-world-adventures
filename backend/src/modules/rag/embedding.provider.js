/**
 * Embedding Provider — OpenRouter (OpenAI-compatible API)
 *
 * Uses the OpenAI SDK pointed at OpenRouter's OpenAI-compatible base URL.
 * Model: text-embedding-3-small → 1536 dimensions
 *
 * This is a single-provider implementation. Do NOT add multi-provider
 * support in Phase 1.
 */

const OpenAI = require("openai");
const logger = require("../../utils/logger");

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

let _client = null;

const getClient = () => {
	if (_client) return _client;

	const apiKey = process.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		throw new Error("OPENROUTER_API_KEY is not set in environment variables");
	}

	_client = new OpenAI({
		apiKey,
		baseURL: "https://openrouter.ai/api/v1",
		defaultHeaders: {
			"HTTP-Referer": "https://wonder-world-adventures.vercel.app",
			"X-Title": "StoryNest AI Buddy",
		},
	});

	return _client;
};

/**
 * Generate a single embedding vector for a text string.
 * @param {string} text
 * @returns {Promise<number[]>} 1536-dimensional vector
 */
const generateEmbedding = async (text) => {
	if (!text || typeof text !== "string" || !text.trim()) {
		throw new Error("Cannot generate embedding for empty text");
	}

	const client = getClient();
	const truncated = text.slice(0, 8000); // stay within token limits

	const response = await client.embeddings.create({
		model: EMBEDDING_MODEL,
		input: truncated,
		dimensions: EMBEDDING_DIMENSIONS,
	});

	const embedding = response.data?.[0]?.embedding;
	if (!embedding || !Array.isArray(embedding)) {
		throw new Error("Invalid embedding response from OpenRouter");
	}

	logger.info("[embedding] Generated", { model: EMBEDDING_MODEL, dims: embedding.length, chars: truncated.length });
	return embedding;
};

/**
 * Generate embeddings for multiple texts in sequence (no rate-limit batching needed for Phase 1).
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
const generateEmbeddingsBatch = async (texts) => {
	const results = [];
	for (const text of texts) {
		const embedding = await generateEmbedding(text);
		results.push(embedding);
	}
	return results;
};

module.exports = {
	generateEmbedding,
	generateEmbeddingsBatch,
	EMBEDDING_DIMENSIONS,
	EMBEDDING_MODEL,
};
