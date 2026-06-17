-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ContentEmbedding table: stores chunked text + embedding vectors
CREATE TABLE IF NOT EXISTS "content_embeddings" (
    "id"          TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id"   TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "chunk_text"  TEXT NOT NULL,
    "embedding"   vector(1536),
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_embeddings_pkey" PRIMARY KEY ("id")
);

-- Indexes for content_embeddings
CREATE INDEX IF NOT EXISTS "content_embeddings_source_type_source_id_idx"
    ON "content_embeddings"("source_type", "source_id");

-- ChatConversation table
CREATE TABLE IF NOT EXISTS "chat_conversations" (
    "id"         TEXT NOT NULL,
    "user_id"    TEXT,
    "session_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "chat_conversations_session_id_idx"
    ON "chat_conversations"("session_id");
CREATE INDEX IF NOT EXISTS "chat_conversations_user_id_idx"
    ON "chat_conversations"("user_id");

-- ChatMessage table
CREATE TABLE IF NOT EXISTS "chat_messages" (
    "id"              TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role"            TEXT NOT NULL,
    "content"         TEXT NOT NULL,
    "sources"         JSONB,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "chat_messages_conversation_id_idx"
    ON "chat_messages"("conversation_id");

-- Foreign key: chat_messages → chat_conversations (cascade delete)
ALTER TABLE "chat_messages"
    ADD CONSTRAINT "chat_messages_conversation_id_fkey"
    FOREIGN KEY ("conversation_id")
    REFERENCES "chat_conversations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
