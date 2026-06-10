const express = require("express");
const controller = require("../controllers/parents.controller");
const { requireAuth } = require("../../../middleware/auth.middleware");

const router = express.Router();

router.get("/summary", requireAuth, controller.getSummary);
router.get("/dashboard", requireAuth, controller.getSummary);

module.exports = router;
