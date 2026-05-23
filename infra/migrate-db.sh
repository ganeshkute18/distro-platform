#!/bin/bash
# ═══════════════════════════════════════════════════════════
# DistroPro — Database Migration: Railway → AWS RDS
# ═══════════════════════════════════════════════════════════
#
# Prerequisites:
#   1. PostgreSQL client tools: sudo yum install postgresql15 -y
#   2. Railway DATABASE_URL (from Railway dashboard)
#   3. AWS RDS DATABASE_URL (from CloudFormation output)
#
# Usage:
#   chmod +x migrate-db.sh
#   ./migrate-db.sh
# ═══════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════"
echo "  DistroPro — Database Migration: Railway → AWS RDS"
echo "═══════════════════════════════════════════════════"
echo ""

# ─── Get connection details ──────────────────────────────

read -p "Railway DATABASE_URL: " RAILWAY_URL
read -p "AWS RDS DATABASE_URL: " RDS_URL

DUMP_FILE="/tmp/distro_railway_dump_$(date +%Y%m%d_%H%M%S).sql"

# ─── Step 1: Export from Railway ─────────────────────────
echo ""
echo "📤 Step 1: Exporting from Railway..."
echo "   This may take a few minutes depending on data size."

pg_dump "$RAILWAY_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --format=plain \
  > "$DUMP_FILE"

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo "✅ Export complete: $DUMP_FILE ($DUMP_SIZE)"

# ─── Step 2: Import into AWS RDS ────────────────────────
echo ""
echo "📥 Step 2: Importing into AWS RDS..."
echo "   This may take a few minutes."

psql "$RDS_URL" < "$DUMP_FILE"

echo "✅ Import complete!"

# ─── Step 3: Verify ─────────────────────────────────────
echo ""
echo "🔍 Step 3: Verifying migration..."

echo "Railway row counts:"
psql "$RAILWAY_URL" -c "
  SELECT 'users' as table_name, count(*) FROM users
  UNION ALL SELECT 'orders', count(*) FROM orders
  UNION ALL SELECT 'products', count(*) FROM products
  UNION ALL SELECT 'categories', count(*) FROM categories
  UNION ALL SELECT 'tenants', count(*) FROM tenants
  ORDER BY table_name;
"

echo ""
echo "AWS RDS row counts:"
psql "$RDS_URL" -c "
  SELECT 'users' as table_name, count(*) FROM users
  UNION ALL SELECT 'orders', count(*) FROM orders
  UNION ALL SELECT 'products', count(*) FROM products
  UNION ALL SELECT 'categories', count(*) FROM categories
  UNION ALL SELECT 'tenants', count(*) FROM tenants
  ORDER BY table_name;
"

# ─── Step 4: Cleanup ────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ Migration complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Dump file saved at: $DUMP_FILE"
echo ""
echo "Next steps:"
echo "  1. Verify your app works with the new RDS database"
echo "  2. Update NEXT_PUBLIC_API_URL on Vercel"
echo "  3. Once confirmed working, shut down Railway"
echo ""
