#!/bin/bash
set -euo pipefail
API="http://127.0.0.1:4000/api/v1"
email="$1"
pass="$2"

curl -s -w "\nHTTP:%{http_code}\n" \
  -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${email}\",\"password\":\"${pass}\"}"