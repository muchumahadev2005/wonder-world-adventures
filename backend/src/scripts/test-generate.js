require("../config/env");
const prisma = require("../prisma/prismaClient");
const { ensurePageAudios } = require("../modules/storyweaver/services/storyweaver.service");

async function main() {
	console.log("\n=== Testing Story Audio Generation ===");
	const storyRecord = await prisma.storyWeaverAudio.findFirst({
		select: { swId: true, title: true, language: true, pages: true },
	});

	if (!storyRecord) {
		console.log("No story found in DB");
		process.exit(1);
	}

	console.log(`Found story: "${storyRecord.title}" (swId: ${storyRecord.swId}, language: ${storyRecord.language})`);
	console.log(`Pages count: ${storyRecord.pages?.length || 0}`);

	console.log("\nCalling ensurePageAudios...");
	const updated = await ensurePageAudios(storyRecord.swId);

	console.log("\n=== Generation Results ===");
	console.log(`Story title: ${updated.title}`);
	console.log("Pages audio preview:");
	for (let i = 0; i < Math.min(3, updated.pages.length); i++) {
		const p = updated.pages[i];
		console.log(`  Page ${i + 1}: text="${(p.text || "").slice(0, 40)}..."`);
		console.log(`    -> audioUrl: ${p.audioUrl}`);
	}

	console.log("\n✅ End-to-end test passed!");
	process.exit(0);
}

main().catch((err) => {
	console.error("Test error:", err);
	process.exit(1);
});
