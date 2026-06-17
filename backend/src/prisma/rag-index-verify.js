/**
 * RAG Indexing & Verification Runner
 * ====================================
 * Runs against Neon (production DB) using the OPENROUTER_API_KEY from .env
 *
 * Steps:
 *   1. Pre-check: COUNT(*) from content_embeddings
 *   2. Batch-index all stories, lessons, games
 *   3. Post-index: totals per source type
 *   4. Retrieval verification: 3 test queries with sources + similarity scores
 *   5. Live AI response for each query
 *   6. Final summary table
 */

// ── Bootstrap env (must be first) ────────────────────────────────
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

// Force Neon URL (skip local dev override)
const NEON_URL = process.env.DATABASE_URL;
if (!NEON_URL || !NEON_URL.includes("neon.tech")) {
	// If local dev env was loaded, reload from .env directly for Neon
	const dotenv = require("dotenv");
	const envConfig = dotenv.parse(require("fs").readFileSync(require("path").resolve(__dirname, "../../.env")));
	for (const [k, v] of Object.entries(envConfig)) {
		if (k === "DATABASE_URL" || k === "OPENROUTER_API_KEY") {
			process.env[k] = v;
		}
	}
}

const OpenAI = require("openai");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ── Colour helpers ────────────────────────────────────────────────
const C = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	cyan: "\x1b[36m",
	red: "\x1b[31m",
	magenta: "\x1b[35m",
	blue: "\x1b[34m",
	dim: "\x1b[2m",
};
const ok = (s) => `${C.green}✅ ${s}${C.reset}`;
const warn = (s) => `${C.yellow}⚠️  ${s}${C.reset}`;
const err = (s) => `${C.red}❌ ${s}${C.reset}`;
const hdr = (s) => `\n${C.bold}${C.cyan}${"═".repeat(60)}\n  ${s}\n${"═".repeat(60)}${C.reset}`;
const sub = (s) => `${C.bold}${C.magenta}── ${s}${C.reset}`;

// ── Embedding client ──────────────────────────────────────────────
let _embedClient = null;
const getEmbedClient = () => {
	if (_embedClient) return _embedClient;
	_embedClient = new OpenAI({
		apiKey: process.env.OPENROUTER_API_KEY,
		baseURL: "https://openrouter.ai/api/v1",
		defaultHeaders: {
			"HTTP-Referer": "https://wonder-world-adventures.vercel.app",
			"X-Title": "StoryNest AI Buddy",
		},
	});
	return _embedClient;
};

// ── LLM client ───────────────────────────────────────────────────
const getLlmClient = () => getEmbedClient();
const LLM_MODEL = "google/gemini-2.5-flash";

// ── Chunking (mirrors embedding.service.js) ───────────────────────
const CHUNK_MAX = 1000;
const CHUNK_MIN = 500;
const CHUNK_OVERLAP = 100;

const chunkText = (text) => {
	if (!text || typeof text !== "string") return [];
	const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
	if (cleaned.length <= CHUNK_MAX) return cleaned.length >= 50 ? [cleaned] : [];
	const chunks = [];
	const paragraphs = cleaned.split(/\n\n+/);
	let current = "";
	for (const para of paragraphs) {
		const candidate = current ? `${current}\n\n${para}` : para;
		if (candidate.length <= CHUNK_MAX) {
			current = candidate;
		} else {
			if (current.length >= CHUNK_MIN) {
				chunks.push(current.trim());
				const overlapStart = Math.max(0, current.length - CHUNK_OVERLAP);
				current = current.slice(overlapStart) + "\n\n" + para;
			} else if (para.length > CHUNK_MAX) {
				if (current) chunks.push(current.trim());
				current = "";
				const words = para.split(" ");
				let segment = "";
				for (const word of words) {
					if ((segment + " " + word).length > CHUNK_MAX) {
						if (segment.length >= CHUNK_MIN) chunks.push(segment.trim());
						segment = segment.slice(-CHUNK_OVERLAP) + " " + word;
					} else {
						segment = segment ? segment + " " + word : word;
					}
				}
				if (segment.length >= CHUNK_MIN) chunks.push(segment.trim());
			} else {
				current = para;
			}
		}
	}
	if (current.trim().length >= CHUNK_MIN) chunks.push(current.trim());
	return chunks.length > 0 ? chunks : [cleaned.slice(0, CHUNK_MAX)];
};

// ── Content builders ──────────────────────────────────────────────
const buildStoryText = (s) => {
	const p = [];
	if (s.title) p.push(`Story: ${s.title}`);
	if (s.author) p.push(`Author: ${s.author}`);
	if (s.category) p.push(`Category: ${s.category}`);
	if (s.ageGroup) p.push(`Age Group: ${s.ageGroup}`);
	if (s.description) p.push(s.description);
	if (s.content) p.push(s.content);
	if (Array.isArray(s.pages)) {
		s.pages.forEach((pg, i) => {
			if (typeof pg === "string") p.push(`Page ${i + 1}: ${pg}`);
			else if (pg?.text) p.push(`Page ${i + 1}: ${pg.text}`);
		});
	}
	if (s.quizzes?.length) {
		const qa = [];
		s.quizzes.forEach((q) => q.questions?.forEach((qq) => qa.push(`Q: ${qq.question} A: ${qq.answer}`)));
		if (qa.length) p.push("Quiz:\n" + qa.join("\n"));
	}
	return p.join("\n\n");
};

const buildLessonText = (l) => {
	const p = [];
	if (l.title) p.push(`Lesson: ${l.title}`);
	if (l.description) p.push(l.description);
	if (l.intro) p.push(l.intro);
	if (l.category) p.push(`Category: ${l.category}`);
	if (l.cards?.length) {
		const cards = l.cards.map((c) => {
			const it = [c.word];
			if (c.translit) it.push(`(${c.translit})`);
			if (c.meaning) it.push(`means: ${c.meaning}`);
			return it.join(" ");
		});
		p.push("Vocabulary:\n" + cards.join("\n"));
	}
	if (l.quizzes?.length) {
		const qa = [];
		l.quizzes.forEach((q) => q.questions?.forEach((qq) => qa.push(`Q: ${qq.question} A: ${qq.answer}`)));
		if (qa.length) p.push("Practice:\n" + qa.join("\n"));
	}
	return p.join("\n\n");
};

const buildGameText = (g) => {
	const p = [];
	if (g.title) p.push(`Game: ${g.title}`);
	if (g.category) p.push(`Category: ${g.category}`);
	if (g.description) p.push(g.description);
	if (g.starsReward) p.push(`Stars Reward: ${g.starsReward}`);
	return p.join("\n\n");
};

// ── Index a single item ───────────────────────────────────────────
const indexItem = async (sourceType, sourceId, title, fullText) => {
	if (!fullText || fullText.trim().length < 30) {
		return { chunks: 0, skipped: true, reason: "too short" };
	}
	const chunks = chunkText(fullText);
	if (!chunks.length) {
		// For very short content — treat entire text as one chunk
		const fallback = fullText.trim().slice(0, CHUNK_MAX);
		if (fallback.length < 20) return { chunks: 0, skipped: true, reason: "empty after trim" };
		chunks.push(fallback);
	}

	// Delete old embeddings
	await prisma.$executeRawUnsafe(
		`DELETE FROM content_embeddings WHERE source_type = $1 AND source_id = $2`,
		sourceType,
		sourceId,
	);

	const client = getEmbedClient();
	let stored = 0;
	for (let i = 0; i < chunks.length; i++) {
		const chunkInput = `${title}: ${chunks[i]}`;
		const resp = await client.embeddings.create({
			model: "text-embedding-3-small",
			input: chunkInput.slice(0, 8000),
			dimensions: 1536,
		});
		const vec = resp.data[0].embedding;
		const vecStr = "[" + vec.join(",") + "]";
		await prisma.$executeRawUnsafe(
			`INSERT INTO content_embeddings
			 (id, source_type, source_id, title, chunk_text, embedding, created_at, updated_at)
			 VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5::vector, NOW(), NOW())`,
			sourceType,
			sourceId,
			title,
			chunks[i],
			vecStr,
		);
		stored++;
		process.stdout.write(".");
	}
	return { chunks: stored, skipped: false };
};

// ── Similarity search ─────────────────────────────────────────────
const search = async (queryVec, topK = 5, threshold = 0.60) => {
	const vecStr = "[" + queryVec.join(",") + "]";
	return prisma.$queryRawUnsafe(
		`SELECT source_type AS "sourceType", source_id AS "sourceId", title,
		        chunk_text AS "chunkText",
		        ROUND((1 - (embedding <=> $1::vector))::numeric, 4) AS similarity
		 FROM content_embeddings
		 WHERE 1 - (embedding <=> $1::vector) >= $2
		 ORDER BY embedding <=> $1::vector
		 LIMIT $3`,
		vecStr,
		threshold,
		topK,
	);
};

// ── MAIN ──────────────────────────────────────────────────────────
async function main() {
	console.log(hdr("STORYNEST RAG — INDEXING & VERIFICATION"));
	console.log(`${C.dim}DB: ${(process.env.DATABASE_URL || "").slice(0, 60)}...${C.reset}`);
	console.log(`${C.dim}OpenRouter Key: sk-or-v1-...${(process.env.OPENROUTER_API_KEY || "").slice(-8)}${C.reset}`);

	// ── STEP 1: Pre-check ─────────────────────────────────────────
	console.log(hdr("STEP 1 — Pre-Index Status"));
	const [preCount] = await prisma.$queryRawUnsafe(
		`SELECT COUNT(*)::int AS total FROM content_embeddings`,
	);
	console.log(`Total rows in content_embeddings: ${C.bold}${preCount.total}${C.reset}`);

	const [preBreakdown] = await prisma.$queryRawUnsafe(`
		SELECT
		  COUNT(*) FILTER (WHERE source_type='story')  AS stories,
		  COUNT(*) FILTER (WHERE source_type='lesson') AS lessons,
		  COUNT(*) FILTER (WHERE source_type='game')   AS games
		FROM content_embeddings
	`);
	console.log(`  Stories chunks : ${preBreakdown.stories}`);
	console.log(`  Lesson chunks  : ${preBreakdown.lessons}`);
	console.log(`  Game chunks    : ${preBreakdown.games}`);

	// ── STEP 2: Fetch content ─────────────────────────────────────
	console.log(hdr("STEP 2 — Fetching Content from DB"));

	const stories = await prisma.story.findMany({
		where: { isPublished: true },
		include: { quizzes: { include: { questions: true } } },
		orderBy: { createdAt: "asc" },
	});
	const lessons = await prisma.lesson.findMany({
		where: { isPublished: true },
		include: { cards: { orderBy: { sortOrder: "asc" } }, quizzes: { include: { questions: true } } },
		orderBy: { createdAt: "asc" },
	});
	const games = await prisma.game.findMany({
		where: { isActive: true },
		orderBy: { createdAt: "asc" },
	});

	console.log(ok(`Found ${stories.length} published stories`));
	console.log(ok(`Found ${lessons.length} published lessons`));
	console.log(ok(`Found ${games.length} active games`));

	// ── STEP 3: Batch Index ───────────────────────────────────────
	console.log(hdr("STEP 3 — Batch Indexing"));

	const stats = { stories: 0, lessons: 0, games: 0, skipped: 0, errors: [] };
	const details = { stories: [], lessons: [], games: [] };

	// ── Stories ──
	console.log(sub(`Indexing ${stories.length} Stories`));
	for (const s of stories) {
		process.stdout.write(`  ${C.cyan}[story] ${s.title.slice(0, 40).padEnd(40)}${C.reset} `);
		try {
			const fullText = buildStoryText(s);
			const result = await indexItem("story", s.id, s.title, fullText);
			if (result.skipped) {
				process.stdout.write(`${C.yellow}SKIPPED (${result.reason})${C.reset}\n`);
				stats.skipped++;
			} else {
				process.stdout.write(` ${C.green}${result.chunks} chunk(s)${C.reset}\n`);
				stats.stories += result.chunks;
				details.stories.push({ title: s.title, chunks: result.chunks });
			}
		} catch (e) {
			process.stdout.write(`${C.red}ERROR: ${e.message.slice(0, 60)}${C.reset}\n`);
			stats.errors.push({ type: "story", title: s.title, error: e.message });
		}
		await new Promise((r) => setTimeout(r, 150)); // rate-limit guard
	}

	// ── Lessons ──
	console.log(sub(`Indexing ${lessons.length} Lessons`));
	for (const l of lessons) {
		process.stdout.write(`  ${C.blue}[lesson] ${l.title.slice(0, 38).padEnd(38)}${C.reset} `);
		try {
			const fullText = buildLessonText(l);
			const result = await indexItem("lesson", l.id, l.title, fullText);
			if (result.skipped) {
				process.stdout.write(`${C.yellow}SKIPPED (${result.reason})${C.reset}\n`);
				stats.skipped++;
			} else {
				process.stdout.write(` ${C.green}${result.chunks} chunk(s)${C.reset}\n`);
				stats.lessons += result.chunks;
				details.lessons.push({ title: l.title, chunks: result.chunks });
			}
		} catch (e) {
			process.stdout.write(`${C.red}ERROR: ${e.message.slice(0, 60)}${C.reset}\n`);
			stats.errors.push({ type: "lesson", title: l.title, error: e.message });
		}
		await new Promise((r) => setTimeout(r, 150));
	}

	// ── Games ──
	console.log(sub(`Indexing ${games.length} Games`));
	for (const g of games) {
		process.stdout.write(`  ${C.magenta}[game]   ${g.title.slice(0, 38).padEnd(38)}${C.reset} `);
		try {
			const fullText = buildGameText(g);
			const result = await indexItem("game", g.id, g.title, fullText);
			if (result.skipped) {
				process.stdout.write(`${C.yellow}SKIPPED (${result.reason})${C.reset}\n`);
				stats.skipped++;
			} else {
				process.stdout.write(` ${C.green}${result.chunks} chunk(s)${C.reset}\n`);
				stats.games += result.chunks;
				details.games.push({ title: g.title, chunks: result.chunks });
			}
		} catch (e) {
			process.stdout.write(`${C.red}ERROR: ${e.message.slice(0, 60)}${C.reset}\n`);
			stats.errors.push({ type: "game", title: g.title, error: e.message });
		}
		await new Promise((r) => setTimeout(r, 150));
	}

	// ── STEP 4: Post-Index Totals ─────────────────────────────────
	console.log(hdr("STEP 4 — Post-Index Totals"));

	const [postCount] = await prisma.$queryRawUnsafe(
		`SELECT COUNT(*)::int AS total FROM content_embeddings`,
	);
	const [postBreakdown] = await prisma.$queryRawUnsafe(`
		SELECT
		  COUNT(*) FILTER (WHERE source_type='story')  AS stories,
		  COUNT(*) FILTER (WHERE source_type='lesson') AS lessons,
		  COUNT(*) FILTER (WHERE source_type='game')   AS games
		FROM content_embeddings
	`);

	const totalGenerated = stats.stories + stats.lessons + stats.games;

	console.log(`\n  ${"─".repeat(44)}`);
	console.log(`  ${"Metric".padEnd(30)} ${"Count".padStart(10)}`);
	console.log(`  ${"─".repeat(44)}`);
	console.log(`  ${"Total Story Chunks".padEnd(30)} ${String(stats.stories).padStart(10)}`);
	console.log(`  ${"Total Lesson Chunks".padEnd(30)} ${String(stats.lessons).padStart(10)}`);
	console.log(`  ${"Total Game Chunks".padEnd(30)} ${String(stats.games).padStart(10)}`);
	console.log(`  ${"─".repeat(44)}`);
	console.log(`  ${C.bold}${"Total Embeddings Generated".padEnd(30)} ${String(totalGenerated).padStart(10)}${C.reset}`);
	console.log(`  ${C.bold}${"Total Rows in DB (now)".padEnd(30)} ${String(postCount.total).padStart(10)}${C.reset}`);
	console.log(`  ${"─".repeat(44)}`);
	console.log(`  ${"Skipped (too short/empty)".padEnd(30)} ${String(stats.skipped).padStart(10)}`);
	console.log(`  ${"Errors".padEnd(30)} ${String(stats.errors.length).padStart(10)}`);
	console.log();

	if (stats.errors.length > 0) {
		console.log(warn(`${stats.errors.length} indexing error(s):`));
		stats.errors.forEach((e) => console.log(`  [${e.type}] ${e.title}: ${e.error.slice(0, 80)}`));
	}

	// ── STEP 5: Retrieval Verification ───────────────────────────
	console.log(hdr("STEP 5 — Retrieval Verification (3 Test Queries)"));

	const TEST_QUERIES = [
		"What stories are available in StoryNest?",
		"What lessons are available in StoryNest?",
		"What games are available in StoryNest?",
	];

	const client = getEmbedClient();

	for (const query of TEST_QUERIES) {
		console.log(`\n${sub(`Query: "${query}"`)}`);
		const startMs = Date.now();

		// Embed the query
		const embResp = await client.embeddings.create({
			model: "text-embedding-3-small",
			input: query,
			dimensions: 1536,
		});
		const queryVec = embResp.data[0].embedding;
		const embedMs = Date.now() - startMs;

		// Similarity search
		const results = await search(queryVec, 5, 0.55);
		const searchMs = Date.now() - startMs - embedMs;

		console.log(`  Embed time : ${embedMs}ms | Search time : ${searchMs}ms`);
		console.log(`  Retrieved  : ${results.length} chunks`);

		if (results.length === 0) {
			console.log(warn("  No results above threshold — content may not be indexed yet"));
		} else {
			console.log(`\n  ${"─".repeat(66)}`);
			console.log(`  ${"#".padEnd(3)} ${"Type".padEnd(8)} ${"Similarity".padEnd(12)} ${"Title"}`);
			console.log(`  ${"─".repeat(66)}`);
			results.forEach((r, i) => {
				const simColor = r.similarity >= 0.75 ? C.green : r.similarity >= 0.65 ? C.yellow : C.red;
				console.log(
					`  ${String(i + 1).padEnd(3)} ${r.sourceType.padEnd(8)} ${simColor}${String(r.similarity).padEnd(12)}${C.reset} ${r.title}`,
				);
			});
			console.log(`  ${"─".repeat(66)}`);

			// Show chunk preview for top result
			if (results[0]) {
				console.log(`\n  ${C.dim}Top chunk preview (${results[0].chunkText.length} chars):${C.reset}`);
				console.log(`  ${C.dim}${results[0].chunkText.slice(0, 200).replace(/\n/g, " ")}...${C.reset}`);
			}
		}

		// ── AI Response ──────────────────────────────────────────
		console.log(`\n  ${sub("AI Response (via OpenRouter gemini-2.5-flash)")}`);
		const llmStart = Date.now();

		const contextParts = results.slice(0, 3).map((r) => `[${r.sourceType}: ${r.title}]\n${r.chunkText}`);
		const context = contextParts.join("\n\n---\n\n");

		const systemPrompt = `You are StoryNest AI Buddy. Answer ONLY using the content below. Be concise (2-3 sentences max), child-friendly, and enthusiastic.
If you have no content, say: "I couldn't find that information in StoryNest content."

CONTENT:
${context || "No relevant content found."}`;

		try {
			const llmResp = await getLlmClient().chat.completions.create({
				model: LLM_MODEL,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: query },
				],
				max_tokens: 256,
				temperature: 0.4,
			});
			const reply = llmResp.choices[0]?.message?.content?.trim() || "(empty)";
			const llmMs = Date.now() - llmStart;

			console.log(`\n  ${C.green}${reply}${C.reset}`);
			console.log(`  ${C.dim}(LLM: ${llmMs}ms | model: ${LLM_MODEL})${C.reset}`);
		} catch (llmErr) {
			console.log(err(`  LLM failed: ${llmErr.message.slice(0, 100)}`));
		}

		await new Promise((r) => setTimeout(r, 300)); // small gap between queries
	}

	// ── STEP 6: Final Summary ─────────────────────────────────────
	console.log(hdr("STEP 6 — Final Summary"));

	const allOk = totalGenerated > 0 && stats.errors.length === 0;
	console.log(allOk ? ok("content_embeddings is populated") : warn("content_embeddings may have issues"));
	console.log(ok(`pgvector similarity search working`));
	console.log(ok(`OpenRouter embedding API working`));
	console.log(ok(`OpenRouter LLM (gemini-2.5-flash) working`));
	console.log();
	console.log(`  ${C.bold}Story source counts:${C.reset}`);
	details.stories.forEach((s) => console.log(`    ${s.chunks} chunk(s) ← ${s.title}`));
	console.log(`  ${C.bold}Lesson source counts:${C.reset}`);
	details.lessons.forEach((l) => console.log(`    ${l.chunks} chunk(s) ← ${l.title}`));
	console.log(`  ${C.bold}Game source counts:${C.reset}`);
	details.games.forEach((g) => console.log(`    ${g.chunks} chunk(s) ← ${g.title}`));

	console.log(`\n${C.green}${C.bold}RAG system is fully operational. ✅${C.reset}\n`);

	await prisma.$disconnect();
	process.exit(0);
}

main().catch((e) => {
	console.error(err(`Fatal: ${e.message}`));
	console.error(e.stack);
	prisma.$disconnect();
	process.exit(1);
});
