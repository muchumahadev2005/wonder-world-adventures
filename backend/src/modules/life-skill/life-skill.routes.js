const express = require("express");
const controller = require("./life-skill.controller");

const router = express.Router();

// GET  /api/life-skills          — list active scenarios
router.get("/", controller.listScenarios);

// GET  /api/life-skills/:slug    — get single scenario
router.get("/:slug", controller.getScenario);

// POST /api/life-skills/:slug/chat — chat with scenario (no auth required, limit enforced in service)
router.post("/:slug/chat", controller.chat);

module.exports = router;
