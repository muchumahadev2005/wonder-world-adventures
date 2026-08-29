/**
 * life-skill.service.js
 *
 * Handles Life Skills Practice scenario management and direct LLM chat.
 * NO RAG — each scenario uses its dedicated OpenRouter model and a
 * handcrafted character system prompt.
 */

const OpenAI = require("openai");
const repository = require("./life-skill.repository");
const logger = require("../../utils/logger");
const { sanitizeAiResponse } = require("../../utils/responseSanitizer");
const aiModelService = require("../ai-model/ai-model.service");

// ── Default Scenarios ─────────────────────────────────────────────
// Each gets a unique OpenRouter free model, character, prompt, and theme.

const DEFAULT_SCENARIOS = [
  {
    slug: "ordering-food",
    title: "Ordering Food",
    description: "Practice politely ordering a meal at a restaurant.",
    icon: "🍽️",
    characterName: "Chef Marco",
    characterAvatar: "👨‍🍳",
    coverGradient: "linear-gradient(135deg, #E8521A 0%, #F28C3A 55%, #FFD080 100%)",
    modelName: "google/gemma-2-9b-it:free",
    maxWords: 60,
    sortOrder: 1,
    systemPrompt: `You are Chef Marco, a warm and friendly restaurant waiter at a family diner called "Sunny Side Café". You are helping a child (ages 5-12) practice ordering food politely.

Your role:
- Greet the child warmly and welcome them to the café.
- Ask them what they'd like to eat or drink.
- If they say something confusing or unclear, gently guide them.
- Compliment polite language ("Please", "Thank you", "May I have").
- Keep your replies SHORT (max 2-3 sentences).
- Use simple, friendly English only.
- Use cheerful food emojis 🍕🥤🍦.
- NEVER discuss anything unrelated to the restaurant roleplay.
- If the child has ordered, confirm the order and say it's on the way!`,
  },
  {
    slug: "going-shopping",
    title: "Going Shopping",
    description: "Practice asking the price and buying something at a shop.",
    icon: "🛍️",
    characterName: "Sam the Shopkeeper",
    characterAvatar: "🧑‍💼",
    coverGradient: "linear-gradient(135deg, #1A7A3A 0%, #2DBD6E 55%, #7EEDAC 100%)",
    modelName: "meta-llama/llama-3.1-8b-instruct:free",
    maxWords: 60,
    sortOrder: 2,
    systemPrompt: `You are Sam, a friendly shopkeeper at a colourful toy and stationery store called "Wonder Shop". You are helping a child (ages 5-12) practice shopping politely.

Your role:
- Greet the child warmly when they enter.
- Show them what items you have (toys, books, pencils, stickers — keep it simple).
- Answer questions about prices using simple numbers (e.g., "That costs 5 coins!").
- Compliment polite language like "How much is this?" or "May I buy this please?".
- Keep replies SHORT (2-3 sentences max).
- Use cheerful shopping emojis 🧸📚✏️🏷️.
- NEVER discuss anything outside the shopping roleplay.
- When the child buys something, thank them enthusiastically!`,
  },
  {
    slug: "asking-for-help",
    title: "Asking for Help",
    description: "Practice calmly asking a trusted grown-up for help if you're lost.",
    icon: "🧭",
    characterName: "Officer Lily",
    characterAvatar: "👮‍♀️",
    coverGradient: "linear-gradient(135deg, #1A3A8F 0%, #3A6AD4 55%, #7EB0FF 100%)",
    modelName: "qwen/qwen-2.5-72b-instruct:free",
    maxWords: 60,
    sortOrder: 3,
    systemPrompt: `You are Officer Lily, a kind and gentle police officer who helps children find their way when they are lost. You are helping a child (ages 5-12) practice asking for help safely and politely.

Your role:
- Be calm, reassuring, and warm — never scary.
- Encourage the child to tell you their name and where they were last with a grown-up.
- Teach them to say things like "Excuse me, I need help" or "I think I'm lost, can you help me please?".
- Compliment good, clear communication.
- Keep replies SHORT (2-3 sentences max).
- Use calming emojis 🌟🤝💛.
- NEVER discuss anything outside the lost-and-found / asking for help roleplay.
- Always end positively — everything will be okay!`,
  },
  {
    slug: "meeting-a-new-friend",
    title: "Meeting a New Friend",
    description: "Practice introducing yourself and asking someone to play.",
    icon: "🤝",
    characterName: "Priya",
    characterAvatar: "🧒",
    coverGradient: "linear-gradient(135deg, #7A1AB8 0%, #B85AEA 55%, #E8A0FF 100%)",
    modelName: "mistralai/mistral-7b-instruct:free",
    maxWords: 60,
    sortOrder: 4,
    systemPrompt: `You are Priya, a friendly child (around 8 years old) sitting alone in a park. You are helping another child (ages 5-12) practice introducing themselves and making a new friend politely and confidently.

Your role:
- React warmly to greetings and introductions.
- If the child says "Hi, I'm [name]", respond excitedly and introduce yourself.
- Suggest fun things to do together (play catch, draw, tell jokes, etc.).
- Compliment kind and friendly language.
- Keep replies SHORT (2-3 sentences max).
- Use friendly emojis 🌈😊🎮🎨.
- NEVER discuss anything outside the friend-making roleplay.
- Make the child feel confident and happy!`,
  },
  {
    slug: "talking-to-a-doctor",
    title: "Talking to a Doctor",
    description: "Practice describing how you feel when you're not well.",
    icon: "🩺",
    characterName: "Dr. Sunny",
    characterAvatar: "👩‍⚕️",
    coverGradient: "linear-gradient(135deg, #0A7A8F 0%, #1ABCD4 55%, #7AE8FF 100%)",
    modelName: "deepseek/deepseek-r1:free",
    maxWords: 60,
    sortOrder: 5,
    systemPrompt: `You are Dr. Sunny, a very friendly and gentle children's doctor at a bright, cheerful clinic. You are helping a child (ages 5-12) practice describing their symptoms clearly and politely.

Your role:
- Greet the child warmly and ask how they are feeling today.
- Ask simple, clear questions: "Where does it hurt?", "Is your tummy sore?", "Do you have a fever?".
- Encourage the child to use descriptive words ("It hurts here", "I feel dizzy", "My throat is scratchy").
- Reassure them that visiting the doctor is safe and helpful.
- Keep replies SHORT (2-3 sentences max).
- Use gentle, calming emojis 💊🌡️🩹💛.
- NEVER give actual medical advice — this is a roleplay for communication practice only.
- NEVER discuss anything outside the doctor visit roleplay.`,
  },
  {
    slug: "being-kind",
    title: "Being Kind",
    description: "Practice comforting a friend who is feeling sad.",
    icon: "💛",
    characterName: "Leo",
    characterAvatar: "🧒",
    coverGradient: "linear-gradient(135deg, #8F6A00 0%, #D4A820 55%, #FFE070 100%)",
    modelName: "google/gemma-2-9b-it:free",
    maxWords: 60,
    sortOrder: 6,
    systemPrompt: `You are Leo, a child (around 8 years old) who is feeling a little sad today because you lost your favourite crayon. You are helping another child (ages 5-12) practice being kind, showing empathy, and comforting a friend.

Your role:
- Start by looking and sounding a little sad.
- React positively when the child says something kind (e.g., "Don't worry", "I'll help you find it", "Want to use mine?").
- Show how kindness makes you feel better step by step.
- Teach through example: kind words heal sad feelings.
- Keep replies SHORT (2-3 sentences max).
- Use warm emojis 💛🖍️🌻🤗.
- NEVER discuss anything outside the kindness / friendship roleplay.
- Always celebrate when the child says something really kind!`,
  },
];

// ── Helpers ───────────────────────────────────────────────────────

const maskScenario = (s) => {
  if (!s) return null;
  const { apiKey, ...rest } = s;
  return {
    ...rest,
    hasCustomApiKey: Boolean(apiKey && apiKey.trim()),
    apiKeyMasked: apiKey ? `••••••••${apiKey.slice(-4)}` : null,
  };
};

// ── Service ───────────────────────────────────────────────────────

class LifeSkillService {
  // ── Seeding ────────────────────────────────────────────────────
  async ensureSeedDefaults() {
    try {
      const count = await repository.count();
      if (count === 0) {
        logger.info("[LifeSkillService] Seeding default life skill scenarios...");
        for (const s of DEFAULT_SCENARIOS) {
          await repository.create(s);
        }
      }
    } catch (err) {
      logger.warn("[LifeSkillService] Seed check skipped:", err.message);
    }
  }

  // ── Public list ────────────────────────────────────────────────
  async listScenarios() {
    await this.ensureSeedDefaults();
    const rows = await repository.listActive();
    return rows.map(maskScenario);
  }

  // ── Admin list (includes inactive, api key masked) ────────────
  async adminListScenarios() {
    await this.ensureSeedDefaults();
    const rows = await repository.listAll();
    return rows.map(maskScenario);
  }

  // ── Get single ────────────────────────────────────────────────
  async getScenario(slug) {
    await this.ensureSeedDefaults();
    const row = await repository.findBySlug(slug);
    if (!row) throw Object.assign(new Error("Scenario not found."), { status: 404 });
    return maskScenario(row);
  }

  // ── Admin CRUD ────────────────────────────────────────────────
  async adminGetById(id) {
    const row = await repository.findById(id);
    if (!row) throw Object.assign(new Error("Scenario not found."), { status: 404 });
    return maskScenario(row);
  }

  async adminCreate(data) {
    const { slug, title, description, icon, characterName } = data;
    if (!slug || !title || !description || !icon || !characterName) {
      throw new Error("slug, title, description, icon, and characterName are required.");
    }
    const created = await repository.create({
      slug: slug.trim().toLowerCase(),
      title: title.trim(),
      description: description.trim(),
      icon: icon.trim(),
      characterName: characterName.trim(),
      characterAvatar: data.characterAvatar?.trim() || null,
      coverGradient: data.coverGradient?.trim() || undefined,
      systemPrompt: (data.systemPrompt || "").trim(),
      modelName: data.modelName?.trim() || null,
      apiKey: data.apiKey?.trim() || null,
      maxWords: Number(data.maxWords) || 60,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      sortOrder: Number(data.sortOrder) || 0,
    });
    return maskScenario(created);
  }

  async adminUpdate(id, data) {
    const existing = await repository.findById(id);
    if (!existing) throw Object.assign(new Error("Scenario not found."), { status: 404 });

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.icon !== undefined) updateData.icon = data.icon.trim();
    if (data.characterName !== undefined) updateData.characterName = data.characterName.trim();
    if (data.characterAvatar !== undefined) updateData.characterAvatar = data.characterAvatar?.trim() || null;
    if (data.coverGradient !== undefined) updateData.coverGradient = data.coverGradient.trim();
    if (data.systemPrompt !== undefined) updateData.systemPrompt = data.systemPrompt.trim();
    if (data.modelName !== undefined) updateData.modelName = data.modelName?.trim() || null;
    if (data.apiKey !== undefined) updateData.apiKey = data.apiKey?.trim() || null;
    if (data.maxWords !== undefined) updateData.maxWords = Number(data.maxWords) || 60;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (data.sortOrder !== undefined) updateData.sortOrder = Number(data.sortOrder) || 0;

    const updated = await repository.update(id, updateData);
    return maskScenario(updated);
  }

  async adminDelete(id) {
    const existing = await repository.findById(id);
    if (!existing) throw Object.assign(new Error("Scenario not found."), { status: 404 });
    await repository.delete(id);
    return { success: true, message: "Scenario deleted successfully." };
  }

  // ── Chat (Direct LLM — NO RAG) ────────────────────────────────
  /**
   * Send a child's message to the scenario character using a direct
   * OpenRouter LLM call. No vector search, no RAG pipeline.
   *
   * @param {string} slug      - Scenario slug
   * @param {string} message   - Child's message
   * @param {Array}  history   - Previous [{role,content}] turns (optional)
   * @returns {Promise<{reply:string}>}
   */
  async chat(slug, message, history = []) {
    await this.ensureSeedDefaults();
    const scenario = await repository.findBySlug(slug);
    if (!scenario || !scenario.isActive) {
      throw Object.assign(new Error("Scenario not found or inactive."), { status: 404 });
    }

    // Resolve API key: scenario-level > env global
    const apiKey = (scenario.apiKey && scenario.apiKey.trim())
      ? scenario.apiKey.trim()
      : process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("No OpenRouter API key configured for this scenario.");
    }

    // Resolve model: scenario-level > global active model
    let modelName = scenario.modelName && scenario.modelName.trim()
      ? scenario.modelName.trim()
      : null;

    if (!modelName) {
      try {
        const globalModel = await aiModelService.getActiveModel();
        modelName = globalModel.modelName;
      } catch {
        modelName = "google/gemma-2-9b-it:free";
      }
    }

    const client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://storynest.app",
        "X-Title": "StoryNest Life Skills",
      },
    });

    // Build message array: system prompt + prior history + new user message
    const messages = [
      { role: "system", content: scenario.systemPrompt },
      ...history.slice(-10), // keep last 10 turns as context
      { role: "user", content: message },
    ];

    const maxWords = scenario.maxWords || 60;

    try {
      const completion = await client.chat.completions.create({
        model: modelName,
        messages,
        max_tokens: 256,
        temperature: 0.7,
      });

      const raw = completion.choices?.[0]?.message?.content?.trim();
      if (!raw) throw new Error("Empty LLM response");

      const reply = sanitizeAiResponse(raw, { maxWords });
      return { reply, model: modelName };
    } catch (err) {
      logger.warn(`[LifeSkillService] LLM call failed for ${slug}:`, err.message);
      return {
        reply: `Oops! ${scenario.characterName} is thinking really hard right now. Try again in a moment! 🌟`,
        model: modelName,
      };
    }
  }
}

module.exports = new LifeSkillService();
