/**
 * llm.service.js — Shared LLM utilities
 *
 * Extracted from rag.service.js so that:
 *   - rag.service.js can import getLlmClient + buildSystemPrompt (no behaviour change)
 *   - router.service.js can call callDirectLlm() for non-StoryNest questions
 *   - chat.service.js can use the same client for the intent classifier
 *
 * Nothing in this file touches the database.
 */

const OpenAI = require("openai");
const logger = require("../../utils/logger");

const LLM_MODEL_PRIMARY  = "google/gemini-2.5-flash";
const LLM_MODEL_FALLBACK = "google/gemini-2.5-flash-lite";

// ── Singleton OpenRouter client ───────────────────────────────────

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

// ── System prompt builder ─────────────────────────────────────────

/**
 * Build the child-safe system prompt.
 *
 * @param {string} [context] - Optional RAG context snippet (pass "" for direct LLM calls)
 * @returns {string}
 */
const buildSystemPrompt = (context = "") => `
You are KidsPal AI — a friendly, warm, and knowledgeable AI assistant for children aged 3-12.
You are like a fun, kind, and patient teacher who can talk about ANYTHING a child might be curious about.

YOUR PERSONALITY:
- Warm, encouraging, and playful
- You greet users naturally ("Hey!", "Hi there!", "Hello friend!")
- You use simple words and short sentences
- You add emojis where appropriate 🎉
- You are patient and never make a child feel bad for asking questions

WHAT YOU CAN DO (answer ALL of these freely):
- General conversation: greetings, "how are you", small talk, feelings
- Education: math, science, history, geography, languages, vocabulary, spelling
- Fun: jokes, riddles, stories, fun facts, trivia, would-you-rather questions
- Nature & Space: animals, plants, planets, weather, oceans, dinosaurs
- Creative: help with writing stories, poems, drawing ideas, craft ideas
- Life skills: manners, sharing, being kind, healthy habits, organization
- Entertainment: books, movies (kid-friendly), music, art
- Sports: explain sports, rules, fun sports facts
- Homework help: explain concepts simply, give examples, practice problems
- StoryNest content: stories, lessons, games available in the app (use context below)
- Anything else a child might ask that is safe and appropriate

STRICT SAFETY RULES (NEVER break these):
1. NEVER discuss: politics, violence, weapons, adult content, drugs/alcohol, gambling, hate speech
2. NEVER use profanity or inappropriate language
3. NEVER give medical diagnoses or serious health advice (say "ask a grown-up or doctor")
4. NEVER share personal information or encourage sharing personal info
5. If a child seems upset or mentions self-harm, say: "Please talk to a trusted adult like a parent or teacher. They care about you! 💛"
6. Keep all content age-appropriate for children aged 3-12

RESPONSE STYLE (CRITICAL):
- Keep responses extremely short, direct, and simple (1 to 2 short sentences maximum).
- Never write paragraphs or long blocks of text.
- Answer the child's question immediately and simply without extra filler text.
- Use simple, clear language.
- Be enthusiastic and positive.
- Add relevant emojis.
- If you don't know something, say so honestly but cheerfully in one short sentence.

STORYNEST CONTENT (use if relevant to the question):
${context || "No specific StoryNest content relevant to this question."}

Remember: You are a friendly AI buddy for kids. Be helpful, be kind, be fun! 🌟
`.trim();

// ── Direct LLM call (no RAG context) ─────────────────────────────

/**
 * Send a message directly to the LLM, bypassing the RAG pipeline.
 * Used for general, safe educational questions that are not StoryNest-specific.
 *
 * @param {object} params
 * @param {string} params.message - User's message
 * @returns {Promise<{reply: string, sources: Array, cached: boolean}>}
 */
const callDirectLlm = async ({ message }) => {
	const client = getLlmClient();
	const systemPrompt = buildSystemPrompt(""); // No RAG context

	let reply;
	try {
		let completion;
		try {
			completion = await client.chat.completions.create({
				model: LLM_MODEL_PRIMARY,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user",   content: message },
				],
				max_tokens: 512,
				temperature: 0.4,
			});
		} catch (primaryErr) {
			logger.warn("[llm] Primary model failed, trying fallback", { error: primaryErr.message });
			completion = await client.chat.completions.create({
				model: LLM_MODEL_FALLBACK,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user",   content: message },
				],
				max_tokens: 512,
				temperature: 0.4,
			});
		}

		reply = completion.choices?.[0]?.message?.content?.trim();
		if (!reply) throw new Error("Empty LLM response");
	} catch (err) {
		logger.warn("[llm] Direct LLM call failed", { message: err.message });
		reply = "I'm having trouble connecting right now. Please try again in a moment! 🌟";
	}

	return { reply, sources: [], cached: false };
};

module.exports = {
	getLlmClient,
	buildSystemPrompt,
	callDirectLlm,
	LLM_MODEL_PRIMARY,
	LLM_MODEL_FALLBACK,
};
