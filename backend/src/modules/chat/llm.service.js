const OpenAI = require("openai");
const logger = require("../../utils/logger");
const aiModelService = require("../ai-model/ai-model.service");
const aiPromptService = require("../ai-prompt/ai-prompt.service");
const { sanitizeAiResponse } = require("../../utils/responseSanitizer");

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
 * Build the child-safe system prompt dynamically based on Admin Prompt Limitations.
 *
 * @param {string} [context=""] - Optional RAG context snippet
 * @param {object} [settings=null] - Optional override settings
 * @returns {Promise<string>}
 */
const buildSystemPrompt = async (context = "", settings = null) => {
  return aiPromptService.buildSystemPrompt(context, settings);
};

/**
 * Send a message directly to the dynamically active LLM using active prompt limitations.
 *
 * @param {object} params
 * @param {string} params.message - User's message
 * @returns {Promise<{reply: string, sources: Array, cached: boolean}>}
 */
const callDirectLlm = async ({ message }) => {
  let reply;
  try {
    const { client, modelName } = await getActiveLlm();
    const settings = await aiPromptService.getActiveSettings();
    const systemPrompt = await buildSystemPrompt("", settings);
    const maxWords = settings?.maxResponseWords || 50;

    const completion = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 512,
      temperature: 0.4,
      include_reasoning: false,
    });

    const rawReply = completion.choices?.[0]?.message?.content?.trim();
    if (!rawReply) throw new Error("Empty LLM response");

    reply = sanitizeAiResponse(rawReply, { maxWords });
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

