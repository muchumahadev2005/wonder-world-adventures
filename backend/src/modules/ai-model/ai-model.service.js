const repository = require("./ai-model.repository");
const logger = require("../../utils/logger");

const DEFAULT_MODELS = [
  {
    displayName: "Gemma 3",
    modelName: "google/gemma-3-27b-it:free",
    isActive: true,
  },
  {
    displayName: "Llama 3.3",
    modelName: "meta-llama/llama-3.3-70b-instruct:free",
    isActive: false,
  },
  {
    displayName: "Qwen 3",
    modelName: "qwen/qwen3-30b-a3b-instruct:free",
    isActive: false,
  },
  {
    displayName: "Mistral Small",
    modelName: "mistralai/mistral-small-3.2-24b-instruct:free",
    isActive: false,
  },
  {
    displayName: "Nvidia Llama Nemotron",
    modelName: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
    isActive: false,
  },
];

class AiModelService {
  async ensureSeedDefaults() {
    try {
      const count = await repository.countModels();
      if (count === 0) {
        logger.info("[AiModelService] Seeding default OpenRouter models...");
        for (const model of DEFAULT_MODELS) {
          await repository.createModel(model);
        }
      }
    } catch (err) {
      logger.warn("[AiModelService] Seed default check skipped:", err.message);
    }
  }

  async getActiveModel() {
    try {
      await this.ensureSeedDefaults();
      let active = await repository.getActiveModel();
      if (!active) {
        const models = await repository.listModels();
        if (models.length > 0) {
          active = await repository.activateModel(models[0].id);
        }
      }
      if (active) return active;
    } catch (err) {
      logger.error("[AiModelService] Error fetching active model from DB:", err.message);
    }

    // Fallback if DB fails
    return {
      id: "fallback",
      displayName: "Gemma 3 (Fallback)",
      modelName: "google/gemma-3-27b-it:free",
      apiKey: null,
      isActive: true,
    };
  }

  // Mask API key for admin UI view security
  maskModel(model) {
    if (!model) return null;
    const { apiKey, ...rest } = model;
    return {
      ...rest,
      hasCustomApiKey: Boolean(apiKey && apiKey.trim().length > 0),
      apiKeyMasked: apiKey ? `••••••••${apiKey.slice(-4)}` : null,
    };
  }

  async listModels() {
    await this.ensureSeedDefaults();
    const models = await repository.listModels();
    return models.map((m) => this.maskModel(m));
  }

  async createModel(data) {
    const { displayName, modelName, apiKey, isActive } = data;
    if (!displayName || !modelName) {
      throw new Error("Display name and Model name are required.");
    }

    const created = await repository.createModel({
      displayName: displayName.trim(),
      modelName: modelName.trim(),
      apiKey: apiKey && apiKey.trim() ? apiKey.trim() : null,
      isActive: Boolean(isActive),
    });

    if (isActive) {
      return this.maskModel(await repository.activateModel(created.id));
    }

    return this.maskModel(created);
  }

  async updateModel(id, data) {
    const existing = await repository.getModelById(id);
    if (!existing) {
      throw new Error("AI Model not found.");
    }

    const updateData = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName.trim();
    if (data.modelName !== undefined) updateData.modelName = data.modelName.trim();
    if (data.apiKey !== undefined) {
      // If user passed empty string or null, set to null; if new key passed, save it
      updateData.apiKey = data.apiKey && data.apiKey.trim() ? data.apiKey.trim() : null;
    }

    const updated = await repository.updateModel(id, updateData);

    if (data.isActive) {
      return this.maskModel(await repository.activateModel(id));
    }

    return this.maskModel(updated);
  }

  async deleteModel(id) {
    const existing = await repository.getModelById(id);
    if (!existing) {
      throw new Error("AI Model not found.");
    }
    if (existing.isActive) {
      throw new Error("Cannot delete the currently active model. Please activate another model first.");
    }
    await repository.deleteModel(id);
    return { success: true, message: "Model deleted successfully." };
  }

  async activateModel(id) {
    const existing = await repository.getModelById(id);
    if (!existing) {
      throw new Error("AI Model not found.");
    }
    const activated = await repository.activateModel(id);
    return this.maskModel(activated);
  }

  async testModel(id) {
    const model = await repository.getModelById(id);
    if (!model) {
      throw new Error("AI Model not found.");
    }

    const apiKey = model.apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return { success: false, status: "Connection Failed", error: "No OpenRouter API key configured." };
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://storynest.app",
          "X-Title": "StoryNest AI",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model.modelName,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        const errorMsg = data.error?.message || `HTTP ${response.status}`;
        return { success: false, status: "Connection Failed", error: errorMsg };
      }

      return { success: true, status: "Connected", message: "Model test connection successful." };
    } catch (err) {
      return { success: false, status: "Connection Failed", error: err.message };
    }
  }
}

module.exports = new AiModelService();
