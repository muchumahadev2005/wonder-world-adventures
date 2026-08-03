/**
 * llm.service.js — Dynamic OpenRouter LLM utilities
 *
 * Reads active model & custom API key dynamically from PostgreSQL database.
 * No hardcoded models.
 */

const OpenAI = require("openai");
const logger = require("../../utils/logger");
const aiModelService = require("../ai-model/ai-model.service");

/**
 * Dynamically gets the active LLM client and active model name from the database.
 *
 * @returns {Promise<{client: OpenAI, modelName: string}>}
 */
const getActiveLlm = async () => {
  const activeModel = await aiModelService.getActiveModel();
  const apiKey = (activeModel && activeModel.apiKey) || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("No OpenRouter API key configured.");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://storynest.app",
      "X-Title": "StoryNest AI Buddy",
    },
  });

  return {
    client,
    modelName: activeModel.modelName,
  };
};

/**
 * Build the child-safe system prompt.
 *
 * @param {string} [context] - Optional RAG context snippet
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
`.trim();

/**
 * Send a message directly to the dynamically active LLM.
 *
 * @param {object} params
 * @param {string} params.message - User's message
 * @returns {Promise<{reply: string, sources: Array, cached: boolean}>}
 */
const callDirectLlm = async ({ message }) => {
  let reply;
  try {
    const { client, modelName } = await getActiveLlm();
    const systemPrompt = buildSystemPrompt("");

    const completion = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 512,
      temperature: 0.4,
    });

    reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("Empty LLM response");
  } catch (err) {
    logger.warn("[llm] Direct LLM call failed", { error: err.message });
    reply = "I'm having trouble connecting right now. Please try again in a moment! 🌟";
  }

  return { reply, sources: [], cached: false };
};

module.exports = {
  getActiveLlm,
  buildSystemPrompt,
  callDirectLlm,
};
