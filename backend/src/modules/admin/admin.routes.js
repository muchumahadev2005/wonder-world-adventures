const express = require("express");
const controller = require("./admin.controller");
const { requireAdmin } = require("../../middleware/adminAuth.middleware");

const router = express.Router();

router.use(requireAdmin);

router.get("/stats", controller.getStats);
router.get("/users", controller.getUsers);
router.get("/subscriptions", controller.getSubscriptions);
router.get("/payments", controller.getPayments);
router.patch("/subscriptions/:id", controller.updateSubscription);

module.exports = router;
