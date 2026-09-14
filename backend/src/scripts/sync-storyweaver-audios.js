/**
 * ═══════════════════════════════════════════════════════════════════════════
 * StoryWeaver Stories Ingestion Script
 *
 * Fetches ALL StoryWeaver stories (images + text per page) and persists
 * them into PostgreSQL (`storyweaver_audios` table).
 *
 * What IS stored  : cover image, per-page imageUrl, per-page text
 * What is NOT stored: audio URLs (fetched live from StoryWeaver API)
 *
 * Usage:
 *   node src/scripts/sync-storyweaver-audios.js
 *   node src/scripts/sync-storyweaver-audios.js --limit=100
 *   node src/scripts/sync-storyweaver-audios.js --limit=all
 *   node src/scripts/sync-storyweaver-audios.js --limit=200 --language=English
 *   node src/scripts/sync-storyweaver-audios.js --limit=100 --type=audio
 *   node src/scripts/sync-storyweaver-audios.js --limit=100 --level=1
 * ═══════════════════════════════════════════════════════════════════════════
 */

require("dotenv").config();
const prisma  = require("../prisma/prismaClient");
const service = require("../modules/storyweaver/services/storyweaver.service");

// Keep Neon alive during the sync — pings the DB every 20s so it doesn't
// auto-suspend while we're waiting on StoryWeaver API responses.
const startKeepAlive = () => setInterval(async () => {
	try { await prisma.$queryRaw`SELECT 1`; } catch { /* ignore, best-effort */ }
}, 20_000);

// Parse CLI flags
const parseArgs = () => {
	const args = process.argv.slice(2);
	const options = { limit: 50, language: undefined, level: undefined, storyType: undefined };

	for (const arg of args) {
		if (arg.startsWith("--limit=")) {
			const val = arg.replace("--limit=", "").trim().toLowerCase();
			options.limit = val === "all" ? 10000 : parseInt(val, 10) || 50;
		} else if (arg.startsWith("--language=")) {
			options.language = arg.replace("--language=", "").trim();
		} else if (arg.startsWith("--level=")) {
			options.level = parseInt(arg.replace("--level=", "").trim(), 10);
		} else if (arg.startsWith("--type=")) {
			options.storyType = arg.replace("--type=", "").trim(); // e.g. "audio"
		}
	}
	return options;
};

const main = async () => {
	const { limit, language, level, storyType } = parseArgs();

	console.log("\n===================================================================");
	console.log(" 📖 StoryWeaver Stories Database Ingestion Engine");
	console.log("===================================================================");
	console.log(` Target Limit : ${limit} stories`);
	console.log(` Language     : ${language || "Any (English, Hindi, etc.)"}`);
	console.log(` Level        : ${level || "All levels"}`);
	console.log(` Story Type   : ${storyType || "All types (regular, audio, gif…)"}`);
	console.log(" Stores       : cover image · per-page images · per-page text\n");

	const startTime = Date.now();

	const result = await service.syncStories({
		limit,
		language,
		level,
		storyType,
		onProgress: ({ current, total, story, book, success, error }) => {
			if (success && story) {
				const pagesCount = story.totalPages || story.pages?.length || 0;
				const imgCount   = (story.pages || []).filter((p) => p.imageUrl).length;
				const hasText    = (story.pages || []).some((p) => p.text?.trim());
				console.log(
					`[${current}/${total}] ✅ "${story.title}" | ${story.language} Lv.${story.level || "?"} | ${pagesCount} pages | 🖼️ ${imgCount} imgs | 📝 ${hasText ? "text ✓" : "no text"}`
				);
			} else {
				console.log(
					`[${current}/${total}] ❌ Failed: "${book?.title || "Unknown"}" (#${book?.id}) — ${error}`
				);
			}
		},
	});

	const duration = ((Date.now() - startTime) / 1000).toFixed(1);
	const stats    = await service.getDbAudioStats();

	console.log("\n===================================================================");
	console.log(" 📊 Ingestion Summary");
	console.log("===================================================================");
	console.log(` Processed in this run : ${result.totalProcessed}`);
	console.log(` Successfully Stored   : ${result.successCount}`);
	console.log(` Failed                : ${result.failCount}`);
	console.log(` Elapsed Time          : ${duration}s`);
	console.log("-------------------------------------------------------------------");
	console.log(` Total Stories in DB   : ${stats.totalSaved}`);
	console.log(" Languages Breakdown   :");
	for (const l of stats.languages) {
		console.log(`   • ${l.language.padEnd(16)}: ${l.count} stories`);
	}
	console.log("===================================================================\n");
};

// Module-level keep-alive reference so finally() can clear it
const keepAlive = startKeepAlive();

main()
	.catch((err) => {
		console.error("\n❌ Fatal error in story sync:", err);
		process.exit(1);
	})
	.finally(async () => {
		clearInterval(keepAlive);
		await prisma.$disconnect();
		process.exit(0);
	});
