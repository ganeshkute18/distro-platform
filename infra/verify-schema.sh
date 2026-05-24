#!/bin/bash
set -euo pipefail
RDS_HOST="${RDS_HOST:?RDS_HOST required}"
RDS_USER="${RDS_USER:-distro_admin}"
RDS_PASS="${RDS_PASS:?RDS_PASS required}"
RDS_DB="${RDS_DB:-distro_platform}"

export PGPASSWORD="$RDS_PASS"
echo "=== Role enum ==="
psql -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -c \
  "SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='Role' ORDER BY enumsortorder;"

echo "=== order_items pricing columns ==="
psql -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -c \
  "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='order_items' AND column_name IN ('basePrice','appliedRuleId','discountAmount','unitPrice') ORDER BY column_name;"

echo "=== tenantId NOT NULL sample ==="
psql -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -c \
  "SELECT table_name, is_nullable FROM information_schema.columns WHERE column_name='tenantId' AND table_name IN ('products','orders','app_settings') ORDER BY table_name;"

echo "=== migrations applied ==="
psql -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -c \
  "SELECT migration_name, finished_at IS NOT NULL AS ok FROM _prisma_migrations ORDER BY started_at;"
