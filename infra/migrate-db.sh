#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# DistroPro — Database Management Script (AWS RDS only, no Railway)
#
# COMMANDS:
#   ./infra/migrate-db.sh status      Show migration + table status
#   ./infra/migrate-db.sh deploy      Apply pending Prisma migrations
#   ./infra/migrate-db.sh reset       DROP + recreate DB (DESTRUCTIVE)
#   ./infra/migrate-db.sh verify      Verify schema consistency
#
# USAGE:
#   chmod +x infra/migrate-db.sh
#   ./infra/migrate-db.sh deploy
#
# Set these env vars or export from .env.aws before running:
#   RDS_HOST, RDS_USER, RDS_PASS, RDS_DB, EC2_IP, EC2_KEY
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

[ -f ".env.aws" ] && source .env.aws

RDS_HOST="${RDS_HOST:-}"
RDS_USER="${RDS_USER:-admin}"
RDS_PASS="${RDS_PASS:-}"
RDS_DB="${RDS_DB:-distro_platform}"
EC2_IP="${EC2_IP:-}"
EC2_KEY="${EC2_KEY:-~/.ssh/distro-key.pem}"
EC2_USER="${EC2_USER:-ec2-user}"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅  $*${NC}"; }
warn() { echo -e "${YELLOW}⚠️   $*${NC}"; }
fail() { echo -e "${RED}❌  $*${NC}"; exit 1; }

rds_sql() {
  PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d "${2:-$RDS_DB}" -c "$1" 2>&1
}

ec2_run() {
  ssh -i "$EC2_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$EC2_USER@$EC2_IP" "$@"
}

CMD="${1:-help}"

case "$CMD" in

  # ──────────────────────────────────────────────────────────────────────
  status)
    echo ""; echo "=== RDS Migration Status ==="
    rds_sql "SELECT version, applied_steps_count, started_at, finished_at, migration_name FROM _prisma_migrations ORDER BY started_at DESC LIMIT 10;" || warn "No migration history yet"
    echo ""; echo "=== Table Row Counts ==="
    rds_sql "SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE n_live_tup >= 0 ORDER BY relname;" || warn "No tables found"
    ;;

  # ──────────────────────────────────────────────────────────────────────
  deploy)
    echo ""; echo "=== Applying Prisma Migrations ==="
    if [ -z "$EC2_IP" ]; then
      fail "EC2_IP is required for deploy command"
    fi
    ec2_run "docker exec distro-api npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma 2>&1" || \
    ec2_run "docker run --rm --env-file /home/$EC2_USER/app/distro-platform/apps/api/.env distro-api:latest sh -c 'npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma'"
    ok "Migrations deployed"
    echo ""
    echo "Run './infra/migrate-db.sh status' to verify"
    ;;

  # ──────────────────────────────────────────────────────────────────────
  reset)
    echo ""; warn "This will DESTROY and recreate the '$RDS_DB' database."
    read -r -p "Type 'RESET' to confirm: " CONFIRM
    [ "$CONFIRM" != "RESET" ] && fail "Aborted"

    PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d postgres \
      -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$RDS_DB' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true
    PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d postgres \
      -c "DROP DATABASE IF EXISTS \"$RDS_DB\";" > /dev/null
    PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d postgres \
      -c "CREATE DATABASE \"$RDS_DB\" ENCODING 'UTF8' TEMPLATE template0;" > /dev/null
    ok "Database '$RDS_DB' reset. Now run: ./infra/migrate-db.sh deploy"
    ;;

  # ──────────────────────────────────────────────────────────────────────
  verify)
    echo ""; echo "=== Schema Verification ==="
    EXPECTED=("users" "tenants" "tenant_users" "agencies" "categories" "products" "orders" "order_items" "customers" "inventory" "pricing_rules" "notifications" "audit_logs" "invitations" "app_settings")
    TABLES=$(PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';" 2>&1)
    FAIL=0
    for t in "${EXPECTED[@]}"; do
      if echo "$TABLES" | grep -q " $t"; then
        ok "$t"
      else
        warn "MISSING: $t"
        FAIL=1
      fi
    done
    [ "$FAIL" = "0" ] && ok "All tables present" || fail "Some tables missing — run deploy first"
    echo ""
    echo "=== Enums ==="
    rds_sql "SELECT pg_type.typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname IN ('Role','CustomerType','PriceType') ORDER BY typname, enumsortorder;"
    echo ""
    echo "=== SaaS hardening checks ==="
    ROLE_ENUM=$(PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -t -c "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'Role' ORDER BY enumsortorder;" 2>&1)
    echo "$ROLE_ENUM" | grep -q "PLATFORM_ADMIN" && ok "Role.PLATFORM_ADMIN" || warn "Missing PLATFORM_ADMIN in Role enum"
    OI_COLS=$(PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='order_items' AND column_name IN ('basePrice','appliedRuleId','discountAmount');" 2>&1)
    echo "$OI_COLS" | grep -q "basePrice" && ok "order_items.basePrice" || warn "Missing order_items.basePrice"
    ;;

  # ──────────────────────────────────────────────────────────────────────
  help|*)
    echo ""
    echo "Usage: ./infra/migrate-db.sh <command>"
    echo ""
    echo "Commands:"
    echo "  status    Show migration history and row counts"
    echo "  deploy    Apply pending Prisma migrations via EC2 container"
    echo "  reset     DROP + recreate database (DESTRUCTIVE)"
    echo "  verify    Check all expected tables and enums exist"
    echo ""
    ;;
esac
