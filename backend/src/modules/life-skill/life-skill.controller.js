const catchAsync = require("../../utils/catchAsync");
const service = require("./life-skill.service");

// ── Public: list active scenarios ─────────────────────────────────
const listScenarios = catchAsync(async (req, res) => {
  const scenarios = await service.listScenarios();
  return res.json({ success: true, scenarios });
});

// ── Public: get single scenario ───────────────────────────────────
const getScenario = catchAsync(async (req, res) => {
  const scenario = await service.getScenario(req.params.slug);
  return res.json({ success: true, scenario });
});

// ── Public: chat with scenario character (direct LLM, no RAG) ─────
const chat = catchAsync(async (req, res) => {
  const { message, history } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, message: "Message is required." });
  }

  const result = await service.chat(
    req.params.slug,
    message.trim().slice(0, 500),
    Array.isArray(history) ? history : []
  );

  return res.json({ success: true, reply: result.reply, model: result.model });
});

// ── Admin: list all scenarios ─────────────────────────────────────
const adminList = catchAsync(async (req, res) => {
  const scenarios = await service.adminListScenarios();
  return res.json({ success: true, scenarios });
});

// ── Admin: create scenario ────────────────────────────────────────
const adminCreate = catchAsync(async (req, res) => {
  const scenario = await service.adminCreate(req.body);
  return res.status(201).json({ success: true, scenario, message: "Scenario created successfully." });
});

// ── Admin: update scenario ────────────────────────────────────────
const adminUpdate = catchAsync(async (req, res) => {
  const scenario = await service.adminUpdate(req.params.id, req.body);
  return res.json({ success: true, scenario, message: "Scenario updated successfully." });
});

// ── Admin: delete scenario ────────────────────────────────────────
const adminDelete = catchAsync(async (req, res) => {
  const result = await service.adminDelete(req.params.id);
  return res.json(result);
});

module.exports = { listScenarios, getScenario, chat, adminList, adminCreate, adminUpdate, adminDelete };
