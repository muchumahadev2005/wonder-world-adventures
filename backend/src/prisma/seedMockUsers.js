// ── Mock User Seed Script ─────────────────────────────────────────
// Creates test user accounts with child profiles & reward wallets.
// Run with: node src/prisma/seedMockUsers.js
//
// Mock Credentials:
//   📧 testuser1@storynest.com  / Test@1234  (free user)
//   📧 testuser2@storynest.com  / Test@1234  (premium user)
//   📧 testuser3@storynest.com  / Test@1234  (free user)

const path   = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../../.env.development") });
dotenv.config({ path: path.join(__dirname, "../../.env"), override: false });

const bcrypt     = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

// ── Mock user definitions ─────────────────────────────────────────
const MOCK_USERS = [
  {
    name:              "Aarav Sharma",
    email:             "testuser1@storynest.com",
    password:          "Test@1234",
    isPremium:         false,
    child: {
      name:               "Aarav",
      ageGroup:           "6-8",
      favoriteColor:      "Blue",
      favoriteCharacter:  "Dragon",
    },
    wallet: { stars: 15, coins: 120, xp: 240, level: 2, streak: 3 },
  },
  {
    name:              "Priya Reddy",
    email:             "testuser2@storynest.com",
    password:          "Test@1234",
    isPremium:         true,
    child: {
      name:               "Priya",
      ageGroup:           "9-11",
      favoriteColor:      "Purple",
      favoriteCharacter:  "Unicorn",
    },
    wallet: { stars: 85, coins: 670, xp: 1340, level: 5, streak: 12 },
  },
  {
    name:              "Rohan Patel",
    email:             "testuser3@storynest.com",
    password:          "Test@1234",
    isPremium:         false,
    child: {
      name:               "Rohan",
      ageGroup:           "3-5",
      favoriteColor:      "Green",
      favoriteCharacter:  "Dinosaur",
    },
    wallet: { stars: 5, coins: 40, xp: 80, level: 1, streak: 1 },
  },
];

// ── Main seeder ───────────────────────────────────────────────────
async function seedMockUsers() {
  console.log("\n🌱  Seeding mock users...\n");

  const hashedPassword = await bcrypt.hash("Test@1234", 10);

  for (const mock of MOCK_USERS) {
    try {
      // 1. Upsert User
      const user = await prisma.user.upsert({
        where:  { email: mock.email },
        update: {
          password:   hashedPassword,
          isVerified: true,
          name:       mock.name,
        },
        create: {
          name:       mock.name,
          email:      mock.email,
          password:   hashedPassword,
          provider:   ["email"],
          isVerified: true,
        },
      });

      // 2. Upsert ChildProfile
      const child = await prisma.childProfile.upsert({
        where:  { userId: user.id },
        update: {
          name:               mock.child.name,
          ageGroup:           mock.child.ageGroup,
          favoriteColor:      mock.child.favoriteColor,
          favoriteCharacter:  mock.child.favoriteCharacter,
        },
        create: {
          userId:             user.id,
          name:               mock.child.name,
          ageGroup:           mock.child.ageGroup,
          favoriteColor:      mock.child.favoriteColor,
          favoriteCharacter:  mock.child.favoriteCharacter,
        },
      });

      // 3. Upsert RewardWallet
      await prisma.rewardWallet.upsert({
        where:  { childProfileId: child.id },
        update: {
          stars:   mock.wallet.stars,
          coins:   mock.wallet.coins,
          xp:      mock.wallet.xp,
          level:   mock.wallet.level,
          streak:  mock.wallet.streak,
        },
        create: {
          childProfileId: child.id,
          stars:          mock.wallet.stars,
          coins:          mock.wallet.coins,
          xp:             mock.wallet.xp,
          level:          mock.wallet.level,
          streak:         mock.wallet.streak,
        },
      });

      // 4. If premium, add an active subscription (requires a plan to exist)
      if (mock.isPremium) {
        const plan = await prisma.subscriptionPlan.findFirst({
          where: { isActive: true },
          orderBy: { price: "asc" },
        });

        if (plan) {
          const existingSub = await prisma.userSubscription.findFirst({
            where: { userId: user.id, status: "ACTIVE" },
          });
          if (!existingSub) {
            await prisma.userSubscription.create({
              data: {
                userId:    user.id,
                planId:    plan.id,
                status:    "ACTIVE",
                startDate: new Date(),
                endDate:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              },
            });
          }
        }
      }

      const icon = mock.isPremium ? "👑" : "👤";
      console.log(`  ${icon}  ${mock.name}`);
      console.log(`      Email:    ${mock.email}`);
      console.log(`      Password: Test@1234`);
      console.log(`      Child:    ${mock.child.name} (age ${mock.child.ageGroup})`);
      console.log(`      Stars: ${mock.wallet.stars} | XP: ${mock.wallet.xp} | Level: ${mock.wallet.level}`);
      console.log(`      Plan:  ${mock.isPremium ? "Premium ✅" : "Free"}`);
      console.log();

    } catch (err) {
      console.error(`  ❌  Failed for ${mock.email}:`, err.message);
    }
  }

  console.log("✅  Mock users seeded successfully!\n");
  console.log("─".repeat(50));
  console.log("  Login credentials (all use password: Test@1234)");
  console.log("─".repeat(50));
  MOCK_USERS.forEach((u) => {
    console.log(`  ${u.isPremium ? "👑 Premium" : "👤 Free   "} │ ${u.email}`);
  });
  console.log("─".repeat(50));
  console.log();
}

seedMockUsers()
  .catch((err) => {
    console.error("❌ Seeder crashed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
