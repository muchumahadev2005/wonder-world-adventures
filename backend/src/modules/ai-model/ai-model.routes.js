const express = require("express");
const controller = require("./ai-model.controller");
const { requireAdmin } = require("../../middleware/adminAuth.middleware");

const router = express.Router();

// Require admin authentication for all model management endpoints
router.use(requireAdmin);

router.get("/", controller.listModels);
router.post("/", controller.createModel);
router.put("/:id", controller.updateModel);
router.delete("/:id", controller.deleteModel);
router.patch("/:id/activate", controller.activateModel);
router.post("/:id/test", controller.testModel);

module.exports = router;
