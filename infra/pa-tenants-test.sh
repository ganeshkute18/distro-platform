#!/bin/bash
# Smoke test — requires PA_EMAIL and PA_PASS in environment
set -euo pipefail
PA_EMAIL="${PA_EMAIL:?PA_EMAIL required}"
PA_PASS="${PA_PASS:?PA_PASS required}"
RESP=$(curl -sf -X POST http://127.0.0.1:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$PA_EMAIL\",\"password\":\"$PA_PASS\"}")
TOKEN=$(echo "$RESP" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
curl -s -w "\nHTTP:%{http_code}\n" -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4000/api/v1/tenants
