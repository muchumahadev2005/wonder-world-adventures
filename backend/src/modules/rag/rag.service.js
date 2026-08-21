/**
 * RAG Service — Core orchestrator
 *
 * Flow:
 *   message → Redis cache check → embedding → pgvector search
 *   → context build → OpenRouter LLM → chat history save → response
 *
 * LLM: google/gemini-2.5-flash (fallback: google/gemini-2.5-flash-lite)
 *
 * LLM client, system prompt, and direct LLM calls are shared via llm.service.js.
 * This keeps the RAG pipeline focused on retrieval + augmentation.
 */

const crypto = require("crypto");
const prisma = require("../../prisma/prismaClient");
const { generateEmbedding } = require("./embedding.provider");
const { similaritySearch, buildContext, extractSources } = require("./retrieval.service");
const redis = require("../../utils/redis");
const logger = require("../../utils/logger");
const { getActiveLlm, buildSystemPrompt } = require("../chat/llm.service");
const CACHE_TTL = 86400; // 24 hours
const CACHE_PREFIX = "chat:";

// ── Topic guard — blocked subjects (child safety only) ──────────

const BLOCKED_PATTERNS = [
	/\b(politi|democrat|republican|election|vote|congress|parliament|government policy|liberal|conservative|left.?wing|right.?wing)\b/i,
	/\b(kill|murder|weapon|gun|bomb|terrorist|violen|gore|blood|death|suicide|self.?harm)\b/i,
	/\b(sex|porn|nude|naked|xxx|adult content|nsfw|erotic)\b/i,
	/\b(damn|shit|fuck|bitch|ass\b|bastard|crap|hell\b|dick\b|cock\b)\b/i,
	/\b(drug abuse|cocaine|heroin|meth|weed|marijuana|alcohol|drunk|smoking|vape|vaping)\b/i,
	/\b(gambling|casino|betting|slot machine)\b/i,
	/\b(racist|racism|hate speech|slur|discriminat)\b/i,
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

// ── Direct LLM topic helper — bypasses RAG for jokes, space, math, and general education ─

const isDirectLlmTopic = (message) => {
	const msg = message.toLowerCase();
	
	// Math detection
	if (isMathQuestion(message)) return true;

	// Joke / Riddle detection
	const jokeKeywords = /\b(joke|jokes|riddle|riddles|laugh|funny story)\b/i;
	if (jokeKeywords.test(msg)) return true;

	// Space / Planets / Astronomy detection
	const spaceKeywords = /\b(planet|planets|solar system|sun|moon|stars|space|galaxy|galaxies|earth|gravity|orbit|universe|astronaut|mars|jupiter|saturn|venus|mercury|uranus|neptune|pluto)\b/i;
	if (spaceKeywords.test(msg)) return true;

	// General educational/science question detection (why is the sky blue, how do plants grow, what is water)
	const educationalKeywords = [
		/\b(why|how|what|where|who|when)\b/i,
		/\b(science|nature|plant|plants|animal|animals|water|sky|ocean|oceans|rain|cloud|clouds|weather|wind|dinosaur|dinosaurs|history|earthquake|volcano|volcanoes|human body|brain|heart|cells|oxygen|gas|leaves|birds|fish|trees)\b/i
	];
	const isEducationalPattern = educationalKeywords[0].test(msg) && educationalKeywords[1].test(msg);
	if (isEducationalPattern) return true;

	// Common child education questions
	const commonQuestions = /\b(tell me a fact|fun fact|facts for kids|how does it work)\b/i;
	if (commonQuestions.test(msg)) return true;

	return false;
};


// ── getLlmClient, buildSystemPrompt imported from ../chat/llm.service.js ──────

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
			reply: "I can't help with that topic! Let's talk about something fun and positive instead. Ask me anything — a joke, a fun fact, help with homework, or just say hi! 🌟",
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

	const isDirectLlm = isDirectLlmTopic(trimmedMessage);
	let chunks = [];
	let context = "";
	let sources = [];

	if (!isDirectLlm) {
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
		try {
			chunks = await similaritySearch(queryEmbedding, { topK: 5, threshold: 0.15 });
		} catch (err) {
			logger.warn("[rag] Similarity search failed", { message: err.message });
		}

		const isStoryOrContent = isStoryOrContentQuestion(trimmedMessage);

		if (chunks.length === 0 && !isStoryOrContent) {
			logger.info("[rag] No relevant chunks found — will use LLM general knowledge");
			// Don't return early — let the LLM answer from its general knowledge
		}

		// ── 6. Build context & sources ──────────────────────────────────
		context = chunks.length > 0 ? buildContext(chunks) : "";
		sources = chunks.length > 0 ? extractSources(chunks) : [];
	}

	// ── 7. Call OpenRouter LLM ──────────────────────────────────────
	let reply;
	try {
		const { client, modelName } = await getActiveLlm();
		const systemPrompt = await buildSystemPrompt(context);

		const completion = await client.chat.completions.create({
			model: modelName,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: trimmedMessage },
			],
			max_tokens: 512,
			temperature: 0.4,
		});

		reply = completion.choices?.[0]?.message?.content?.trim();
		if (!reply) throw new Error("Empty LLM response");
	} catch (err) {
		logger.warn("[rag] LLM call failed", { message: err.message });
		reply = "I'm having trouble connecting right now. Please try again in a moment! 🌟";
	}

	// ── 8. Cache the result ─────────────────────────────────────────
	const FAQ_QUESTIONS = [
		"what is the moral of a story in storynest?",
		"what can i learn in storynest lessons?",
		"what games are available in storynest?",
		"can you recommend a story for me?",
		"can you help me with vocabulary words?",
		"give me a learning tip from storynest!"
	];
	const isFaq = FAQ_QUESTIONS.includes(trimmedMessage.toLowerCase());
	const ttl = isFaq ? 2592000 : CACHE_TTL; // 30 days for FAQs, 24 hours for regular queries

	const responsePayload = { reply, sources };
	try {
		if (redis.isAvailable()) {
			await redis.set(cacheKey, JSON.stringify(responsePayload), ttl);
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
