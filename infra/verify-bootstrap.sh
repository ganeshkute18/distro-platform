#!/bin/bash
set -euo pipefail
API_BASE="${API_BASE:-http://127.0.0.1:4000/api/v1}"
OWNER_EMAIL="${OWNER_EMAIL:-bapu@nathsales.in}"
OWNER_PASS="${OWNER_PASS:?OWNER_PASS required}"
TENANT_SLUG="${TENANT_SLUG:-nath-sales}"

log() { echo "[VERIFY] $*"; }
fail() { echo "[FAIL] $*" >&2; exit 1; }

LOGIN=$(curl -sf -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$OWNER_PASS\"}")
TENANT_ID=$(echo "$LOGIN" | grep -o '"id":"[^"]*"' | tail -1 | cut -d'"' -f4)
OWNER_TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
log "OWNER tenant from login: $TENANT_ID"

AGENCY=$(curl -s -w "\nHTTP:%{http_code}" -X POST "$API_BASE/agencies" \
  -H "Authorization: Bearer $OWNER_TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" -d '{"name":"Chitale Dairy","description":"Dairy"}')
echo "$AGENCY"
