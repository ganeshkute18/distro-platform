-- Create enums
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'QR');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- Alter users
ALTER TABLE "users"
ADD COLUMN "profileImageUrl" TEXT;

-- Alter orders
ALTER TABLE "orders"
ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "paymentReceiptUrl" TEXT,
ADD COLUMN "paymentReceiptNote" TEXT;

-- Create app settings table
CREATE TABLE "app_settings" (
  "id" TEXT NOT NULL,
  "companyName" TEXT NOT NULL DEFAULT 'Nath Sales',
  "companyLogoUrl" TEXT,
  "paymentQrUrl" TEXT,
  "upiId" TEXT,
  "bankDetails" TEXT,
  "onlineGatewayNote" TEXT DEFAULT 'Online payment gateway will be integrated in a future release.',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- Seed one default settings row only if none exists
INSERT INTO "app_settings" ("id", "companyName", "createdAt", "updatedAt")
SELECT 'nath-sales-default', 'Nath Sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "app_settings");
