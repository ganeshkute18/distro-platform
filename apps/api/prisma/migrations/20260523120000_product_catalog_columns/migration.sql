-- Align products table with schema.prisma (hsnCode, brand, tags)
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "hsnCode" TEXT,
  ADD COLUMN IF NOT EXISTS "brand" TEXT,
  ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
