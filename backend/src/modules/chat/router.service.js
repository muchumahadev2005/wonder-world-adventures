/**
 * router.service.js — AI Request Router
 *
 * Classifies every user message into one of:
 *   storynest  — StoryNest-specific question → RAG pipeline
 *   general    — Safe educational/general question → direct LLM
 *
 * The classifier uses a single lightweight LLM call (max_tokens: 5,
 * temperature: 0) making it deterministic and cheap. Fallback on
 * classifier failure: "storynest" (safer for a children's platform).
 *
 * EXTENSIBILITY:
 *   To add a new route (e.g. "quiz-mode"):
 *     1. Add the label + description to CLASSIFIER_SYSTEM_PROMPT
 *     2. Add a new branch in routeMessage()
 *   No controller or frontend changes needed.
 */

const logger        = require("../../utils/logger");
const { getLlmClient } = require("./llm.service");
const { callDirectLlm } = require("./llm.service");
const ragService    = require("../rag/rag.service");

// ── Classifier constants ──────────────────────────────────────────

const CLASSIFIER_MODEL = "google/gemini-2.5-flash-lite"; // cheap + fast

const CLASSIFIER_SYSTEM_PROMPT = `
You are an intent classifier for StoryNest, a children's educational platform.

Classify the user's message into EXACTLY one of the following labels:

  storynest — The user is asking about StoryNest content, features, or personal data, including:
              stories, lessons, games, quizzes, rewards, XP, stars, badges, streaks,
              learning path, child profile, parent controls, reading progress, game progress,
              learning analytics, story recommendations, subscriptions, premium features,
              or anything else that is specific to the StoryNest app.

  general   — Any other question: general education, science, math, history, geography,
              nature, space, jokes, riddles, fun facts, homework help, creative writing,
              sports, greetings, small talk, or anything a child might ask that is NOT
              specifically about StoryNest.

Rules:
- Reply with ONLY the single word: storynest  OR  general
- No punctuation. No explanation. One word only.
- When uncertain, prefer: storynest
`.trim();

// ── Intent classifier ─────────────────────────────────────────────

/**
 * Classify a user message into a routing intent.
 *
 * @param {string} message
 * @returns {Promise<"storynest"|"general">}
 */
const classifyIntent = async (message) => {
	try {
		const client = getLlmClient();
		const completion = await client.chat.completions.create({
			model: CLASSIFIER_MODEL,
			messages: [
				{ role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
				{ role: "user",   content: message.slice(0, 500) }, // cap for safety
			],
			max_tokens:  5,
			temperature: 0,
		});

		const raw = (completion.choices?.[0]?.message?.content || "").trim().toLowerCase();

		// Accept partial matches in case model adds punctuation
		if (raw.startsWith("general"))   return "general";
		if (raw.startsWith("storynest")) return "storynest";

		logger.warn("[router] Unexpected classifier output — defaulting to storynest", { raw });
		return "storynest"; // safe fallback
	} catch (err) {
		logger.warn("[router] Classifier call failed — defaulting to storynest", { error: err.message });
		return "storynest"; // safe fallback on any error
	}
};

// ── Dispatcher ────────────────────────────────────────────────────

/**
 * Route a user message to the correct AI handler and return a unified reply.
 *
 * Both paths return { reply, sources, cached }.
 * The "route" field is added for internal observability only —
 * it is stored in message metadata but never sent to the frontend.
 *
 * @param {string} message
 * @param {string} sessionId - Required by RAG pipeline for conversation context
 * @param {string|null} userId
 * @returns {Promise<{reply: string, sources: Array, cached: boolean, route: string}>}
 */
const routeMessage = async (message, sessionId, userId) => {
	const startMs = Date.now();
	const intent  = await classifyIntent(message);

	logger.info("[router] Intent classified", {
		intent,
		message: message.slice(0, 60),
		ms: Date.now() - startMs,
	});

	let result;

	if (intent === "storynest") {
		// Full RAG pipeline — retrieval, augmentation, LLM
		result = await ragService.processQuestion({ message, sessionId, userId });
	} else {
		// Direct LLM — no RAG overhead
		result = await callDirectLlm({ message, userId });
	}

	return { ...result, route: intent };
};

module.exports = {
	classifyIntent,
	routeMessage,
};
