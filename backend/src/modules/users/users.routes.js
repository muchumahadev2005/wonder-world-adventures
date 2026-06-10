const express = require("express");
const controller = require("./users.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/me", requireAuth, controller.getMe);
router.put("/profile", requireAuth, controller.updateProfile);
router.get("/subscription", requireAuth, controller.getSubscription);
router.get("/progress", requireAuth, controller.getProgress);

module.exports = router;
