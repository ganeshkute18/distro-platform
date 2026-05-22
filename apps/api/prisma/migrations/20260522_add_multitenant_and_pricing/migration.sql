-- Phase 1: Multi-Tenant Architecture + Dynamic Pricing Engine
-- This migration adds tenant isolation and dynamic pricing to DistroPro.

-- ══════════════════════════════════════════════════════════════
-- 1. New Enums
-- ══════════════════════════════════════════════════════════════

CREATE TYPE "TenantPlan" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE "CustomerType" AS ENUM ('RETAILER', 'WHOLESALER', 'HOTEL', 'DISTRIBUTOR', 'PREMIUM');
CREATE TYPE "PriceType" AS ENUM ('FIXED_PRICE', 'PERCENTAGE_OFF', 'FLAT_DISCOUNT');

-- ══════════════════════════════════════════════════════════════
-- 2. Tenants Table
-- ══════════════════════════════════════════════════════════════

CREATE TABLE "tenants" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "domain" TEXT,
  "logoUrl" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "gstNumber" TEXT,
  "panNumber" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "pincode" TEXT,
  "plan" "TenantPlan" NOT NULL DEFAULT 'STARTER',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "settings" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");
CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");

-- ══════════════════════════════════════════════════════════════
-- 3. Tenant Users (Many-to-Many: Users ↔ Tenants)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE "tenant_users" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'STAFF',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenant_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_users_tenantId_userId_key" ON "tenant_users"("tenantId", "userId");
CREATE INDEX "tenant_users_tenantId_idx" ON "tenant_users"("tenantId");
CREATE INDEX "tenant_users_userId_idx" ON "tenant_users"("userId");

ALTER TABLE "tenant_users"
  ADD CONSTRAINT "tenant_users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "tenant_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════
-- 4. Customers Table (Tenant-Scoped)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE "customers" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "customerType" "CustomerType" NOT NULL DEFAULT 'RETAILER',
  "creditLimit" INTEGER,
  "paymentTerms" INTEGER DEFAULT 0,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customers_tenantId_userId_key" ON "customers"("tenantId", "userId");
CREATE INDEX "customers_tenantId_idx" ON "customers"("tenantId");
CREATE INDEX "customers_tenantId_customerType_idx" ON "customers"("tenantId", "customerType");

ALTER TABLE "customers"
  ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════
-- 5. Pricing Rules Table (Tenant-Scoped)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE "pricing_rules" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "customerId" TEXT,
  "customerType" "CustomerType",
  "productId" TEXT,
  "categoryId" TEXT,
  "priceType" "PriceType" NOT NULL,
  "value" DECIMAL(10,2) NOT NULL,
  "minQuantity" INTEGER DEFAULT 1,
  "maxQuantity" INTEGER,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "name" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pricing_rules_tenantId_productId_idx" ON "pricing_rules"("tenantId", "productId");
CREATE INDEX "pricing_rules_tenantId_customerId_idx" ON "pricing_rules"("tenantId", "customerId");
CREATE INDEX "pricing_rules_tenantId_customerType_idx" ON "pricing_rules"("tenantId", "customerType");
CREATE INDEX "pricing_rules_tenantId_categoryId_idx" ON "pricing_rules"("tenantId", "categoryId");

ALTER TABLE "pricing_rules"
  ADD CONSTRAINT "pricing_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "pricing_rules_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "pricing_rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "pricing_rules_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════
-- 6. Add tenantId to existing tables (all NULLABLE for backward compat)
-- ══════════════════════════════════════════════════════════════

-- Products
ALTER TABLE "products" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Fix SKU unique constraint: was globally unique, now unique per tenant
DROP INDEX IF EXISTS "products_sku_key";
CREATE UNIQUE INDEX "products_tenantId_sku_key" ON "products"("tenantId", "sku");

-- Orders
ALTER TABLE "orders" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "orders_tenantId_idx" ON "orders"("tenantId");
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Categories
ALTER TABLE "categories" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "categories_tenantId_idx" ON "categories"("tenantId");
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Fix category unique constraints: now unique per tenant
DROP INDEX IF EXISTS "categories_slug_key";
DROP INDEX IF EXISTS "categories_name_key";
CREATE UNIQUE INDEX "categories_tenantId_slug_key" ON "categories"("tenantId", "slug");
CREATE UNIQUE INDEX "categories_tenantId_name_key" ON "categories"("tenantId", "name");

-- Agencies
ALTER TABLE "agencies" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "agencies_tenantId_idx" ON "agencies"("tenantId");
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Fix agency unique constraint: now unique per tenant
DROP INDEX IF EXISTS "agencies_name_key";
CREATE UNIQUE INDEX "agencies_tenantId_name_key" ON "agencies"("tenantId", "name");

-- Notifications
ALTER TABLE "notifications" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "notifications_tenantId_idx" ON "notifications"("tenantId");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Audit Logs
ALTER TABLE "audit_logs" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- App Settings
ALTER TABLE "app_settings" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "app_settings_tenantId_idx" ON "app_settings"("tenantId");
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Invitations
ALTER TABLE "invitations" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "invitations_tenantId_idx" ON "invitations"("tenantId");
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════
-- 7. Add new AuditAction enum values
-- ══════════════════════════════════════════════════════════════

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TENANT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TENANT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PRICING_RULE_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PRICING_RULE_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PRICING_RULE_DELETED';
