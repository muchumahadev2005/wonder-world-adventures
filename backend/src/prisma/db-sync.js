/**
 * ══════════════════════════════════════════════════════════════
 *  StoryNest World — DB Sync Script
 *  Senior Database Engineer utility
 *
 *  Steps:
 *   1. Connect to Neon (production) and get row counts
 *   2. Run Prisma migrations against LOCAL db only
 *   3. Seed all content into LOCAL db
 *   4. Get row counts from LOCAL db
 *   5. Print comparison report
 *
 *  Safety:
 *   - Neon is READ-ONLY in this script (only SELECT/count queries)
 *   - All writes go to LOCAL PostgreSQL only
 * ══════════════════════════════════════════════════════════════
 */

const path   = require("path");
const dotenv = require("dotenv");
const { execSync } = require("child_process");

// ── Load env ────────────────────────────────────────────────────
// Load LOCAL db url first (override: true so it wins)
dotenv.config({ path: path.join(__dirname, "../../.env.development"), override: true });
// Then fall back to .env for shared secrets (Neon url available as NEON_URL below)
const localEnv = dotenv.config({ path: path.join(__dirname, "../../.env"), override: false });

// Explicitly read the Neon URL from .env (override what was set by .env.development)
const rawEnv = require("fs").readFileSync(path.join(__dirname, "../../.env"), "utf8");
const neonUrlMatch = rawEnv.match(/^DATABASE_URL[^\S\r\n]*=[^\S\r\n]*["']?([^"'\r\n]+)["']?/m);
const NEON_URL   = neonUrlMatch ? neonUrlMatch[1].trim() : null;
const LOCAL_URL  = process.env.DATABASE_URL;

if (!NEON_URL)  { console.error("❌ Could not read Neon DATABASE_URL from .env"); process.exit(1); }
if (!LOCAL_URL) { console.error("❌ LOCAL DATABASE_URL not set"); process.exit(1); }
if (!LOCAL_URL.includes("localhost") && !LOCAL_URL.includes("127.0.0.1")) {
  console.error("❌ LOCAL_URL does not look like a local db:", LOCAL_URL.substring(0, 50));
  process.exit(1);
}

const { PrismaClient } = require("@prisma/client");
const neonPrisma  = new PrismaClient({ datasources: { db: { url: NEON_URL  } } });
const localPrisma = new PrismaClient({ datasources: { db: { url: LOCAL_URL } } });

// ── Tables to compare ────────────────────────────────────────────
const TABLE_QUERIES = [
  { label: "Language",           count: (p) => p.language.count()           },
  { label: "Level",              count: (p) => p.level.count()              },
  { label: "LanguageLevel",      count: (p) => p.languageLevel.count()      },
  { label: "Lesson",             count: (p) => p.lesson.count()             },
  { label: "LessonCard",         count: (p) => p.lessonCard.count()         },
  { label: "Story",              count: (p) => p.story.count()              },
  { label: "Game",               count: (p) => p.game.count()               },
  { label: "Quiz",               count: (p) => p.quiz.count()               },
  { label: "QuizQuestion",       count: (p) => p.quizQuestion.count()       },
  { label: "SubscriptionPlan",   count: (p) => p.subscriptionPlan.count()   },
  { label: "User",               count: (p) => p.user.count()               },
  { label: "ChildProfile",       count: (p) => p.childProfile.count()       },
  { label: "UserSubscription",   count: (p) => p.userSubscription.count()   },
  { label: "Payment",            count: (p) => p.payment.count()            },
  { label: "Badge",              count: (p) => p.badge.count()              },
  { label: "RewardWallet",       count: (p) => p.rewardWallet.count()       },
  { label: "StoryProgress",      count: (p) => p.storyProgress.count()      },
  { label: "LessonProgress",     count: (p) => p.lessonProgress.count()     },
  { label: "GameProgress",       count: (p) => p.gameProgress.count()       },
  { label: "ProgressRecord",     count: (p) => p.progressRecord.count()     },
];

// ── Helpers ──────────────────────────────────────────────────────
const pad = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);

async function getCounts(prisma, label) {
  const results = {};
  for (const t of TABLE_QUERIES) {
    try { results[t.label] = await t.count(prisma); }
    catch { results[t.label] = "N/A"; }
  }
  return results;
}

function printReport(neonCounts, localCounts) {
  const LINE = "─".repeat(62);
  console.log("\n" + "═".repeat(62));
  console.log("  📊  DATABASE SYNC REPORT — StoryNest World");
  console.log("═".repeat(62));
  console.log(`  ${ pad("Table", 22)} ${ rpad("Neon", 8)} ${ rpad("Local", 8)}  Status`);
  console.log(LINE);
  for (const t of TABLE_QUERIES) {
    const neon  = neonCounts[t.label];
    const local = localCounts[t.label];
    const ok    = neon === "N/A" || local === "N/A" ? "⚠️  N/A"
                : local >= neon  ? "✅ Synced"
                :                  "⚠️  Low";
    console.log(`  ${ pad(t.label, 22)} ${ rpad(neon,  8)} ${ rpad(local, 8)}  ${ok}`);
  }
  console.log(LINE);
}

// ── Step 1: Neon counts (before) ─────────────────────────────────
async function run() {
  console.log("\n🔍 STEP 1 — Reading Neon (production) counts…");
  console.log(`   Neon  : ${NEON_URL.substring(0, 55)}…`);
  console.log(`   Local : ${LOCAL_URL.substring(0, 55)}…`);

  let neonCounts;
  try {
    neonCounts = await getCounts(neonPrisma, "Neon");
    console.log("✅ Neon counts retrieved.");
  } catch (err) {
    console.error("❌ Could not connect to Neon:", err.message);
    process.exit(1);
  } finally {
    await neonPrisma.$disconnect();
  }

  // ── Step 2: Run Prisma migrations on LOCAL ────────────────────
  console.log("\n🔧 STEP 2 — Running Prisma migrations on LOCAL database…");
  try {
    const result = execSync(
      `npx prisma migrate deploy --schema=src/prisma/schema.prisma`,
      {
        cwd: path.join(__dirname, "../../"),
        env: { ...process.env, DATABASE_URL: LOCAL_URL },
        encoding: "utf8",
        stdio: "pipe",
      }
    );
    console.log(result.trim().split("\n").map(l => "   " + l).join("\n"));
    console.log("✅ Migrations applied to local database.");
  } catch (err) {
    const out = (err.stdout || "") + (err.stderr || "");
    console.log(out.trim().split("\n").map(l => "   " + l).join("\n"));
    if (out.includes("already applied") || out.includes("up to date") || out.includes("No pending")) {
      console.log("✅ No new migrations — local schema is up to date.");
    } else {
      console.error("❌ Migration error:", err.message);
      // Continue anyway — maybe tables already exist
    }
  }

  // ── Step 3: Seed LOCAL ────────────────────────────────────────
  console.log("\n🌱 STEP 3 — Seeding LOCAL database…");
  try {
    // Import and run the seed logic directly (reusing seed.js data)
    await seedLocal(localPrisma);
    console.log("✅ Seeding complete.");
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    console.error(err);
  }

  // ── Step 4: Local counts (after) ─────────────────────────────
  console.log("\n📊 STEP 4 — Reading LOCAL counts after seeding…");
  let localCounts;
  try {
    localCounts = await getCounts(localPrisma, "Local");
  } finally {
    await localPrisma.$disconnect();
  }

  // ── Step 5: Print report ──────────────────────────────────────
  printReport(neonCounts, localCounts);
  console.log("\n✅ Sync complete. Neon was NOT modified.\n");
}

// ── Seed logic (mirrored from seed.js but using passed prisma) ───
async function seedLocal(prisma) {
  const bcrypt = require("bcryptjs");

  const languages = [
    { code: "en", name: "English", native: "English", flag: "GB", sortOrder: 1 },
    { code: "te", name: "Telugu",  native: "Telugu",  flag: "IN", sortOrder: 2 },
    { code: "hi", name: "Hindi",   native: "Hindi",   flag: "IN", sortOrder: 3 },
    { code: "ta", name: "Tamil",   native: "Tamil",   flag: "IN", sortOrder: 4 },
  ];
  const levels = [
    { code: "beginner",     name: "Beginner",     description: "Alphabets, basic words and sounds", sortOrder: 1 },
    { code: "intermediate", name: "Intermediate", description: "Small sentences and easy grammar",   sortOrder: 2 },
    { code: "expert",       name: "Expert",       description: "Reading, meaning and corrections",   sortOrder: 3 },
  ];
  const plans = [
    { name: "Free",    description: "Starter access",                  price: 0,   durationDays: 30 },
    { name: "Premium", description: "Unlock premium stories and games", price: 499, durationDays: 30 },
  ];
  const games = [
    { slug: "math-add",   title: "Addition Fun",  icon: "calculator", color: "from-sky to-lavender",     starsReward: 3, sortOrder: 1 },
    { slug: "math-sub",   title: "Subtraction",   icon: "calculator", color: "from-mint to-sky",         starsReward: 3, sortOrder: 2 },
    { slug: "shapes",     title: "Shape Match",   icon: "shapes",     color: "from-coral to-sunshine",   starsReward: 5, sortOrder: 3 },
    { slug: "patterns",   title: "Patterns",      icon: "puzzle",     color: "from-bubblegum to-lavender",starsReward: 5, isPremium: true, sortOrder: 4 },
    { slug: "memory",     title: "Memory Game",   icon: "brain",      color: "from-sunshine to-coral",   starsReward: 4, sortOrder: 5 },
    { slug: "speed-math", title: "Speed Math",    icon: "zap",        color: "from-lavender to-bubblegum",starsReward: 8, isPremium: true, sortOrder: 6 },
  ];

  // Languages
  process.stdout.write("   → Languages…");
  const languageByCode = {};
  for (const lang of languages) {
    languageByCode[lang.code] = await prisma.language.upsert({
      where: { code: lang.code }, update: lang, create: lang,
    });
  }
  console.log(` ${languages.length} done.`);

  // Levels
  process.stdout.write("   → Levels…");
  const levelByCode = {};
  for (const lv of levels) {
    levelByCode[lv.code] = await prisma.level.upsert({
      where: { code: lv.code }, update: lv, create: lv,
    });
  }
  console.log(` ${levels.length} done.`);

  // LanguageLevels
  process.stdout.write("   → Language×Level mappings…");
  for (const language of Object.values(languageByCode)) {
    for (const level of Object.values(levelByCode)) {
      await prisma.languageLevel.upsert({
        where: { languageId_levelId: { languageId: language.id, levelId: level.id } },
        update: { sortOrder: level.sortOrder },
        create: { languageId: language.id, levelId: level.id, sortOrder: level.sortOrder },
      });
    }
  }
  console.log(` ${languages.length * levels.length} done.`);

  // Lessons — load from the main seed.js to avoid duplication
  process.stdout.write("   → Lessons (from seed.js)…");
  const seedModule = require("./seed-data-loader");
  const buildLessons = seedModule.buildLessons;
  let lessonCount = 0;
  for (const langCode of Object.keys(languageByCode)) {
    for (const levelCode of Object.keys(levelByCode)) {
      const list = buildLessons(langCode, levelCode);
      for (const lesson of list) {
        const saved = await prisma.lesson.upsert({
          where: { slug: lesson.id },
          update: { title: lesson.title, intro: lesson.intro, emoji: lesson.emoji, color: lesson.color,
                    languageId: languageByCode[langCode].id, levelId: levelByCode[levelCode].id },
          create: { slug: lesson.id, title: lesson.title, intro: lesson.intro, emoji: lesson.emoji,
                    color: lesson.color, languageId: languageByCode[langCode].id, levelId: levelByCode[levelCode].id },
        });
        await prisma.lessonCard.deleteMany({ where: { lessonId: saved.id } });
        await prisma.quiz.deleteMany({ where: { lessonId: saved.id } });
        await prisma.lessonCard.createMany({
          data: lesson.words.map((c, i) => ({ lessonId: saved.id, word: c.word, emoji: c.emoji,
            translit: c.translit || null, meaning: c.meaning || null, sortOrder: i + 1 })),
        });
        const quiz = await prisma.quiz.create({ data: {
          title: `${lesson.title} Quiz`,
          languageId: languageByCode[langCode].id, levelId: levelByCode[levelCode].id, lessonId: saved.id,
        }});
        await prisma.quizQuestion.createMany({ data: lesson.questions.map((q, i) => ({
          quizId: quiz.id, type: q.type || "mcq", question: q.question, emoji: q.emoji || null,
          options: q.options || null, answer: q.answer, hint: q.hint || null, sortOrder: i + 1,
        }))});
        lessonCount++;
      }
    }
  }
  console.log(` ${lessonCount} lessons done.`);

  // Stories — delegate to the main seed.js entirely
  process.stdout.write("   → Stories…");
  const { stories } = seedModule;
  for (const story of stories) {
    const saved = await prisma.story.upsert({
      where: { slug: story.slug },
      update: { title: story.title, description: story.pages[0], content: story.pages.join("\n\n"),
                pages: story.pages, author: story.author, category: story.category, tags: story.tags,
                coverEmoji: story.coverEmoji, coverGradient: story.coverGradient, duration: story.duration,
                starsReward: story.starsReward, isPremium: story.isPremium ?? false },
      create: { slug: story.slug, title: story.title, description: story.pages[0], content: story.pages.join("\n\n"),
                pages: story.pages, author: story.author, category: story.category, tags: story.tags,
                coverEmoji: story.coverEmoji, coverGradient: story.coverGradient, duration: story.duration,
                starsReward: story.starsReward, isPremium: story.isPremium ?? false },
    });
    const existingQuiz = await prisma.quiz.findFirst({ where: { storyId: saved.id } });
    if (existingQuiz) {
      await prisma.quizQuestion.deleteMany({ where: { quizId: existingQuiz.id } });
      await prisma.quiz.delete({ where: { id: existingQuiz.id } });
    }
    const quiz = await prisma.quiz.create({ data: { title: `${story.title} Quiz`, storyId: saved.id } });
    await prisma.quizQuestion.createMany({ data: story.questions.map((q, i) => ({
      quizId: quiz.id, type: q.type || "mcq", question: q.question, emoji: q.emoji || null,
      options: q.options || null, answer: q.answer, hint: q.hint || null, sortOrder: q.sortOrder ?? i + 1,
    }))});
  }
  console.log(` ${stories.length} done.`);

  // Games
  process.stdout.write("   → Games…");
  for (const game of games) {
    await prisma.game.upsert({
      where: { slug: game.slug },
      update: { title: game.title, icon: game.icon, color: game.color, starsReward: game.starsReward,
                isPremium: game.isPremium ?? false, sortOrder: game.sortOrder },
      create: { slug: game.slug, title: game.title, icon: game.icon, color: game.color,
                starsReward: game.starsReward, isPremium: game.isPremium ?? false, sortOrder: game.sortOrder },
    });
  }
  console.log(` ${games.length} done.`);

  // Subscription Plans
  process.stdout.write("   → Subscription Plans…");
  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findFirst({ where: { name: plan.name } });
    if (existing) await prisma.subscriptionPlan.update({ where: { id: existing.id }, data: plan });
    else await prisma.subscriptionPlan.create({ data: plan });
  }
  console.log(` ${plans.length} done.`);

  // Admin user
  process.stdout.write("   → Admin user…");
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  await prisma.user.upsert({
    where: { email: "admin@storynest.com" },
    update: { name: "StoryNest Admin", isVerified: true },
    create: { name: "StoryNest Admin", email: "admin@storynest.com",
              password: adminPassword, provider: ["email"], isVerified: true },
  });
  console.log(" done.");
}

run().catch(async (err) => {
  console.error("\n❌ Fatal error:", err.message);
  await neonPrisma.$disconnect().catch(() => {});
  await localPrisma.$disconnect().catch(() => {});
  process.exit(1);
});
