require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
// Force Neon connection for tests
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_g4iUeLGwtDV7@ep-cool-mountain-apjj5xbt.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";

const { processQuestion } = require("./rag.service");

async function test() {
	console.log("=== RAG END-TO-END VERIFICATION (THRESHOLD = 0.30) ===");
	
	const queries = [
		"What stories are available in StoryNest?",
		"Tell me about The Enchanted Forest.",
		"What lessons are available?",
		"What games are available?"
	];

	for (const q of queries) {
		console.log(`\n\nQ: "${q}"`);
		console.log("-".repeat(50));
		const result = await processQuestion({
			message: q,
			sessionId: "test-session",
		});
		
		console.log(`Sources (${result.sources.length}):`);
		result.sources.forEach(s => console.log(`  - [${s.type}] ${s.title}`));
		console.log(`\nReply:\n${result.reply}`);
	}
	
	process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
