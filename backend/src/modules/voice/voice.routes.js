const express = require("express");
const controller = require("./voice.controller");

const router = express.Router();

router.get("/prompt", controller.prompt);
router.post("/prompt", controller.prompt);

module.exports = router;
