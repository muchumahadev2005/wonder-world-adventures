require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
// Force Neon connection for tests
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_g4iUeLGwtDV7@ep-cool-mountain-apjj5xbt.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { processQuestion } = require("./rag.service");
const { indexContentAsync } = require("./embedding.service");

// Sleep helper
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
	console.log("=== GUARDRAIL & AUTO-INDEXING VERIFICATION ===\n");

	// ---------------------------------------------------------
	// 1. Guardrail Test
	// ---------------------------------------------------------
	console.log("TEST 1: Guardrails (Blocked Topics)");
	const blockedQuery = "Who won IPL?";
	console.log(`Q: "${blockedQuery}"`);
	
	const guardrailResult = await processQuestion({
		message: blockedQuery,
		sessionId: "test-session",
	});
	
	console.log(`Reply: "${guardrailResult.reply}"`);
	console.log(`Sources count: ${guardrailResult.sources.length}`);
	
	const passedGuardrail = guardrailResult.sources.length === 0 && guardrailResult.reply.includes("I only know about our stories");
	console.log(`Guardrail Test: ${passedGuardrail ? "✅ PASSED" : "❌ FAILED"}\n`);

	// ---------------------------------------------------------
	// 2. Auto-Indexing Test
	// ---------------------------------------------------------
	console.log("TEST 2: Auto-Indexing Hook (Create/Update)");
	
	// Create a dummy story
	const testStoryId = "test-auto-index-123";
	console.log("Creating temporary story...");
	await prisma.story.upsert({
		where: { id: testStoryId },
		update: {
			title: "The Temporary Test Story",
			content: "This is a brand new story created just for testing auto-indexing.",
			category: "Adventure",
			ageGroup: "5-8"
		},
		create: {
			id: testStoryId,
			slug: testStoryId,
			title: "The Temporary Test Story",
			content: "This is a brand new story created just for testing auto-indexing.",
			author: "Test Author",
			category: "Adventure",
			ageGroup: "5-8",
			isPublished: true,
		}
	});

	// Trigger the async hook (this mimics what stories.service.js does)
	console.log("Triggering indexContentAsync('story', id)...");
	indexContentAsync("story", testStoryId);

	// Wait for background job to finish
	console.log("Waiting 10 seconds for async embedding generation...");
	await sleep(10000);

	// Check embeddings table
	const embeddings = await prisma.contentEmbedding.findMany({
		where: { sourceId: testStoryId }
	});

	console.log(`Embeddings found for new story: ${embeddings.length}`);
	const passedCreateIndex = embeddings.length > 0;
	console.log(`Create Index Test: ${passedCreateIndex ? "✅ PASSED" : "❌ FAILED"}`);
	if (embeddings.length > 0) {
		console.log(`  Preview: "${embeddings[0].chunkText}"\n`);
	}

	// Clean up
	console.log("Cleaning up test data...");
	await prisma.contentEmbedding.deleteMany({ where: { sourceId: testStoryId } });
	await prisma.story.delete({ where: { id: testStoryId } });
	console.log("Cleanup complete.");

	console.log("\n=== VERIFICATION COMPLETE ===");
	process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
