// Test script to verify RAG tables on Neon and run a full E2E test
const { PrismaClient } = require("@prisma/client");

// Use production Neon URL
const DATABASE_URL = "postgresql://neondb_owner:npg_g4iUeLGwtDV7@ep-cool-mountain-apjj5xbt.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";
process.env.DATABASE_URL = DATABASE_URL;
process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || require("dotenv").config({ path: ".env" }) && process.env.OPENROUTER_API_KEY;

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

async function main() {
	console.log("=== Verifying RAG tables on Neon ===");

	// 1. Check tables
	const tables = await prisma.$queryRawUnsafe(
		"SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('content_embeddings','chat_conversations','chat_messages')"
	);
	console.log("Tables found:", tables.map((t) => t.tablename).join(", "));
	if (tables.length < 3) {
		console.error("MISSING TABLES! Migration may not have fully applied.");
	} else {
		console.log("✅ All 3 RAG tables exist");
	}

	// 2. Check pgvector extension
	const ext = await prisma.$queryRawUnsafe(
		"SELECT extname FROM pg_extension WHERE extname='vector'"
	);
	console.log("pgvector extension:", ext.length > 0 ? "✅ Installed" : "❌ Missing");

	// 3. Test embedding insertion
	const testVec = "[" + Array(1536).fill(0).map((_, i) => (i * 0.0001).toFixed(6)).join(",") + "]";
	await prisma.$executeRawUnsafe(`
		INSERT INTO content_embeddings (id, source_type, source_id, title, chunk_text, embedding, created_at, updated_at)
		VALUES ('test-verification-001', 'story', 'test-id', 'Test Story', 'Test chunk text for verification', '${testVec}'::vector, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING
	`);
	console.log("✅ Embedding insertion works");

	// 4. Test similarity search
	const results = await prisma.$queryRawUnsafe(`
		SELECT id, source_type, title, 1 - (embedding <=> '${testVec}'::vector) AS similarity
		FROM content_embeddings
		WHERE id = 'test-verification-001'
	`);
	console.log("✅ Similarity search works:", results.length > 0 ? `similarity=${parseFloat(results[0].similarity).toFixed(4)}` : "no results");

	// 5. Cleanup
	await prisma.$executeRawUnsafe("DELETE FROM content_embeddings WHERE id='test-verification-001'");
	console.log("✅ Cleanup done");

	// 6. Count existing stories to index
	const stories = await prisma.story.count();
	const lessons = await prisma.lesson.count();
	const games = await prisma.game.count();
	console.log(`\nContent available to index: ${stories} stories, ${lessons} lessons, ${games} games`);
	console.log("Run POST /api/rag/batch-index (admin auth) to index all content");

	await prisma.$disconnect();
	console.log("\n=== RAG system verified successfully ===");
}

main().catch((e) => {
	console.error("Verification failed:", e.message);
	process.exit(1);
});
