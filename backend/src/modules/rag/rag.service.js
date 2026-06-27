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

// ── Math helper — basic mathematics detection ─────────────────────

const isMathQuestion = (message) => {
	const msg = message.toLowerCase();
	const hasDigits = /\d+/.test(msg);
	
	// Check for standard arithmetic expressions (e.g., "2 + 2", "5 * 5", etc.)
	const mathEquationPattern = /[\d]+[\s]*[+\-*\/=÷×][\s]*[\d]+/i;
	
	const mathKeywords = [
		/\b(plus|minus|times|divided by|add|subtract|multiply|divide|sum|difference|product|quotient|equals?|solve|math|mathematics|arithmetic|count|counting)\b/i,
		/\bhow (many|much)\b/i,
		/\bwhat is\b/i,
		/\bcalculate\b/i
	];

	const isMath = mathEquationPattern.test(msg) || (hasDigits && mathKeywords.some((re) => re.test(msg)));
	const isPureMath = /^[0-9+\-*/().\s=x÷×?]+$/.test(msg.trim()) && /[0-9]/.test(msg);
	
	return isMath || isPureMath;
};

// ── Content helper — story or educational content detection ───────

const isStoryOrContentQuestion = (message) => {
	const msg = message.toLowerCase();
	return /\b(story|stories|moral|character|characters|lesson|lessons|game|games|book|books|read|plot|explain|tales?|author)\b/i.test(msg);
};


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
1. Answer basic mathematics questions (such as addition, subtraction, multiplication, division, simple equations, counting, or basic math word problems) directly using your knowledge. Keep math explanations extremely simple, clear, and encouraging for young kids.
2. For questions about StoryNest stories, lessons, or games, first review the provided StoryNest content below to see the context. You are explicitly allowed and encouraged to use your external knowledge (outside of the RAG context) to explain the story in detail, describe characters, elaborate on plots, teach related morals/concepts, or answer follow-up questions in a creative, kid-friendly way.
3. For any other questions unrelated to math or StoryNest stories/lessons/games, say exactly: "I couldn't find that information in StoryNest content. Try exploring our Stories, Lessons, or Games to learn more! 🌟"
4. Keep responses child-friendly, educational, positive, and age-appropriate.
5. Use simple words. Use emojis where appropriate. Keep answers concise (2-4 sentences).
6. NEVER discuss: politics, sports, news, medical advice, financial advice, coding, or any topic outside StoryNest content/basic math.
7. You are NOT ChatGPT, Claude, Gemini, or any general AI. You are StoryNest AI Buddy ONLY.

STORYNEST CONTENT AVAILABLE:
${context || "No relevant content found for this question."}

Remember: Stay in StoryNest world! If it's not a basic math question, related to StoryNest content, or in the context above, you don't know it. 🦉
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

	// ── 2.5 Premium and Daily limit checks ──────────────────────────
	let isPremium = false;
	if (userId) {
		const activeSub = await prisma.userSubscription.findFirst({
			where: {
				userId,
				status: "ACTIVE",
				endDate: { gt: new Date() },
			},
		});
		if (activeSub) {
			isPremium = true;
		}
	}

	if (!isPremium) {
		const dateStr = new Date().toISOString().split("T")[0];
		const limitKey = userId
			? `chat:limit:user:${userId}:${dateStr}`
			: `chat:limit:session:${sessionId}:${dateStr}`;

		// Get current usage count
		let count = 0;
		if (redis.isAvailable()) {
			const val = await redis.get(limitKey);
			count = val ? parseInt(val, 10) : 0;
		} else {
			// Fallback to local memory store
			if (!global.localLimitStore) {
				global.localLimitStore = new Map();
			}
			count = global.localLimitStore.get(limitKey) || 0;
		}

		if (count >= 10) {
			const limitError = new Error("You've used all 10 daily prompts. Please upgrade to StoryNest Premium to get unlimited questions! 🦉");
			limitError.status = 403;
			limitError.code = "PREMIUM_REQUIRED";
			throw limitError;
		}

		// Increment usage
		const nextCount = count + 1;
		if (redis.isAvailable()) {
			await redis.set(limitKey, String(nextCount), 86400); // 24 hours TTL
		} else {
			global.localLimitStore.set(limitKey, nextCount);
			// Occasional cleanup of old keys to prevent memory leaks
			if (global.localLimitStore.size > 1000) {
				for (const k of global.localLimitStore.keys()) {
					if (!k.includes(dateStr)) {
						global.localLimitStore.delete(k);
					}
				}
			}
		}
	}

	// ── 3. Redis cache check ────────────────────────────────────────
	const cacheKey = `${CACHE_PREFIX}${crypto.createHash("sha256").update(trimmedMessage.toLowerCase()).digest("hex")}`;
	let cached = null;
	if (redis.isAvailable()) {
		cached = await redis.get(cacheKey);
	} else {
		if (!global.localCacheStore) {
			global.localCacheStore = new Map();
		}
		cached = global.localCacheStore.get(cacheKey) || null;
	}

	if (cached) {
		try {
			const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
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

	const isMath = isMathQuestion(trimmedMessage);
	const isStoryOrContent = isStoryOrContentQuestion(trimmedMessage);

	if (chunks.length === 0 && !isMath && !isStoryOrContent) {
		logger.info("[rag] No relevant chunks found above threshold");
		return {
			reply: "I couldn't find that information in StoryNest content. Try exploring our Stories, Lessons, or Games to learn more! 🌟",
			sources: [],
			cached: false,
		};
	}

	// ── 6. Build context & sources ──────────────────────────────────
	const context = chunks.length > 0 ? buildContext(chunks) : "";
	const sources = chunks.length > 0 ? extractSources(chunks) : [];

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
		if (redis.isAvailable()) {
			await redis.set(cacheKey, JSON.stringify(responsePayload), CACHE_TTL);
		} else {
			if (!global.localCacheStore) {
				global.localCacheStore = new Map();
			}
			global.localCacheStore.set(cacheKey, responsePayload);
			// Prune oldest keys if map grows too large
			if (global.localCacheStore.size > 2000) {
				const keys = Array.from(global.localCacheStore.keys());
				for (let i = 0; i < 500; i++) {
					global.localCacheStore.delete(keys[i]);
				}
			}
		}
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
