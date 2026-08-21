-- CreateTable
CREATE TABLE IF NOT EXISTS "ai_prompt_settings" (
    "id" TEXT NOT NULL,
    "age_group" TEXT NOT NULL DEFAULT '3-12',
    "max_response_words" INTEGER NOT NULL DEFAULT 50,
    "language" TEXT NOT NULL DEFAULT 'en',
    "difficulty" TEXT NOT NULL DEFAULT 'beginner',
    "allowed_topics" TEXT[] DEFAULT ARRAY['Animals', 'Science', 'Mathematics', 'English Grammar', 'Stories', 'General Knowledge', 'Nature', 'Space & Planets', 'Fun Facts & Riddles', 'Creative Arts', 'Life Skills']::TEXT[],
    "safety_rules" TEXT[] DEFAULT ARRAY['No politics, elections, or government debates', 'No violence, weapons, gore, or self-harm', 'No adult content, profanity, or inappropriate language', 'No drugs, alcohol, vaping, or gambling', 'No medical diagnoses or personal data sharing']::TEXT[],
    "custom_instructions" TEXT,
    "response_tone" TEXT NOT NULL DEFAULT 'encouraging',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_prompt_settings_pkey" PRIMARY KEY ("id")
);
