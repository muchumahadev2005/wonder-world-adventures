const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const childrenRoutes = require("../modules/children/children.routes");

const router = express.Router();

router.get("/health", (req, res) => {
	res.json({ success: true, message: "StoryNest World API" });
});

router.use("/auth", authRoutes);
router.use("/children", childrenRoutes);
router.use("/child", childrenRoutes);

module.exports = router;
