const catchAsync = require("../../utils/catchAsync");
const service = require("./users.service");

const getMe = catchAsync(async (req, res) => {
	const user = await service.getUserById(req.user.id);
	if (!user) {
		return res.status(404).json({ success: false, message: "User not found" });
	}
	const subscription = await service.getActiveSubscription(req.user.id);
	res.json({
		success: true,
		user: {
			...user,
			isPremium: Boolean(subscription),
		},
		subscription: subscription || null,
	});
});

const getSubscription = catchAsync(async (req, res) => {
	const subscription = await service.getActiveSubscription(req.user.id);
	res.json({
		success: true,
		subscription: subscription || null,
		isPremium: Boolean(subscription),
	});
});

const updateProfile = catchAsync(async (req, res) => {
	const { name, profileImage } = req.body;
	const data = {};
	if (name) data.name = name;
	if (profileImage) data.profileImage = profileImage;
	const user = await service.updateUserProfile(req.user.id, data);
	res.json({ success: true, user });
});

const getProgress = catchAsync(async (req, res) => {
	const profile = await service.getChildProfile(req.user.id);
	if (!profile) {
		return res.json({ success: true, profile: null });
	}
	const { rewardWallet, storyProgress, lessonProgress, gameProgress, ...rest } = profile;
	res.json({
		success: true,
		profile: rest,
		stats: {
			storiesCompleted: storyProgress.length,
			lessonsCompleted: lessonProgress.length,
			gamesCompleted: gameProgress.length,
			stars: rewardWallet?.stars ?? 0,
			coins: rewardWallet?.coins ?? 0,
			xp: rewardWallet?.xp ?? 0,
			level: rewardWallet?.level ?? 1,
			streak: rewardWallet?.streak ?? 0,
		},
	});
});

module.exports = { getMe, getSubscription, updateProfile, getProgress };
