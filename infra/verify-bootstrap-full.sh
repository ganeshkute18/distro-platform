#!/bin/bash
set -euo pipefail
API_BASE="${API_BASE:-http://127.0.0.1:4000/api/v1}"
PA_EMAIL="${PA_EMAIL:-platform@distropro.in}"
PA_PASS="${PA_PASS:?}"
OWNER_EMAIL="${OWNER_EMAIL:-bapu@nathsales.in}"
OWNER_PASS="${OWNER_PASS:?}"
TENANT_SLUG="${TENANT_SLUG:-nath-sales}"

log() { echo "[VERIFY] $*"; }
fail() { echo "[FAIL] $*" >&2; exit 1; }

log "1. OWNER login"
LOGIN=$(curl -sf -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$OWNER_PASS\"}")
TENANT_ID=$(echo "$LOGIN" | grep -o '"id":"[^"]*"' | tail -1 | cut -d'"' -f4)
OWNER_TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
log "   tenantId=$TENANT_ID"

log "2. List products (tenant-scoped)"
PRODUCTS=$(curl -sf -H "Authorization: Bearer $OWNER_TOKEN" -H "X-Tenant-ID: $TENANT_ID" "$API_BASE/products")
PROD_ID=$(echo "$PRODUCTS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$PROD_ID" ] || fail "No product found"
log "   productId=$PROD_ID"

log "3. Pricing resolve HOTEL (header tenant)"
R1=$(curl -sf -X POST "$API_BASE/pricing/resolve" -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PROD_ID\",\"customerType\":\"HOTEL\"}")
echo "   $R1" | grep -q '"resolvedPrice":1800' || fail "Header resolve failed: $R1"
log "   resolvedPrice=1800 OK"

log "4. Pricing resolve HOTEL (JWT tenant only)"
R2=$(curl -sf -X POST "$API_BASE/pricing/resolve" -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" -d "{\"productId\":\"$PROD_ID\",\"customerType\":\"HOTEL\"}")
echo "   $R2" | grep -q '"resolvedPrice":1800' || fail "JWT resolve failed: $R2"
log "   JWT-only tenant OK"

log "5. PLATFORM_ADMIN login + list tenants"
PA_LOGIN=$(curl -sf -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$PA_EMAIL\",\"password\":\"$PA_PASS\"}")
PA_TOKEN=$(echo "$PA_LOGIN" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
PA_ROLE=$(echo "$PA_LOGIN" | grep -o '"role":"[^"]*"' | head -1)
echo "   $PA_ROLE"
TENANTS=$(curl -sf -H "Authorization: Bearer $PA_TOKEN" "$API_BASE/tenants")
echo "$TENANTS" | grep -q "$TENANT_SLUG" || fail "Tenant not in admin list"

log "6. Cross-tenant: fake tenant header"
FAKE_ID="clfake0000000000000000000"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "X-Tenant-ID: $FAKE_ID" "$API_BASE/products")
[ "$CODE" = "200" ] && fail "Leaked data with fake tenant" || log "   fake tenant => HTTP $CODE (expected 403/404)"

log "7. Row counts"
PGPASSWORD="${RDS_PASS:?}" psql -h "${RDS_HOST:?}" \
  -U "${RDS_USER:-distro_admin}" -d "${RDS_DB:-distro_platform}" -c \
  "SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE n_live_tup > 0 ORDER BY relname;" 2>/dev/null || log "   (skip DB counts if psql env missing)"

log "ALL CHECKS PASSED"
