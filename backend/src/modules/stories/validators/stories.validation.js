const { z } = require("zod");

// ── Constants ─────────────────────────────────────────────────────
const STORY_CATEGORIES = [
	"Animal",
	"Moral",
	"Adventure",
	"Fantasy",
	"Science",
	"Space",
	"Nature",
	"History",
	"Friendship",
	"Family",
	"Festival",
	"Bedtime",
	"Educational",
];

const STORY_AGE_GROUPS = ["3-5", "6-8", "9-12"];

const STORY_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

const normalizeAgeGroup = (v) => {
	if (!v) return v;
	const s = String(v).trim().toLowerCase();
	const clean = s.replace(/years|year|yrs|yr/g, "").trim();
	const formatted = clean.replace(/\s*to\s*/g, "-").replace(/\s+/g, "");
	if (formatted === "3-5" || formatted === "6-8" || formatted === "9-12") {
		return formatted;
	}
	return typeof v === "string" ? v.trim() : v;
};

// ── Shared helpers ────────────────────────────────────────────────
const optionalString = z.string().trim().min(1).optional().nullable();
const optionalUrl    = z.string().url("Must be a valid URL").optional().nullable();
const nonNegativeInt = z.coerce.number().int().min(0, "Must be >= 0");
const posInt         = z.coerce.number().int().min(0, "Must be >= 0");

const optionalBoolean = z
	.union([z.boolean(), z.string()])
	.optional()
	.transform((v) => {
		if (typeof v === "boolean") return v;
		if (v === "true" || v === "1") return true;
		if (v === "false" || v === "0") return false;
		return undefined;
	});

// ── List / Filter schema ──────────────────────────────────────────
const listStoriesSchema = z.object({
	language:     optionalString,
	languageId:   optionalString,
	category:     optionalString,
	ageGroup:     optionalString,
	difficulty:   optionalString,
	isPremium:    optionalBoolean,
	isFeatured:   optionalBoolean,
	isTrending:   optionalBoolean,
	isRecommended:optionalBoolean,
	isPublished:  optionalBoolean,
	search:       optionalString,
	limit:        z.coerce.number().int().min(1).max(500).optional(),
	page:         z.coerce.number().int().min(1).optional(),
	sortBy:       z.enum(["createdAt", "title", "readingTime", "starsReward", "xpReward", "readsCount", "likesCount", "sortOrder"]).optional(),
	sortOrder:    z.enum(["asc", "desc"]).optional(),
});

// ── Create schema ─────────────────────────────────────────────────
const storySchema = z.object({
	// Basic
	slug:          optionalString,
	title:         z.string().trim().min(1, "Title is required"),
	subtitle:      optionalString,
	description:   z.string().trim().optional().nullable(),
	content:       z.string().trim().min(1, "Content is required"),
	pages:         z.array(z.string()).optional().nullable(),
	author:        optionalString,

	// Categorisation
	category:      z
		.string()
		.trim()
		.refine((v) => !v || STORY_CATEGORIES.includes(v), {
			message: `Category must be one of: ${STORY_CATEGORIES.join(", ")}`,
		})
		.optional()
		.nullable(),
	ageGroup:      z
		.preprocess((v) => normalizeAgeGroup(v), z.string().optional().nullable())
		.refine((v) => !v || STORY_AGE_GROUPS.includes(v), {
			message: `Age group must be one of: ${STORY_AGE_GROUPS.join(", ")}`,
		})
		.optional()
		.nullable(),
	difficulty:    z
		.string()
		.trim()
		.refine((v) => !v || STORY_DIFFICULTIES.includes(v), {
			message: `Difficulty must be one of: ${STORY_DIFFICULTIES.join(", ")}`,
		})
		.optional()
		.nullable(),
	tags:          z.array(z.string()).optional(),
	languageId:    optionalString,
	languageCode:  optionalString,

	// Media
	coverImage:    optionalUrl,
	thumbnail:     optionalString,
	coverEmoji:    optionalString,
	coverGradient: optionalString,

	// Timing
	readingTime:   posInt.optional().nullable(),
	listeningTime: posInt.optional().nullable(),
	duration:      optionalString,

	// Flags
	isPremium:       z.boolean().optional(),
	isPublished:     z.boolean().optional(),
	isFeatured:      z.boolean().optional(),
	isTrending:      z.boolean().optional(),
	isRecommended:   z.boolean().optional(),
	readAloudEnabled:z.boolean().optional(),

	// Read Aloud
	narratorVoice:   optionalString,
	audioUrl:        optionalString,

	// Rewards
	xpReward:        nonNegativeInt.optional(),
	starsReward:     nonNegativeInt.optional(),

	// Engagement (read-only in form, editable via admin)
	likesCount:      nonNegativeInt.optional(),
	readsCount:      nonNegativeInt.optional(),
	favoritesCount:  nonNegativeInt.optional(),

	// Ordering
	sortOrder:       z.coerce.number().int().optional(),
});

// ── Update schema ─────────────────────────────────────────────────
const updateStorySchema = storySchema.partial().refine(
	(v) => Object.keys(v).length > 0,
	{ message: "At least one field is required" }
);

// ── Excel import row schema (lenient — errors collected per-row) ───
const importRowSchema = z.object({
	title:           z.string().trim().min(1, "Title is required"),
	content:         z.string().trim().min(1, "Content is required"),
	subtitle:        z.string().optional(),
	description:     z.string().optional(),
	author:          z.string().optional(),
	category:        z.string().optional(),
	language:        z.string().optional(),
	age_group:       z.string().optional(),
	difficulty:      z.string().optional(),
	reading_time:    z.coerce.number().min(0).optional(),
	listening_time:  z.coerce.number().min(0).optional(),
	premium:         z.union([z.boolean(), z.string()]).optional(),
	published:       z.union([z.boolean(), z.string()]).optional(),
	featured:        z.union([z.boolean(), z.string()]).optional(),
	trending:        z.union([z.boolean(), z.string()]).optional(),
	recommended:     z.union([z.boolean(), z.string()]).optional(),
	read_aloud:      z.union([z.boolean(), z.string()]).optional(),
	narrator_voice:  z.string().optional(),
	xp_reward:       z.coerce.number().min(0).optional(),
	star_reward:     z.coerce.number().min(0).optional(),
	tags:            z.string().optional(),
	cover_image_url: z.string().optional(),
});

module.exports = {
	listStoriesSchema,
	storySchema,
	updateStorySchema,
	importRowSchema,
	STORY_CATEGORIES,
	STORY_AGE_GROUPS,
	STORY_DIFFICULTIES,
	normalizeAgeGroup,
};
