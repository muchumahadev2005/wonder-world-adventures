/**
 * router.service.js — AI Request Router
 *
 * Classifies every user message into one of:
 *   storynest  — StoryNest-specific question → RAG pipeline
 *   general    — Safe educational/general question → direct LLM
 *
 * The classifier uses the active model dynamically loaded from PostgreSQL.
 */

const logger = require("../../utils/logger");
const { getActiveLlm, callDirectLlm } = require("./llm.service");
const ragService = require("../rag/rag.service");

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

/**
 * Classify a user message into a routing intent using the active OpenRouter model.
 *
 * @param {string} message
 * @returns {Promise<"storynest"|"general">}
 */
const classifyIntent = async (message) => {
  try {
    const { client, modelName } = await getActiveLlm();
    const completion = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
        { role: "user", content: message.slice(0, 500) },
      ],
      max_tokens: 5,
      temperature: 0,
    });

    const raw = (completion.choices?.[0]?.message?.content || "").trim().toLowerCase();

    if (raw.startsWith("general")) return "general";
    if (raw.startsWith("storynest")) return "storynest";

    logger.warn("[router] Unexpected classifier output — defaulting to storynest", { raw });
    return "storynest";
  } catch (err) {
    logger.warn("[router] Classifier call failed — defaulting to storynest", { error: err.message });
    return "storynest";
  }
};

/**
 * Route a user message to the correct AI handler and return a unified reply.
 */
const routeMessage = async (message, sessionId, userId) => {
  const startMs = Date.now();
  const intent = await classifyIntent(message);

  logger.info("[router] Intent classified", {
    intent,
    message: message.slice(0, 60),
    ms: Date.now() - startMs,
  });

  let result;
  if (intent === "storynest") {
    result = await ragService.processQuestion({ message, sessionId, userId });
  } else {
    result = await callDirectLlm({ message, userId });
  }

  return { ...result, route: intent };
};

module.exports = {
  classifyIntent,
  routeMessage,
};
