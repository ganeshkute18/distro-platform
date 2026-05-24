#!/bin/bash
# Smoke test — requires PA_EMAIL and PA_PASS in environment
set -euo pipefail
PA_EMAIL="${PA_EMAIL:?PA_EMAIL required}"
PA_PASS="${PA_PASS:?PA_PASS required}"
curl -s -w "\nHTTP:%{http_code}\n" -X POST http://127.0.0.1:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$PA_EMAIL\",\"password\":\"$PA_PASS\"}"
