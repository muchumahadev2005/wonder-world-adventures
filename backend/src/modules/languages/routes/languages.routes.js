const express = require("express");
const controller = require("../controllers/languages.controller");

const router = express.Router();

router.get("/", controller.listLanguages);
router.get("/:id/levels", controller.getLevelsForLanguage);

module.exports = router;
