/**
 * Quick diagnostic: test retrieval directly on Neon, try multiple approaches
 * to identify why similarity search returns 0 results.
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const OpenAI = require("openai");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const client = new OpenAI({
	apiKey: process.env.OPENROUTER_API_KEY,
	baseURL: "https://openrouter.ai/api/v1",
});

async function main() {
	console.log("=== RAG RETRIEVAL DIAGNOSTIC ===\n");

	// 1. Confirm rows exist
	const [cnt] = await prisma.$queryRawUnsafe("SELECT COUNT(*)::int AS n FROM content_embeddings");
	console.log(`Rows in content_embeddings: ${cnt.n}`);
	if (cnt.n === 0) { console.log("EMPTY TABLE — indexing did not persist!"); process.exit(1); }

	// 2. Check a sample row
	const sample = await prisma.$queryRawUnsafe(
		`SELECT id, source_type, title, LEFT(chunk_text, 80) AS preview,
		        embedding IS NOT NULL AS has_vec, pg_column_size(embedding) AS vec_bytes
		 FROM content_embeddings LIMIT 3`
	);
	console.log("\nSample rows:");
	sample.forEach(r => console.log(`  [${r.source_type}] ${r.title} | has_vec=${r.has_vec} | vec_bytes=${r.vec_bytes}`));
	console.log(`  preview: ${sample[0]?.preview}`);

	// 3. Generate a query embedding
	console.log("\nGenerating query embedding for 'What stories are available in StoryNest?'...");
	const resp = await client.embeddings.create({
		model: "text-embedding-3-small",
		input: "What stories are available in StoryNest?",
		dimensions: 1536,
	});
	const vec = resp.data[0].embedding;
	console.log(`  Embedding dims: ${vec.length}, first 5: [${vec.slice(0, 5).map(v => v.toFixed(4)).join(", ")}]`);

	// 4. Try direct cosine distance with NO threshold — just raw distances
	console.log("\nApproach A — Raw cosine distances (no threshold, top 5):");
	const vecStr = `[${vec.join(",")}]`;
	try {
		// Use tagged template literal (Prisma $queryRaw) instead of $queryRawUnsafe
		const rawResults = await prisma.$queryRaw`
			SELECT source_type, title,
			       ROUND((1 - (embedding <=> ${vecStr}::vector))::numeric, 4) AS similarity
			FROM content_embeddings
			ORDER BY embedding <=> ${vecStr}::vector
			LIMIT 5
		`;
		if (rawResults.length === 0) {
			console.log("  STILL 0 results — vector comparison failing");
		} else {
			rawResults.forEach((r, i) =>
				console.log(`  ${i+1}. [${r.source_type}] ${r.title} → similarity=${r.similarity}`)
			);
		}
	} catch(e) {
		console.log(`  Tagged template failed: ${e.message.slice(0, 120)}`);
	}

	// 5. Try with $queryRawUnsafe and inline literal (not parameter)
	console.log("\nApproach B — $queryRawUnsafe with inline literal vector:");
	try {
		const q = `
			SELECT source_type, title,
			       ROUND((1 - (embedding <=> '${vecStr}'::vector))::numeric, 4) AS similarity
			FROM content_embeddings
			ORDER BY embedding <=> '${vecStr}'::vector
			LIMIT 5
		`;
		const inlineResults = await prisma.$queryRawUnsafe(q);
		if (inlineResults.length === 0) {
			console.log("  STILL 0 results");
		} else {
			inlineResults.forEach((r, i) =>
				console.log(`  ${i+1}. [${r.source_type}] ${r.title} → similarity=${r.similarity}`)
			);
		}
	} catch(e) {
		console.log(`  Inline literal failed: ${e.message.slice(0, 120)}`);
	}

	// 6. Self-similarity test — embed a stored chunk's title and search
	console.log("\nApproach C — Self-similarity (embed title of first stored chunk):");
	try {
		const [first] = await prisma.$queryRawUnsafe(
			`SELECT title, chunk_text FROM content_embeddings LIMIT 1`
		);
		const selfResp = await client.embeddings.create({
			model: "text-embedding-3-small",
			input: `${first.title}: ${first.chunk_text.slice(0, 200)}`,
			dimensions: 1536,
		});
		const selfVec = selfResp.data[0].embedding;
		const selfStr = `[${selfVec.join(",")}]`;

		const selfResults = await prisma.$queryRawUnsafe(`
			SELECT source_type, title,
			       ROUND((1 - (embedding <=> '${selfStr}'::vector))::numeric, 4) AS similarity
			FROM content_embeddings
			ORDER BY embedding <=> '${selfStr}'::vector
			LIMIT 3
		`);
		selfResults.forEach((r, i) =>
			console.log(`  ${i+1}. [${r.source_type}] ${r.title} → similarity=${r.similarity}`)
		);
	} catch(e) {
		console.log(`  Self-similarity failed: ${e.message.slice(0, 120)}`);
	}

	await prisma.$disconnect();
}

main().catch(e => {
	console.error("Diagnostic failed:", e.message);
	console.error(e.stack?.split("\n").slice(0, 6).join("\n"));
	process.exit(1);
});
