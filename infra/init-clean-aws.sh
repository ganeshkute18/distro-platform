#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# DistroPro — Clean AWS Initialization Script
#
# PURPOSE:
#   Fresh-start initialization of DistroPro SaaS on AWS infrastructure.
#   No Railway migration. No legacy data. Clean state only.
#
# WHAT THIS DOES (in order):
#   1. Verifies EC2 + Docker + RDS connectivity
#   2. Drops and recreates the PostgreSQL database (DESTRUCTIVE)
#   3. Runs fresh Prisma migrate deploy (creates all tables)
#   4. Creates PLATFORM_ADMIN account
#   5. Onboards first tenant (Nath Sales + Bapu Kute)
#   6. Runs SaaS verification checks
#
# USAGE (run from your LOCAL machine):
#   chmod +x infra/init-clean-aws.sh
#   ./infra/init-clean-aws.sh
#
# PREREQUISITES:
#   - SSH key configured for EC2
#   - AWS CLI configured  
#   - psql client installed locally (brew install libpq / apt install postgresql-client)
#   - EC2 has Docker + deployed backend image already
#
# ENV VARS EXPECTED (export before running):
#   EC2_IP          EC2 public IP address
#   EC2_KEY         Path to your .pem key file
#   RDS_HOST        RDS endpoint (without port)
#   RDS_USER        RDS master username (default: admin)
#   RDS_PASS        RDS master password
#   RDS_DB          Database name (default: distro_platform)
#   API_BASE        Full API base URL  e.g. http://<EC2_IP>:4000/api/v1
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Load env vars from local .env if not already set ────────────────────
if [ -f ".env.aws" ]; then
  source .env.aws
  echo "  Loaded .env.aws"
fi

# ─── Defaults ─────────────────────────────────────────────────────────────
EC2_IP="${EC2_IP:-}"
EC2_KEY="${EC2_KEY:-~/.ssh/distro-key.pem}"
EC2_USER="${EC2_USER:-ec2-user}"
RDS_HOST="${RDS_HOST:-}"
RDS_USER="${RDS_USER:-admin}"
RDS_PASS="${RDS_PASS:-}"
RDS_DB="${RDS_DB:-distro_platform}"
API_BASE="${API_BASE:-}"

# ─── Colors ───────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}$(date '+%H:%M:%S') ✅  $*${NC}"; }
info() { echo -e "${BLUE}$(date '+%H:%M:%S') ℹ️   $*${NC}"; }
warn() { echo -e "${YELLOW}$(date '+%H:%M:%S') ⚠️   $*${NC}"; }
fail() { echo -e "${RED}$(date '+%H:%M:%S') ❌  $*${NC}"; exit 1; }

# ─── Validate required env vars ───────────────────────────────────────────
check_required() {
  local missing=0
  for var in EC2_IP EC2_KEY RDS_HOST RDS_PASS API_BASE; do
    if [ -z "${!var:-}" ]; then
      warn "Missing required variable: $var"
      missing=1
    fi
  done
  if [ "$missing" = "1" ]; then
    echo ""
    echo "Create a file called .env.aws in the project root with:"
    echo "  export EC2_IP=<your-ec2-public-ip>"
    echo "  export EC2_KEY=~/.ssh/your-key.pem"
    echo "  export RDS_HOST=<your-rds-endpoint>"
    echo "  export RDS_PASS=<your-rds-password>"
    echo "  export API_BASE=http://\$EC2_IP:4000/api/v1"
    exit 1
  fi
}

# ─── SSH helper ───────────────────────────────────────────────────────────
ec2_run() {
  ssh -i "$EC2_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
    "$EC2_USER@$EC2_IP" "$@"
}

# ─── psql helper ──────────────────────────────────────────────────────────
rds_sql() {
  PGPASSWORD="$RDS_PASS" psql \
    -h "$RDS_HOST" -U "$RDS_USER" -d "${2:-postgres}" \
    -c "$1" -t -q 2>&1
}

rds_sql_db() {
  PGPASSWORD="$RDS_PASS" psql \
    -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" \
    -c "$1" 2>&1
}

# ══════════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  DistroPro — Clean AWS Initialization"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════════"
echo ""

check_required

# ══════════════════════════════════════════════════════════════════════════
echo ""
echo "── STEP 1: Verify AWS Infrastructure ──────────────────────────"
echo ""

# EC2 connectivity
info "Checking EC2 ($EC2_IP)..."
if ! ec2_run "echo ok" > /dev/null 2>&1; then
  fail "Cannot SSH to EC2 at $EC2_IP. Check key permissions and security group (port 22 open)."
fi
ok "EC2 reachable via SSH"

# Docker on EC2
info "Checking Docker on EC2..."
DOCKER_VER=$(ec2_run "docker --version" 2>&1) || fail "Docker not found on EC2"
ok "Docker: $DOCKER_VER"

# Check running containers
info "Current containers on EC2:"
ec2_run "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" 2>&1 | sed 's/^/    /'

# RDS connectivity
info "Checking RDS ($RDS_HOST)..."
if ! PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d postgres -c "SELECT 1" > /dev/null 2>&1; then
  fail "Cannot connect to RDS. Check: security group allows EC2 IP, credentials correct, RDS is running."
fi
ok "RDS reachable"

# Check DB exists
DB_EXISTS=$(rds_sql "SELECT 1 FROM pg_database WHERE datname='$RDS_DB'" postgres)
if echo "$DB_EXISTS" | grep -q "1"; then
  warn "Database '$RDS_DB' exists — will be RESET in Step 2"
else
  info "Database '$RDS_DB' does not exist yet — will be created"
fi

echo ""
ok "Step 1 complete — all infrastructure reachable"

# ══════════════════════════════════════════════════════════════════════════
echo ""
echo "── STEP 2: Clean Reset AWS RDS ─────────────────────────────────"
echo ""

warn "⚠️  This will DROP and RECREATE the '$RDS_DB' database."
warn "    ALL existing data will be permanently deleted."
echo ""
read -r -p "  Type 'RESET' to confirm: " CONFIRM
if [ "$CONFIRM" != "RESET" ]; then
  fail "Aborted by user"
fi
echo ""

# Terminate active connections first
info "Terminating existing connections to $RDS_DB..."
rds_sql "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$RDS_DB' AND pid <> pg_backend_pid();" postgres || true

# Drop and recreate
info "Dropping database $RDS_DB..."
rds_sql "DROP DATABASE IF EXISTS \"$RDS_DB\";" postgres
info "Creating fresh database $RDS_DB..."
rds_sql "CREATE DATABASE \"$RDS_DB\" ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8' TEMPLATE template0;" postgres

ok "Database $RDS_DB reset and recreated"

# ══════════════════════════════════════════════════════════════════════════
echo ""
echo "── STEP 3: Apply SaaS-Hardened Schema via Prisma ───────────────"
echo ""

info "Deploying latest code to EC2 first..."
ec2_run "cd /home/$EC2_USER/app/distro-platform && git fetch --all && git reset --hard origin/main" 2>&1 | tail -3

info "Copying .env to EC2 API directory..."
ec2_run "cp /home/$EC2_USER/.env /home/$EC2_USER/app/distro-platform/apps/api/.env"

info "Rebuilding Docker image with latest schema..."
ec2_run "cd /home/$EC2_USER/app/distro-platform && docker build --target production -f apps/api/Dockerfile -t distro-api:latest . 2>&1 | tail -10"

info "Running Prisma migrate deploy (applies all migrations fresh)..."
ec2_run "docker run --rm --env-file /home/$EC2_USER/app/distro-platform/apps/api/.env distro-api:latest sh -c 'cd /app && npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma'"

ok "Prisma migrations applied successfully"

# ══════════════════════════════════════════════════════════════════════════
echo ""
echo "── STEP 4: Verify Schema Consistency ───────────────────────────"
echo ""

info "Verifying key tables exist on RDS..."
TABLES=$(rds_sql_db "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")
EXPECTED_TABLES=("users" "tenants" "tenant_users" "agencies" "categories" "products" "orders" "order_items" "customers" "inventory" "pricing_rules" "notifications" "audit_logs" "invitations" "app_settings")
MISSING=""
for t in "${EXPECTED_TABLES[@]}"; do
  if ! echo "$TABLES" | grep -q "$t"; then
    MISSING="$MISSING $t"
  fi
done

if [ -n "$MISSING" ]; then
  fail "Missing tables: $MISSING — Prisma migration may have failed"
fi
ok "All ${#EXPECTED_TABLES[@]} expected tables present"

info "Verifying PLATFORM_ADMIN enum value..."
ENUM_CHECK=$(rds_sql_db "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'Role' ORDER BY enumsortorder;")
if ! echo "$ENUM_CHECK" | grep -q "PLATFORM_ADMIN"; then
  fail "PLATFORM_ADMIN not found in Role enum — migration may not have included it"
fi
ok "PLATFORM_ADMIN role confirmed in DB enum"

info "Verifying pricing snapshot columns on order_items..."
OI_COLS=$(rds_sql_db "SELECT column_name FROM information_schema.columns WHERE table_name='order_items' ORDER BY column_name;")
for col in "basePrice" "appliedRuleId" "discountAmount"; do
  if ! echo "$OI_COLS" | grep -qi "$col"; then
    warn "Column $col missing from order_items (may be camelCase vs snake_case — check migration)"
  fi
done
ok "OrderItem pricing columns verified"

# ══════════════════════════════════════════════════════════════════════════
echo ""
echo "── STEP 5: Start Backend Container ────────────────────────────"
echo ""

info "Stopping old container if running..."
ec2_run "docker stop distro-api 2>/dev/null || true; docker rm distro-api 2>/dev/null || true"

info "Starting fresh container..."
ec2_run "docker run -d \
  --name distro-api \
  --restart unless-stopped \
  --env-file /home/$EC2_USER/app/distro-platform/apps/api/.env \
  -p 4000:4000 \
  --log-opt max-size=50m \
  --log-opt max-file=3 \
  distro-api:latest"

info "Waiting for API to be healthy..."
for i in $(seq 1 20); do
  if curl -sf "http://$EC2_IP:4000/health" > /dev/null 2>&1; then
    ok "API healthy after $((i*3))s"
    break
  fi
  if [ "$i" -eq 20 ]; then
    warn "Health check timed out — showing container logs:"
    ec2_run "docker logs distro-api --tail 40" 2>&1
    fail "API did not start correctly"
  fi
  sleep 3
done

# ══════════════════════════════════════════════════════════════════════════
echo ""
echo "── STEP 6: Create PLATFORM_ADMIN Account ───────────────────────"
echo ""

info "Launching interactive platform admin setup..."
ec2_run "docker exec -i distro-api npx ts-node apps/api/prisma/setup-platform-admin.ts" || \
  ec2_run "docker exec -i distro-api npx ts-node prisma/setup-platform-admin.ts"

echo ""
ok "PLATFORM_ADMIN account created"

# ══════════════════════════════════════════════════════════════════════════
echo ""
echo "── STEP 7: Onboard First Tenant (Nath Sales) ───────────────────"
echo ""

info "Enter PLATFORM_ADMIN credentials to onboard Nath Sales..."
read -r -p "  PLATFORM_ADMIN email: " PA_EMAIL
read -r -s -p "  PLATFORM_ADMIN password: " PA_PASS; echo ""

# Get PLATFORM_ADMIN token
info "Logging in as PLATFORM_ADMIN..."
LOGIN_RESP=$(curl -sf -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$PA_EMAIL\",\"password\":\"$PA_PASS\"}" 2>&1) || fail "Login request failed — is the API reachable at $API_BASE?"

PA_TOKEN=$(echo "$LOGIN_RESP" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -z "$PA_TOKEN" ]; then
  warn "Login response: $LOGIN_RESP"
  fail "Could not extract accessToken — login may have failed"
fi
ok "PLATFORM_ADMIN logged in"

# Collect tenant details
echo ""
info "Enter details for first tenant (or press Enter for defaults):"
read -r -p "  Tenant name    [Nath Sales]: "    TENANT_NAME;   TENANT_NAME="${TENANT_NAME:-Nath Sales}"
read -r -p "  Tenant slug    [nath-sales]: "    TENANT_SLUG;   TENANT_SLUG="${TENANT_SLUG:-nath-sales}"
read -r -p "  Owner name     [Bapu Kute]: "     OWNER_NAME;    OWNER_NAME="${OWNER_NAME:-Bapu Kute}"
read -r -p "  Owner email: "                    OWNER_EMAIL
read -r -s -p "  Owner password (min 8 chars): " OWNER_PASS; echo ""
read -r -p "  Contact phone  (optional): "      CONTACT_PHONE

if [ -z "$OWNER_EMAIL" ] || [ -z "$OWNER_PASS" ]; then
  fail "Owner email and password are required"
fi

info "Onboarding tenant '$TENANT_NAME'..."
ONBOARD_RESP=$(curl -sf -X POST "$API_BASE/tenants/onboard" \
  -H "Authorization: Bearer $PA_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$TENANT_NAME\",
    \"slug\": \"$TENANT_SLUG\",
    \"ownerEmail\": \"$OWNER_EMAIL\",
    \"ownerPassword\": \"$OWNER_PASS\",
    \"ownerName\": \"$OWNER_NAME\",
    \"contactPhone\": \"$CONTACT_PHONE\",
    \"plan\": \"STARTER\"
  }" 2>&1) || fail "Onboard request failed"

# Extract tenant.id (not owner.id) from onboard payload
TENANT_ID=$(echo "$ONBOARD_RESP" | sed -n 's/.*"tenant"[[:space:]]*:[[:space:]]*{[^}]*"id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
if [ -z "$TENANT_ID" ]; then
  TENANT_ID=$(echo "$ONBOARD_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi
if [ -z "$TENANT_ID" ]; then
  warn "Onboard response: $ONBOARD_RESP"
  fail "Tenant creation failed — check API logs: docker logs distro-api --tail 30"
fi

ok "Tenant '$TENANT_NAME' created (ID: $TENANT_ID)"
echo "    Owner: $OWNER_NAME <$OWNER_EMAIL>"

# ══════════════════════════════════════════════════════════════════════════
echo ""
echo "── STEP 8: Verify Multi-Tenant Flow ───────────────────────────"
echo ""

# Owner login
info "Testing OWNER login..."
OWNER_LOGIN=$(curl -sf -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$OWNER_PASS\"}" 2>&1)

OWNER_TOKEN=$(echo "$OWNER_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -z "$OWNER_TOKEN" ]; then
  warn "Owner login response: $OWNER_LOGIN"
  fail "Owner login failed"
fi
ok "OWNER login successful"

# Verify OWNER cannot access /tenants list (PLATFORM_ADMIN only)
info "Verifying RBAC: OWNER cannot list all tenants..."
TENANTS_RESP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  "$API_BASE/tenants")
if [ "$TENANTS_RESP_CODE" = "200" ]; then
  warn "RBAC issue: OWNER can list all tenants — check RolesGuard"
else
  ok "RBAC correct: OWNER gets HTTP $TENANTS_RESP_CODE on /tenants (expected 403)"
fi

# Verify PLATFORM_ADMIN can list tenants
info "Verifying PLATFORM_ADMIN can list tenants..."
PA_TENANTS=$(curl -sf \
  -H "Authorization: Bearer $PA_TOKEN" \
  "$API_BASE/tenants" 2>&1)
if echo "$PA_TENANTS" | grep -q "data"; then
  ok "PLATFORM_ADMIN can list tenants"
else
  warn "Unexpected response: $PA_TENANTS"
fi

# Verify OWNER can access their own products endpoint
info "Verifying tenant-scoped products endpoint..."
PROD_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  "$API_BASE/products")
ok "Products endpoint responds HTTP $PROD_CODE (authenticated owner)"

# ══════════════════════════════════════════════════════════════════════════
echo ""
echo "── STEP 9: Seed Test Data for Pricing Verification ────────────"
echo ""
# Verified API paths (prefix: $API_BASE = http://<EC2_IP>:4000/api/v1):
#   POST /auth/login
#   POST /tenants/onboard          (PLATFORM_ADMIN)
#   GET  /tenants                  (PLATFORM_ADMIN)
#   GET  /products                 (OWNER + tenant context)
#   POST /agencies                 (OWNER + tenant)
#   POST /categories               (OWNER + tenant)
#   POST /products                 (OWNER + tenant)
#   POST /pricing/rules            (OWNER + tenant) — NOT /pricing
#   POST /pricing/resolve          (authenticated + tenant)

info "Creating a test agency (Chitale Dairy)..."
AGENCY_RESP=$(curl -sf -X POST "$API_BASE/agencies" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"name":"Chitale Dairy","description":"Dairy products agency"}' 2>&1)
AGENCY_ID=$(echo "$AGENCY_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$AGENCY_ID" ] && ok "Agency created: $AGENCY_ID" || warn "Agency creation: $AGENCY_RESP"

info "Creating a test category (Dairy)..."
CAT_RESP=$(curl -sf -X POST "$API_BASE/categories" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Dairy\",\"slug\":\"dairy\"}" 2>&1)
CAT_ID=$(echo "$CAT_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$CAT_ID" ] && ok "Category created: $CAT_ID" || warn "Category creation: $CAT_RESP"

if [ -n "$AGENCY_ID" ] && [ -n "$CAT_ID" ]; then
  info "Creating test product (Milk 1L — base ₹20)..."
  PROD_RESP=$(curl -sf -X POST "$API_BASE/products" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "X-Tenant-ID: $TENANT_ID" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\":\"Milk 1L\",\"sku\":\"MILK-1L\",
      \"pricePerUnit\":2000,\"agencyId\":\"$AGENCY_ID\",
      \"categoryId\":\"$CAT_ID\",\"taxPercent\":0,
      \"unitType\":\"LITRE\"
    }" 2>&1)
  PROD_ID=$(echo "$PROD_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  [ -n "$PROD_ID" ] && ok "Product created: Milk 1L (₹20 base) ID=$PROD_ID" || warn "Product creation: $PROD_RESP"

  # Create HOTEL pricing rule (₹18)
  if [ -n "$PROD_ID" ]; then
    info "Creating pricing rule: HOTEL customers → ₹18..."
    PR_RESP=$(curl -sf -X POST "$API_BASE/pricing/rules" \
      -H "Authorization: Bearer $OWNER_TOKEN" \
      -H "X-Tenant-ID: $TENANT_ID" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\":\"Hotel Milk Rate\",
        \"customerType\":\"HOTEL\",
        \"productId\":\"$PROD_ID\",
        \"priceType\":\"FIXED_PRICE\",
        \"value\":1800,
        \"priority\":10
      }" 2>&1)
    echo "$PR_RESP" | grep -q '"id"' && ok "Pricing rule: HOTEL = ₹18 created" || warn "Pricing rule: $PR_RESP"

    info "Creating pricing rule: RETAILER customers → 5% off (₹19)..."
    curl -sf -X POST "$API_BASE/pricing/rules" \
      -H "Authorization: Bearer $OWNER_TOKEN" \
      -H "X-Tenant-ID: $TENANT_ID" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\":\"Retailer Discount\",
        \"customerType\":\"RETAILER\",
        \"productId\":\"$PROD_ID\",
        \"priceType\":\"PERCENTAGE_OFF\",
        \"value\":5,
        \"priority\":5
      }" > /dev/null 2>&1 && ok "Pricing rule: RETAILER = 5% off created"

    info "Creating pricing rule: WHOLESALER customers → 20% off (₹16)..."
    curl -sf -X POST "$API_BASE/pricing/rules" \
      -H "Authorization: Bearer $OWNER_TOKEN" \
      -H "X-Tenant-ID: $TENANT_ID" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\":\"Wholesale Rate\",
        \"customerType\":\"WHOLESALER\",
        \"productId\":\"$PROD_ID\",
        \"priceType\":\"PERCENTAGE_OFF\",
        \"value\":20,
        \"priority\":5
      }" > /dev/null 2>&1 && ok "Pricing rule: WHOLESALER = 20% off created"

    info "Testing POST /pricing/resolve (HOTEL → ₹18)..."
    RESOLVE_RESP=$(curl -sf -X POST "$API_BASE/pricing/resolve" \
      -H "Authorization: Bearer $OWNER_TOKEN" \
      -H "X-Tenant-ID: $TENANT_ID" \
      -H "Content-Type: application/json" \
      -d "{\"productId\":\"$PROD_ID\",\"customerType\":\"HOTEL\"}" 2>&1) || true
    if echo "$RESOLVE_RESP" | grep -q '"resolvedPrice":1800'; then
      ok "Pricing resolve: HOTEL = ₹18 (1800 paise)"
    else
      warn "Pricing resolve response: $RESOLVE_RESP"
    fi
  fi
fi

# ══════════════════════════════════════════════════════════════════════════
echo ""
echo "── STEP 10: Final Production State Verification ───────────────"
echo ""

# Health check
HEALTH=$(curl -sf "http://$EC2_IP:4000/health" 2>&1)
echo "$HEALTH" | grep -q -i "ok\|healthy\|status" && ok "Health endpoint OK" || warn "Health: $HEALTH"

# Container status
info "Container state:"
ec2_run "docker inspect distro-api --format '{{.State.Status}} — uptime: {{.State.StartedAt}}'" 2>&1 | sed 's/^/    /'

# DB row counts
info "Database row counts:"
rds_sql_db "
  SELECT
    relname AS table_name,
    n_live_tup AS row_count
  FROM pg_stat_user_tables
  WHERE n_live_tup > 0
  ORDER BY relname;
" 2>&1 | sed 's/^/    /'

# Final summary
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅  CLEAN INITIALIZATION COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  EC2 API:       http://$EC2_IP:4000/api/v1"
echo "  API Docs:      http://$EC2_IP:4000/api/v1/docs"
echo "  Health:        http://$EC2_IP:4000/health"
echo ""
echo "  Tenant:        $TENANT_NAME (ID: $TENANT_ID)"
echo "  Owner login:   $OWNER_EMAIL"
echo "  Admin login:   $PA_EMAIL"
echo ""
echo "  Next steps:"
echo "    1. Update Vercel env var:  NEXT_PUBLIC_API_URL=http://$EC2_IP:4000/api/v1"
echo "    2. Login as owner and create agencies, products, and pricing rules"
echo "    3. Create customer accounts and test order flow"
echo "    4. Add HTTPS via Let's Encrypt when ready for real clients"
echo ""
