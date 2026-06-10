// Quick admin seed script - run with: node src/prisma/seedAdmin.js
const path = require("path");
const dotenv = require("dotenv");

// Load .env.development first (local DB overrides Neon URL),
// then fall back to .env for any remaining keys.
dotenv.config({ path: path.join(__dirname, "../../.env.development") });
dotenv.config({ path: path.join(__dirname, "../../.env"), override: false });
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function seedAdmin() {
  try {
    console.log("Connecting to database...");
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = await prisma.user.upsert({
      where: { email: "admin@storynest.com" },
      update: {
        password: hashedPassword,
        isVerified: true,
        name: "StoryNest Admin",
      },
      create: {
        name: "StoryNest Admin",
        email: "admin@storynest.com",
        password: hashedPassword,
        provider: ["email"],
        isVerified: true,
      },
    });

    console.log("✅ Admin user seeded successfully!");
    console.log("   Email:", admin.email);
    console.log("   Password: Admin@123");
    console.log("   ID:", admin.id);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    console.log("\n--- Alternative: Run this SQL in Neon DB console ---");
    const bcrypt2 = require("bcryptjs");
    const hash = await bcrypt2.hash("Admin@123", 10);
    console.log(`
INSERT INTO users (id, name, email, password, provider, is_verified, created_at)
VALUES (
  gen_random_uuid(),
  'StoryNest Admin',
  'admin@storynest.com',
  '${hash}',
  ARRAY['email']::text[],
  true,
  NOW()
)
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password, is_verified = true, name = EXCLUDED.name;
    `);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
