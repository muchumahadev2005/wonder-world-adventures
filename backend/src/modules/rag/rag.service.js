/**
 * RAG Service — Core orchestrator
 *
 * Flow:
 *   message → Redis cache check → embedding → pgvector search
 *   → context build → OpenRouter LLM → chat history save → response
 *
 * LLM: google/gemini-2.0-flash (fallback: google/gemini-flash-1.5)
 */

const crypto = require("crypto");
const OpenAI = require("openai");
const prisma = require("../../prisma/prismaClient");
const { generateEmbedding } = require("./embedding.provider");
const { similaritySearch, buildContext, extractSources } = require("./retrieval.service");
const redis = require("../../utils/redis");
const logger = require("../../utils/logger");

const LLM_MODEL_PRIMARY = "google/gemini-2.5-flash";
const LLM_MODEL_FALLBACK = "google/gemini-2.5-flash-lite";
const CACHE_TTL = 86400; // 24 hours
const CACHE_PREFIX = "chat:";

// ── Topic guard — blocked subjects ───────────────────────────────

const BLOCKED_PATTERNS = [
	/\b(politi|democrat|republican|election|vote|congress|parliament|government policy)\b/i,
	/\b(sport|football|cricket|soccer|basketball|nba|ipl|fifa|tennis|olympics)\b/i,
	/\b(news|headline|breaking|current events|today in|latest update)\b/i,
	/\b(medical|diagnos|symptom|medicine|drug|prescription|disease|treatment|cure|health advice)\b/i,
	/\b(invest|stock|crypto|bitcoin|finance|trading|market|portfolio)\b/i,
	/\b(code|programming|javascript|python|typescript|sql|debug|compiler|algorithm)\b/i,
	/\b(who won|score|match result|standings|league table)\b/i,
];

const isBlockedTopic = (message) => BLOCKED_PATTERNS.some((re) => re.test(message));

// ── OpenRouter LLM client ─────────────────────────────────────────

let _llmClient = null;
const getLlmClient = () => {
	if (_llmClient) return _llmClient;
	const apiKey = process.env.OPENROUTER_API_KEY;
	if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
	_llmClient = new OpenAI({
		apiKey,
		baseURL: "https://openrouter.ai/api/v1",
		defaultHeaders: {
			"HTTP-Referer": "https://wonder-world-adventures.vercel.app",
			"X-Title": "StoryNest AI Buddy",
		},
	});
	return _llmClient;
};

// ── System prompt ─────────────────────────────────────────────────

const buildSystemPrompt = (context) => `
You are StoryNest AI Buddy — a friendly, encouraging educational assistant for children aged 3-12.

STRICT RULES:
1. Answer ONLY using the StoryNest content provided below.
2. NEVER use external knowledge, real-world facts, or information not in the context.
3. If the answer is not in the context, say exactly: "I couldn't find that information in StoryNest content. Try exploring our Stories, Lessons, or Games to learn more! 🌟"
4. Keep responses child-friendly, educational, positive, and age-appropriate.
5. Use simple words. Use emojis where appropriate. Keep answers concise (2-4 sentences).
6. NEVER discuss: politics, sports, news, medical advice, financial advice, coding, or any topic outside StoryNest content.
7. You are NOT ChatGPT, Claude, Gemini, or any general AI. You are StoryNest AI Buddy ONLY.

STORYNEST CONTENT AVAILABLE:
${context || "No relevant content found for this question."}

Remember: If it's not in the content above, you don't know it. Stay in StoryNest world! 🦉
`.trim();

// ── Chat history helpers ──────────────────────────────────────────

const getOrCreateConversation = async (sessionId, userId) => {
	let conversation = await prisma.chatConversation.findFirst({
		where: { sessionId },
		orderBy: { createdAt: "desc" },
	});
	if (!conversation) {
		conversation = await prisma.chatConversation.create({
			data: { sessionId, userId: userId || null },
		});
	}
	return conversation;
};

const saveChatMessages = async (conversationId, userMessage, aiReply, sources) => {
	await prisma.chatMessage.createMany({
		data: [
			{ conversationId, role: "user", content: userMessage, sources: null },
			{ conversationId, role: "assistant", content: aiReply, sources: sources || null },
		],
	});
};

// ── Main RAG function ─────────────────────────────────────────────

/**
 * Process a user question through the full RAG pipeline.
 *
 * @param {object} params
 * @param {string} params.message   - User's question
 * @param {string} params.sessionId - Client session identifier
 * @param {string} [params.userId]  - Optional authenticated user ID
 *
 * @returns {Promise<{reply: string, sources: Array, cached: boolean}>}
 */
const processQuestion = async ({ message, sessionId, userId }) => {
	const startMs = Date.now();

	// ── 1. Input validation ─────────────────────────────────────────
	if (!message || typeof message !== "string" || !message.trim()) {
		return {
			reply: "Please ask me a question! I'm here to help you learn with StoryNest! 🦉",
			sources: [],
			cached: false,
		};
	}
	const trimmedMessage = message.trim().slice(0, 500); // cap input length

	// ── 2. Topic guard ──────────────────────────────────────────────
	if (isBlockedTopic(trimmedMessage)) {
		logger.info("[rag] Blocked topic", { message: trimmedMessage.slice(0, 80) });
		return {
			reply: "That's not something I can help with! I'm StoryNest AI Buddy — I only know about our stories, lessons, and games. Try asking me about a story you've read or a word you learned! 🌟",
			sources: [],
			cached: false,
		};
	}

	// ── 3. Redis cache check ────────────────────────────────────────
	const cacheKey = `${CACHE_PREFIX}${crypto.createHash("sha256").update(trimmedMessage.toLowerCase()).digest("hex")}`;
	const cached = await redis.get(cacheKey);
	if (cached) {
		try {
			const parsed = JSON.parse(cached);
			logger.info("[rag] Cache hit", { key: cacheKey.slice(0, 20) });

			// Still save chat history for cache hits
			const conversation = await getOrCreateConversation(sessionId, userId);
			await saveChatMessages(conversation.id, trimmedMessage, parsed.reply, parsed.sources);

			return { ...parsed, cached: true };
		} catch {
			// Invalid cached value — continue to fresh generation
		}
	}

	// ── 4. Generate query embedding ─────────────────────────────────
	let queryEmbedding;
	try {
		queryEmbedding = await generateEmbedding(trimmedMessage);
	} catch (err) {
		logger.warn("[rag] Embedding generation failed", { message: err.message });
		return {
			reply: "I'm having a little trouble thinking right now! Please try again in a moment. 🦉",
			sources: [],
			cached: false,
		};
	}

	// ── 5. Vector similarity search ─────────────────────────────────
	let chunks = [];
	try {
		chunks = await similaritySearch(queryEmbedding, { topK: 5, threshold: 0.15 });
	} catch (err) {
		logger.warn("[rag] Similarity search failed", { message: err.message });
	}

	if (chunks.length === 0) {
		logger.info("[rag] No relevant chunks found above threshold");
		return {
			reply: "I couldn't find that information in StoryNest content. Try exploring our Stories, Lessons, or Games to learn more! 🌟",
			sources: [],
			cached: false,
		};
	}

	// ── 6. Build context & sources ──────────────────────────────────
	const context = buildContext(chunks);
	const sources = extractSources(chunks);

	// ── 7. Call OpenRouter LLM ──────────────────────────────────────
	let reply;
	try {
		const client = getLlmClient();
		const systemPrompt = buildSystemPrompt(context);

		let completion;
		try {
			completion = await client.chat.completions.create({
				model: LLM_MODEL_PRIMARY,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: trimmedMessage },
				],
				max_tokens: 512,
				temperature: 0.4,
			});
		} catch (primaryErr) {
			logger.warn("[rag] Primary model failed, trying fallback", { error: primaryErr.message });
			completion = await client.chat.completions.create({
				model: LLM_MODEL_FALLBACK,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: trimmedMessage },
				],
				max_tokens: 512,
				temperature: 0.4,
			});
		}

		reply = completion.choices?.[0]?.message?.content?.trim();
		if (!reply) throw new Error("Empty LLM response");
	} catch (err) {
		logger.warn("[rag] LLM call failed", { message: err.message });
		reply = "I'm having trouble connecting right now. Please try again in a moment! 🌟";
	}

	// ── 8. Cache the result ─────────────────────────────────────────
	const responsePayload = { reply, sources };
	try {
		await redis.set(cacheKey, JSON.stringify(responsePayload), CACHE_TTL);
	} catch {
		// Cache failures are non-fatal
	}

	// ── 9. Save chat history ────────────────────────────────────────
	try {
		const conversation = await getOrCreateConversation(sessionId, userId);
		await saveChatMessages(conversation.id, trimmedMessage, reply, sources);
	} catch (err) {
		logger.warn("[rag] Failed to save chat history", { message: err.message });
	}

	const elapsed = Date.now() - startMs;
	logger.info("[rag] Question processed", {
		message: trimmedMessage.slice(0, 60),
		sources: sources.length,
		chunks: chunks.length,
		ms: elapsed,
	});

	return { reply, sources, cached: false };
};

module.exports = { processQuestion };
