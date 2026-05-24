#!/bin/bash
set -euo pipefail
API_BASE="http://127.0.0.1:4000/api/v1"
PA_EMAIL="platform@distropro.in"
PA_PASS="${PA_PASS:?}"
OWNER_EMAIL="bapu@nathsales.in"
OWNER_PASS="${OWNER_PASS:?}"

echo "=== PLATFORM_ADMIN list tenants ==="
PA_TOKEN=$(curl -sf -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$PA_EMAIL\",\"password\":\"$PA_PASS\"}" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
curl -sf -H "Authorization: Bearer $PA_TOKEN" "$API_BASE/tenants" | head -c 500
echo ""

echo "=== OWNER /tenants RBAC ==="
OT=$(curl -sf -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$OWNER_PASS\"}" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $OT" "$API_BASE/tenants")
echo "HTTP $CODE (expect 403)"

echo "=== Cross-tenant fake header ==="
TID=$(curl -sf -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$OWNER_PASS\"}" | grep -o '"tenantId":"[^"]*"' | head -1 | cut -d'"' -f4)
CODE2=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $OT" -H "X-Tenant-ID: clfake0000000000000000000" "$API_BASE/products")
echo "HTTP $CODE2 (expect 403 or empty 200 with no data)"

echo "=== DB counts ==="
PGPASSWORD="${RDS_PASS:?}" psql -h "${RDS_HOST:?}" \
  -U distro_admin -d distro_platform -c \
  "SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE n_live_tup > 0 ORDER BY relname;"

echo "=== DONE ==="
