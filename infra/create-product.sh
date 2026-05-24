#!/bin/bash
set -euo pipefail
API_BASE="http://127.0.0.1:4000/api/v1"
OWNER_EMAIL="bapu@nathsales.in"
OWNER_PASS="${OWNER_PASS:?}"

LOGIN=$(curl -sf -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$OWNER_PASS\"}")
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null || \
  echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
TENANT_ID=$(echo "$LOGIN" | grep -o '"tenantId":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "GET products:"
curl -s -w "\nHTTP:%{http_code}\n" -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID" "$API_BASE/products"

AID="cmpism8fr000ch58cbspz5d5f"
CID="cmpism8gf000gh58cguxbjncc"
echo "POST product:"
curl -s -w "\nHTTP:%{http_code}\n" -X POST "$API_BASE/products" \
  -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID" -H "Content-Type: application/json" \
  -d "{\"name\":\"Milk 1L\",\"sku\":\"MILK-1L\",\"pricePerUnit\":2000,\"agencyId\":\"$AID\",\"categoryId\":\"$CID\",\"taxPercent\":0,\"unitType\":\"LITRE\"}"
