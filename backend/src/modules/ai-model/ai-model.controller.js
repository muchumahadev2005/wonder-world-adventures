const aiModelService = require("./ai-model.service");

class AiModelController {
  async listModels(req, res) {
    try {
      const models = await aiModelService.listModels();
      return res.json({ success: true, models });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createModel(req, res) {
    try {
      const model = await aiModelService.createModel(req.body);
      return res.status(201).json({ success: true, model, message: "AI Model created successfully." });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateModel(req, res) {
    try {
      const model = await aiModelService.updateModel(req.params.id, req.body);
      return res.json({ success: true, model, message: "AI Model updated successfully." });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async deleteModel(req, res) {
    try {
      const result = await aiModelService.deleteModel(req.params.id);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async activateModel(req, res) {
    try {
      const model = await aiModelService.activateModel(req.params.id);
      return res.json({ success: true, model, message: `${model.displayName} activated successfully.` });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async testModel(req, res) {
    try {
      const result = await aiModelService.testModel(req.params.id);
      // Always return 200 — test failure is a result, not a server error
      return res.json(result);
    } catch (err) {
      return res.json({ success: false, status: "Connection Failed", error: err.message });
    }
  }
}

module.exports = new AiModelController();
