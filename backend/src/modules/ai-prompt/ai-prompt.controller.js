const aiPromptService = require("./ai-prompt.service");

class AiPromptController {
  async getSettings(req, res) {
    try {
      const settings = await aiPromptService.getActiveSettings();
      const previewPrompt = await aiPromptService.buildSystemPrompt("", settings);
      return res.json({
        success: true,
        settings,
        previewPrompt,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateSettings(req, res) {
    try {
      const settings = await aiPromptService.updateSettings(req.body);
      const previewPrompt = await aiPromptService.buildSystemPrompt("", settings);
      return res.json({
        success: true,
        settings,
        previewPrompt,
        message: "AI Prompt Limitations updated successfully.",
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async resetDefaults(req, res) {
    try {
      const settings = await aiPromptService.resetDefaults();
      const previewPrompt = await aiPromptService.buildSystemPrompt("", settings);
      return res.json({
        success: true,
        settings,
        previewPrompt,
        message: "AI Prompt Limitations reset to defaults.",
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async previewPrompt(req, res) {
    try {
      const previewPrompt = await aiPromptService.buildSystemPrompt("", req.body);
      return res.json({
        success: true,
        previewPrompt,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AiPromptController();
