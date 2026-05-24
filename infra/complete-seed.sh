#!/bin/bash
set -euo pipefail
API_BASE="http://127.0.0.1:4000/api/v1"
OWNER_EMAIL="${OWNER_EMAIL:-bapu@nathsales.in}"
OWNER_PASS="${OWNER_PASS:?}"

LOGIN=$(curl -sf -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$OWNER_PASS\"}")
TENANT_ID=$(echo "$LOGIN" | grep -o '"id":"[^"]*"' | tail -1 | cut -d'"' -f4)
TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)

AGENCIES=$(curl -sf -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID" "$API_BASE/agencies")
AGENCY_ID=$(echo "$AGENCIES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$AGENCY_ID" ]; then
  AGENCY_ID=$(curl -sf -X POST "$API_BASE/agencies" -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
    -H "Content-Type: application/json" -d '{"name":"Chitale Dairy","description":"Dairy"}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

CATS=$(curl -sf -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID" "$API_BASE/categories")
CAT_ID=$(echo "$CATS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$CAT_ID" ]; then
  CAT_ID=$(curl -sf -X POST "$API_BASE/categories" -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
    -H "Content-Type: application/json" -d '{"name":"Dairy","slug":"dairy"}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

PRODS=$(curl -sf -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID" "$API_BASE/products" || echo '{}')
PROD_ID=$(echo "$PRODS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$PROD_ID" ]; then
  PROD_ID=$(curl -sf -X POST "$API_BASE/products" -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Milk 1L\",\"sku\":\"MILK-1L\",\"pricePerUnit\":2000,\"agencyId\":\"$AGENCY_ID\",\"categoryId\":\"$CAT_ID\",\"taxPercent\":0,\"unitType\":\"LITRE\"}" \
    | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

curl -sf -X POST "$API_BASE/pricing/rules" -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Hotel Milk\",\"customerType\":\"HOTEL\",\"productId\":\"$PROD_ID\",\"priceType\":\"FIXED_PRICE\",\"value\":1800,\"priority\":10}" >/dev/null 2>&1 || true

echo "TENANT_ID=$TENANT_ID"
echo "PROD_ID=$PROD_ID"
curl -sf -X POST "$API_BASE/pricing/resolve" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d "{\"productId\":\"$PROD_ID\",\"customerType\":\"HOTEL\"}"
