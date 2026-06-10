const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const childrenRoutes = require("../modules/children/children.routes");
const subscriptionsRoutes = require("../modules/subscriptions/routes/subscriptions.routes");
const languagesRoutes = require("../modules/languages/routes/languages.routes");
const levelsRoutes = require("../modules/levels/routes/levels.routes");
const lessonsRoutes = require("../modules/lessons/routes/lessons.routes");
const storiesRoutes = require("../modules/stories/routes/stories.routes");
const quizzesRoutes = require("../modules/quizzes/routes/quizzes.routes");
const gamesRoutes = require("../modules/games/routes/games.routes");
const rewardsRoutes = require("../modules/rewards/rewards.routes");
const progressRoutes = require("../modules/progress/progress.routes");
const parentsRoutes = require("../modules/parents/routes/parents.routes");
const chatbotRoutes = require("../modules/chatbot/chatbot.routes");
const voiceRoutes = require("../modules/voice/voice.routes");
const paymentsRoutes = require("../modules/payments/payments.routes");
const usersRoutes = require("../modules/users/users.routes");
const adminRoutes = require("../modules/admin/admin.routes");

const router = express.Router();

router.get("/health", (req, res) => {
	res.json({ success: true, message: "StoryNest World API" });
});

router.use("/auth", authRoutes);
router.use("/children", childrenRoutes);
// NOTE: /child alias removed — was a duplicate
router.use("/subscriptions", subscriptionsRoutes);
router.use("/languages", languagesRoutes);
router.use("/levels", levelsRoutes);
router.use("/lessons", lessonsRoutes);
router.use("/stories", storiesRoutes);
router.use("/quizzes", quizzesRoutes);
// NOTE: /quiz alias removed — was a duplicate
router.use("/games", gamesRoutes);
router.use("/rewards", rewardsRoutes);
router.use("/progress", progressRoutes);
router.use("/parents", parentsRoutes);
router.use("/chatbot", chatbotRoutes);
router.use("/voice", voiceRoutes);
router.use("/payments", paymentsRoutes);
router.use("/users", usersRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
