-- prisma-migrate-disable-transaction
-- SaaS hardening v2: PLATFORM_ADMIN, MALL customer type, pricing snapshots, tenantId NOT NULL.
-- Enum changes are committed before dependent DDL (PostgreSQL requirement).

-- ─── Enum: PLATFORM_ADMIN ───────────────────────────────────────────────────
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PLATFORM_ADMIN' BEFORE 'OWNER';

-- ─── Enum: MALL (CustomerType) ──────────────────────────────────────────────
ALTER TYPE "CustomerType" ADD VALUE IF NOT EXISTS 'MALL' BEFORE 'DISTRIBUTOR';

-- ─── Order item pricing snapshots ───────────────────────────────────────────
ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "basePrice"       INTEGER,
  ADD COLUMN IF NOT EXISTS "appliedRuleId"   TEXT,
  ADD COLUMN IF NOT EXISTS "appliedRuleName" TEXT,
  ADD COLUMN IF NOT EXISTS "priceType"       "PriceType",
  ADD COLUMN IF NOT EXISTS "discountAmount"  INTEGER NOT NULL DEFAULT 0;

UPDATE "order_items" SET "basePrice" = "unitPrice" WHERE "basePrice" IS NULL;

ALTER TABLE "order_items" ALTER COLUMN "basePrice" SET NOT NULL;

-- ─── One app_settings row per tenant ────────────────────────────────────────
DELETE FROM "app_settings" a
  USING "app_settings" b
  WHERE a.id < b.id
    AND a."tenantId" = b."tenantId"
    AND a."tenantId" IS NOT NULL;

ALTER TABLE "app_settings"
  DROP CONSTRAINT IF EXISTS "app_settings_tenantId_key";

ALTER TABLE "app_settings"
  ADD CONSTRAINT "app_settings_tenantId_key" UNIQUE ("tenantId");

-- ─── Remove pre-multitenant orphan rows (e.g. app_settings from nath_sales seed) ─
DELETE FROM "app_settings"  WHERE "tenantId" IS NULL;
DELETE FROM "agencies"      WHERE "tenantId" IS NULL;
DELETE FROM "categories"    WHERE "tenantId" IS NULL;
DELETE FROM "products"      WHERE "tenantId" IS NULL;
DELETE FROM "orders"        WHERE "tenantId" IS NULL;
DELETE FROM "notifications" WHERE "tenantId" IS NULL;
DELETE FROM "audit_logs"    WHERE "tenantId" IS NULL;
DELETE FROM "invitations"   WHERE "tenantId" IS NULL;

-- ─── Enforce tenantId NOT NULL (fails if legacy rows still lack tenantId) ───
DO $$
DECLARE
  null_agencies      INTEGER;
  null_categories    INTEGER;
  null_products      INTEGER;
  null_orders        INTEGER;
  null_notifications INTEGER;
  null_audit_logs    INTEGER;
  null_app_settings  INTEGER;
  null_invitations   INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_agencies      FROM "agencies"      WHERE "tenantId" IS NULL;
  SELECT COUNT(*) INTO null_categories    FROM "categories"    WHERE "tenantId" IS NULL;
  SELECT COUNT(*) INTO null_products      FROM "products"      WHERE "tenantId" IS NULL;
  SELECT COUNT(*) INTO null_orders        FROM "orders"        WHERE "tenantId" IS NULL;
  SELECT COUNT(*) INTO null_notifications FROM "notifications" WHERE "tenantId" IS NULL;
  SELECT COUNT(*) INTO null_audit_logs    FROM "audit_logs"    WHERE "tenantId" IS NULL;
  SELECT COUNT(*) INTO null_app_settings  FROM "app_settings"  WHERE "tenantId" IS NULL;
  SELECT COUNT(*) INTO null_invitations   FROM "invitations"   WHERE "tenantId" IS NULL;

  IF null_agencies + null_categories + null_products + null_orders +
     null_notifications + null_audit_logs + null_app_settings + null_invitations > 0 THEN
    RAISE EXCEPTION 'Found NULL tenantId values. Backfill tenantId before applying saas_hardening_v2 (see seed-multitenant.ts).';
  END IF;
END $$;

ALTER TABLE "agencies"      ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "categories"    ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "products"      ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "orders"        ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "notifications" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "audit_logs"    ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "app_settings"  ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "invitations"   ALTER COLUMN "tenantId" SET NOT NULL;

-- ─── Indexes (idempotent) ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "notifications_tenantId_idx" ON "notifications" ("tenantId");
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_idx"    ON "audit_logs" ("tenantId");
CREATE INDEX IF NOT EXISTS "invitations_tenantId_idx"   ON "invitations" ("tenantId");
CREATE INDEX IF NOT EXISTS "order_items_productId_idx"  ON "order_items" ("productId");
