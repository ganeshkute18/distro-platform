#!/bin/bash
set -euo pipefail
APP_DIR="/home/ec2-user/app/distro-platform"
API_PORT=4000
API_BASE="http://127.0.0.1:${API_PORT}/api/v1"

PA_NAME="${PA_NAME:-Ganesh Kute}"
PA_EMAIL="${PA_EMAIL:-platform@distropro.in}"
PA_PASS="${PA_PASS:?PA_PASS required}"
TENANT_NAME="${TENANT_NAME:-Nath Sales}"
TENANT_SLUG="${TENANT_SLUG:-nath-sales}"
OWNER_NAME="${OWNER_NAME:-Bapu Kute}"
OWNER_EMAIL="${OWNER_EMAIL:-bapu@nathsales.in}"
OWNER_PASS="${OWNER_PASS:?OWNER_PASS required}"

log() { echo "$(date '+%H:%M:%S') [BOOT] $*"; }
fail() { echo "$(date '+%H:%M:%S') [FAIL] $*" >&2; exit 1; }

cd "$APP_DIR"
cp /home/ec2-user/app/.env apps/api/.env

log "Restart distro-api container"
docker stop distro-api 2>/dev/null || true
docker rm distro-api 2>/dev/null || true
docker run -d --name distro-api --restart unless-stopped --env-file apps/api/.env -p ${API_PORT}:4000 distro-api:latest

for i in $(seq 1 30); do
  curl -sf "http://localhost:${API_PORT}/health" >/dev/null && break
  [ "$i" -eq 30 ] && fail "Health check timeout"
  sleep 3
done
log "Health: $(curl -sf http://localhost:${API_PORT}/health)"

log "Create PLATFORM_ADMIN"
docker exec \
  -e PA_NAME="$PA_NAME" -e PA_EMAIL="$PA_EMAIL" -e PA_PASS="$PA_PASS" \
  distro-api node -e '
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
(async () => {
  const prisma = new PrismaClient();
  const existing = await prisma.user.findFirst({ where: { role: "PLATFORM_ADMIN" } });
  if (existing) { console.log("exists", existing.email); await prisma.$disconnect(); return; }
  const hash = await bcrypt.hash(process.env.PA_PASS, 12);
  const admin = await prisma.user.create({
    data: {
      email: process.env.PA_EMAIL,
      name: process.env.PA_NAME,
      passwordHash: hash,
      role: "PLATFORM_ADMIN",
      isActive: true,
      emailVerified: true,
      approvalStatus: "APPROVED",
    },
  });
  console.log("created", admin.email);
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
'

log "PLATFORM_ADMIN login"
LOGIN=$(curl -sf -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$PA_EMAIL\",\"password\":\"$PA_PASS\"}")
PA_TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$PA_TOKEN" ] || fail "PLATFORM_ADMIN login failed"

log "Onboard tenant: $TENANT_NAME"
ONBOARD=$(curl -sf -X POST "$API_BASE/tenants/onboard" \
  -H "Authorization: Bearer $PA_TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"$TENANT_NAME\",\"slug\":\"$TENANT_SLUG\",\"ownerEmail\":\"$OWNER_EMAIL\",\"ownerPassword\":\"$OWNER_PASS\",\"ownerName\":\"$OWNER_NAME\",\"plan\":\"STARTER\"}")
TENANT_ID=$(echo "$ONBOARD" | sed -n 's/.*"tenant"[[:space:]]*:[[:space:]]*{[^}]*"id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
[ -n "$TENANT_ID" ] || fail "Onboard failed: $ONBOARD"
log "Tenant ID: $TENANT_ID"

log "OWNER login"
OWNER_LOGIN=$(curl -sf -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$OWNER_PASS\"}")
OWNER_TOKEN=$(echo "$OWNER_LOGIN" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$OWNER_TOKEN" ] || fail "OWNER login failed"

log "RBAC: OWNER must not list all tenants"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $OWNER_TOKEN" "$API_BASE/tenants")
[ "$CODE" = "200" ] && fail "RBAC leak: OWNER got 200 on /tenants" || log "OWNER /tenants => HTTP $CODE"

log "Seed agency/category/product + pricing"
AGENCY_ID=$(curl -sf -X POST "$API_BASE/agencies" -H "Authorization: Bearer $OWNER_TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" -d '{"name":"Chitale Dairy"}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
CAT_ID=$(curl -sf -X POST "$API_BASE/categories" -H "Authorization: Bearer $OWNER_TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" -d '{"name":"Dairy","slug":"dairy"}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
PROD_ID=$(curl -sf -X POST "$API_BASE/products" -H "Authorization: Bearer $OWNER_TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Milk 1L\",\"sku\":\"MILK-1L\",\"pricePerUnit\":2000,\"agencyId\":\"$AGENCY_ID\",\"categoryId\":\"$CAT_ID\",\"taxPercent\":0,\"unitType\":\"LITRE\"}" \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

curl -sf -X POST "$API_BASE/pricing/rules" -H "Authorization: Bearer $OWNER_TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Hotel Milk\",\"customerType\":\"HOTEL\",\"productId\":\"$PROD_ID\",\"priceType\":\"FIXED_PRICE\",\"value\":1800,\"priority\":10}" >/dev/null

log "Pricing resolve (JWT tenant, no X-Tenant-ID header)"
RESOLVE=$(curl -sf -X POST "$API_BASE/pricing/resolve" -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" -d "{\"productId\":\"$PROD_ID\",\"customerType\":\"HOTEL\"}")
echo "$RESOLVE" | grep -q '"resolvedPrice":1800' || fail "Pricing resolve failed: $RESOLVE"
log "HOTEL resolvedPrice=1800 OK"

log "=== BOOTSTRAP POST-MIGRATE COMPLETE ==="
echo "PA_EMAIL=$PA_EMAIL"
echo "OWNER_EMAIL=$OWNER_EMAIL"
echo "TENANT_ID=$TENANT_ID"
echo "TENANT_SLUG=$TENANT_SLUG"
