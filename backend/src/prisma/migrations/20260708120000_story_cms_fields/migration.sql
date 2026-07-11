-- AlterTable: Add new production-ready fields to stories table
-- Migration: 20260708120000_story_cms_fields
-- All changes are additive (no columns removed, no existing data affected)

ALTER TABLE "stories"
  ADD COLUMN IF NOT EXISTS "subtitle" TEXT,
  ADD COLUMN IF NOT EXISTS "cover_image" TEXT,
  ADD COLUMN IF NOT EXISTS "difficulty" TEXT,
  ADD COLUMN IF NOT EXISTS "listening_time" INTEGER,
  ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_trending" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_recommended" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "read_aloud_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "narrator_voice" TEXT,
  ADD COLUMN IF NOT EXISTS "xp_reward" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "likes_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reads_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "favorites_count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stories_is_featured_idx" ON "stories"("is_featured");
CREATE INDEX IF NOT EXISTS "stories_is_trending_idx" ON "stories"("is_trending");
CREATE INDEX IF NOT EXISTS "stories_difficulty_idx" ON "stories"("difficulty");
