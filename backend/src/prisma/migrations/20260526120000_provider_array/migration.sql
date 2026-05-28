-- Convert provider enum to enum array to allow account linking
ALTER TABLE "users"
  ADD COLUMN "provider_new" "AuthProvider"[] NOT NULL DEFAULT ARRAY['email']::"AuthProvider"[];

UPDATE "users"
SET "provider_new" = ARRAY["provider"]::"AuthProvider"[];

ALTER TABLE "users" DROP COLUMN "provider";
ALTER TABLE "users" RENAME COLUMN "provider_new" TO "provider";
