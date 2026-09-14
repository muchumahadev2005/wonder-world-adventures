-- CreateTable
CREATE TABLE IF NOT EXISTS "storyweaver_audios" (
    "id" TEXT NOT NULL,
    "sw_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'English',
    "level" TEXT,
    "description" TEXT,
    "synopsis" TEXT,
    "cover_image" TEXT,
    "authors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "illustrators" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publisher" TEXT,
    "reads_count" INTEGER NOT NULL DEFAULT 0,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "is_audio" BOOLEAN NOT NULL DEFAULT true,
    "audio_path" TEXT,
    "vtt_file_path" TEXT,
    "page_timestamps" JSONB,
    "pages" JSONB,
    "total_pages" INTEGER NOT NULL DEFAULT 0,
    "orientation" TEXT DEFAULT 'landscape',
    "is_synced" BOOLEAN NOT NULL DEFAULT true,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storyweaver_audios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "storyweaver_audios_sw_id_key" ON "storyweaver_audios"("sw_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "storyweaver_audios_slug_key" ON "storyweaver_audios"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "storyweaver_audios_language_idx" ON "storyweaver_audios"("language");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "storyweaver_audios_level_idx" ON "storyweaver_audios"("level");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "storyweaver_audios_is_audio_idx" ON "storyweaver_audios"("is_audio");
