#!/bin/bash
# DistroPro — AWS bootstrap executor (run ON EC2 or via: ssh ... 'bash -s' < infra/bootstrap-aws-execute.sh)
set -euo pipefail

RDS_HOST="${RDS_HOST:-}"
RDS_USER="${RDS_USER:-distro_admin}"
RDS_PASS="${RDS_PASS:?RDS_PASS required}"
RDS_DB="${RDS_DB:-distro_platform}"
APP_DIR="${APP_DIR:-/home/ec2-user/app/distro-platform}"
API_PORT="${API_PORT:-4000}"

# Bootstrap accounts (override via env)
PA_NAME="${PA_NAME:-Ganesh Kute}"
PA_EMAIL="${PA_EMAIL:-platform@distropro.in}"
PA_PASS="${PA_PASS:?PA_PASS required (min 12 chars)}"
TENANT_NAME="${TENANT_NAME:-Nath Sales}"
TENANT_SLUG="${TENANT_SLUG:-nath-sales}"
OWNER_NAME="${OWNER_NAME:-Bapu Kute}"
OWNER_EMAIL="${OWNER_EMAIL:-bapu@nathsales.in}"
OWNER_PASS="${OWNER_PASS:?OWNER_PASS required (min 8 chars)}"

log()  { echo "$(date '+%H:%M:%S') [BOOT] $*"; }
fail() { echo "$(date '+%H:%M:%S') [FAIL] $*" >&2; exit 1; }

psql_admin() {
  PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d "${2:-postgres}" -v ON_ERROR_STOP=1 -c "$1"
}

log "=== STEP 1: RDS clean reset (DESTRUCTIVE) ==="
log "Dropping database: $RDS_DB"
psql_admin "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$RDS_DB' AND pid <> pg_backend_pid();" postgres || true
psql_admin "DROP DATABASE IF EXISTS \"$RDS_DB\";" postgres
psql_admin "CREATE DATABASE \"$RDS_DB\" ENCODING 'UTF8' TEMPLATE template0;" postgres
log "Database $RDS_DB recreated"

log "=== STEP 2: Build Docker image ==="
cd "$APP_DIR"
cp /home/ec2-user/app/.env apps/api/.env
docker build --target production -f apps/api/Dockerfile -t distro-api:latest . 2>&1 | tail -20

log "=== STEP 3: prisma migrate deploy ==="
docker run --rm --env-file apps/api/.env distro-api:latest \
  npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma

log "=== STEP 4: Schema verification ==="
ROLE_CHECK=$(PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -tA -c \
  "SELECT COUNT(*) FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='Role' AND e.enumlabel='PLATFORM_ADMIN';")
[ "$ROLE_CHECK" = "1" ] || fail "PLATFORM_ADMIN missing in Role enum"

BASE_CHECK=$(PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -tA -c \
  "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='order_items' AND column_name='basePrice';")
[ "$BASE_CHECK" = "1" ] || fail "order_items.basePrice missing"

MIG_COUNT=$(PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -tA -c \
  "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;")
log "Applied migrations: $MIG_COUNT (expected 7)"
[ "$MIG_COUNT" -ge 7 ] || fail "Expected at least 7 migrations, got $MIG_COUNT"

log "=== STEP 5: Restart API container ==="
docker stop distro-api 2>/dev/null || true
docker rm distro-api 2>/dev/null || true
docker run -d \
  --name distro-api \
  --restart unless-stopped \
  --env-file apps/api/.env \
  -p ${API_PORT}:4000 \
  --log-opt max-size=50m \
  --log-opt max-file=3 \
  distro-api:latest

for i in $(seq 1 30); do
  if curl -sf "http://localhost:${API_PORT}/health" >/dev/null; then
    log "Health OK after $((i*3))s"
    curl -sf "http://localhost:${API_PORT}/health"
    echo ""
    break
  fi
  [ "$i" -eq 30 ] && fail "Health check timeout"
  sleep 3
done

log "=== STEP 6: Create PLATFORM_ADMIN ==="
docker exec \
  -e PA_NAME="$PA_NAME" -e PA_EMAIL="$PA_EMAIL" -e PA_PASS="$PA_PASS" \
  distro-api node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
(async () => {
  const prisma = new PrismaClient();
  const existing = await prisma.user.findFirst({ where: { role: 'PLATFORM_ADMIN' } });
  if (existing) { console.log('PLATFORM_ADMIN exists:', existing.email); process.exit(0); }
  const taken = await prisma.user.findUnique({ where: { email: process.env.PA_EMAIL } });
  if (taken) throw new Error('Email already registered');
  const passwordHash = await bcrypt.hash(process.env.PA_PASS, 12);
  const admin = await prisma.user.create({
    data: {
      email: process.env.PA_EMAIL,
      name: process.env.PA_NAME,
      passwordHash,
      role: 'PLATFORM_ADMIN',
      isActive: true,
      emailVerified: true,
      approvalStatus: 'APPROVED',
    },
  });
  console.log('PLATFORM_ADMIN created:', admin.id, admin.email);
  await prisma.\$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
"

log "=== STEP 7: Onboard tenant $TENANT_NAME ==="
API_BASE="http://127.0.0.1:${API_PORT}/api/v1"
LOGIN=$(curl -sf -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$PA_EMAIL\",\"password\":\"$PA_PASS\"}")
PA_TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$PA_TOKEN" ] || fail "PLATFORM_ADMIN login failed"

ONBOARD=$(curl -sf -X POST "$API_BASE/tenants/onboard" \
  -H "Authorization: Bearer $PA_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\":\"$TENANT_NAME\",
    \"slug\":\"$TENANT_SLUG\",
    \"ownerEmail\":\"$OWNER_EMAIL\",
    \"ownerPassword\":\"$OWNER_PASS\",
    \"ownerName\":\"$OWNER_NAME\",
    \"plan\":\"STARTER\"
  }")
TENANT_ID=$(echo "$ONBOARD" | sed -n 's/.*"tenant"[[:space:]]*:[[:space:]]*{[^}]*"id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
[ -n "$TENANT_ID" ] || TENANT_ID=$(echo "$ONBOARD" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$TENANT_ID" ] || fail "Tenant onboard failed: $ONBOARD"
log "Tenant ID: $TENANT_ID"

log "=== STEP 8: OWNER login ==="
OWNER_LOGIN=$(curl -sf -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$OWNER_PASS\"}")
OWNER_TOKEN=$(echo "$OWNER_LOGIN" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$OWNER_TOKEN" ] || fail "OWNER login failed"

log "=== STEP 9: RBAC + tenant isolation ==="
TENANTS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $OWNER_TOKEN" "$API_BASE/tenants")
[ "$TENANTS_CODE" != "200" ] && log "OWNER /tenants => HTTP $TENANTS_CODE (expected non-200)" || fail "RBAC leak: OWNER can list all tenants"

PA_LIST=$(curl -sf -H "Authorization: Bearer $PA_TOKEN" "$API_BASE/tenants")
echo "$PA_LIST" | grep -q '"data"' || fail "PLATFORM_ADMIN cannot list tenants"

log "=== STEP 10: Seed catalog + pricing ==="
AGENCY=$(curl -sf -X POST "$API_BASE/agencies" -H "Authorization: Bearer $OWNER_TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" -d '{"name":"Chitale Dairy","description":"Dairy agency"}')
AGENCY_ID=$(echo "$AGENCY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
CAT=$(curl -sf -X POST "$API_BASE/categories" -H "Authorization: Bearer $OWNER_TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" -d '{"name":"Dairy","slug":"dairy"}')
CAT_ID=$(echo "$CAT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
PROD=$(curl -sf -X POST "$API_BASE/products" -H "Authorization: Bearer $OWNER_TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Milk 1L\",\"sku\":\"MILK-1L\",\"pricePerUnit\":2000,\"agencyId\":\"$AGENCY_ID\",\"categoryId\":\"$CAT_ID\",\"taxPercent\":0,\"unitType\":\"LITRE\"}")
PROD_ID=$(echo "$PROD" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

curl -sf -X POST "$API_BASE/pricing/rules" -H "Authorization: Bearer $OWNER_TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Hotel Milk Rate\",\"customerType\":\"HOTEL\",\"productId\":\"$PROD_ID\",\"priceType\":\"FIXED_PRICE\",\"value\":1800,\"priority\":10}" >/dev/null

RESOLVE=$(curl -sf -X POST "$API_BASE/pricing/resolve" -H "Authorization: Bearer $OWNER_TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" -d "{\"productId\":\"$PROD_ID\",\"customerType\":\"HOTEL\"}")
echo "$RESOLVE" | grep -q '"resolvedPrice":1800' || fail "Pricing resolve failed: $RESOLVE"
log "HOTEL pricing resolve OK (1800 paise)"

# JWT tenant without header
RESOLVE_JWT=$(curl -sf -X POST "$API_BASE/pricing/resolve" -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" -d "{\"productId\":\"$PROD_ID\",\"customerType\":\"HOTEL\"}")
echo "$RESOLVE_JWT" | grep -q '"resolvedPrice":1800' && log "JWT tenantId pricing OK (no X-Tenant-ID header)"

log "=== BOOTSTRAP COMPLETE ==="
echo "PLATFORM_ADMIN: $PA_EMAIL"
echo "OWNER: $OWNER_EMAIL"
echo "TENANT_ID: $TENANT_ID"
echo "TENANT_SLUG: $TENANT_SLUG"
