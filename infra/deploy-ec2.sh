#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# DistroPro — EC2 Deployment Script (SaaS Hardening v2)
#
# USAGE:
#   ssh -i your-key.pem ec2-user@<EC2_IP> "bash -s" < infra/deploy-ec2.sh
#
# PREREQUISITES:
#   1. Docker installed on EC2 (Amazon Linux 2023 — comes via cloudinit)
#   2. .env file placed at /home/ec2-user/.env  (one-time manual step)
#   3. Prisma migrations applied automatically (includes saas_hardening_v2)
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

APP_DIR="/home/ec2-user/app"
REPO_URL="https://github.com/ganeshkute18/distro-platform.git"
IMAGE_NAME="distro-api"
CONTAINER_NAME="distro-api"
HEALTH_URL="http://localhost:4000/health"

log()  { echo "$(date '+%H:%M:%S') ✅ $*"; }
warn() { echo "$(date '+%H:%M:%S') ⚠️  $*"; }
fail() { echo "$(date '+%H:%M:%S') ❌ $*"; exit 1; }

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  DistroPro EC2 Deployment — $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════"
echo ""

# ─── 1. Validate .env file exists ─────────────────────────────────────────
ENV_FILE="/home/ec2-user/.env"
if [ ! -f "$ENV_FILE" ]; then
  fail "No .env file found at $ENV_FILE. Create it first:
  scp -i your-key.pem .env ec2-user@<EC2_IP>:/home/ec2-user/.env"
fi
log "Found .env at $ENV_FILE"

# ─── 2. Clone or update repository ───────────────────────────────────────
mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [ -d "distro-platform/.git" ]; then
  log "Pulling latest code..."
  cd distro-platform
  git fetch --all
  git reset --hard origin/main
  cd ..
else
  log "Cloning repository..."
  git clone "$REPO_URL"
fi

cd distro-platform
COMMIT=$(git rev-parse --short HEAD)
log "Deployed commit: $COMMIT"

# ─── 3. Copy .env to API directory ────────────────────────────────────────
cp "$ENV_FILE" apps/api/.env
log ".env copied to apps/api/"

# ─── 4. Build Docker image ────────────────────────────────────────────────
log "Building Docker image (this takes ~2-3 minutes)..."
docker build \
  --target production \
  --label "commit=$COMMIT" \
  --label "built=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -f apps/api/Dockerfile \
  -t "$IMAGE_NAME:$COMMIT" \
  -t "$IMAGE_NAME:latest" \
  .
log "Docker image built: $IMAGE_NAME:$COMMIT"

# ─── 5. Run database migration (Prisma deploy — no data loss) ────────────
log "Running Prisma migrations against RDS..."
docker run --rm \
  --env-file apps/api/.env \
  "$IMAGE_NAME:latest" \
  npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma
log "Prisma migrations applied"

# ─── 6. Stop old container gracefully ────────────────────────────────────
if docker ps -q --filter "name=$CONTAINER_NAME" | grep -q .; then
  log "Stopping old container gracefully..."
  docker stop --time=15 "$CONTAINER_NAME" 2>/dev/null || true
fi
docker rm "$CONTAINER_NAME" 2>/dev/null || true

# ─── 7. Start new container ───────────────────────────────────────────────
log "Starting new container..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --env-file apps/api/.env \
  -p 4000:4000 \
  --log-opt max-size=50m \
  --log-opt max-file=3 \
  "$IMAGE_NAME:latest"

# ─── 8. Health check loop ─────────────────────────────────────────────────
log "Waiting for API to be healthy..."
ATTEMPTS=0
MAX_ATTEMPTS=30
until curl -sf "$HEALTH_URL" > /dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    fail "Healthcheck failed after ${MAX_ATTEMPTS} attempts. Last logs:
$(docker logs $CONTAINER_NAME --tail 60)"
  fi
  sleep 3
done
log "API is healthy after $((ATTEMPTS * 3))s"

# ─── 9. Smoke test: check /api/v1 returns 404 (not 502) ──────────────────
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/v1 || echo "000")
if [ "$HTTP_CODE" = "000" ]; then
  fail "API not reachable at all (got 000)"
fi
log "API responds with HTTP $HTTP_CODE (expected 404/200)"

# ─── 10. Cleanup old images ──────────────────────────────────────────────
docker image prune -f > /dev/null 2>&1 || true
log "Old images cleaned up"

# ─── Summary ─────────────────────────────────────────────────────────────
PUBLIC_IP=$(curl -s --max-time 2 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "unknown")

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅  Deployment SUCCESSFUL — commit $COMMIT"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  API (internal): http://localhost:4000/api/v1"
echo "  External API:   https://api.distropro.in/api/v1"
echo "  Health:         http://localhost:4000/health"
echo ""
echo "  Useful commands:"
echo "    docker logs $CONTAINER_NAME -f          # Stream logs"
echo "    docker exec -it $CONTAINER_NAME sh      # Shell"
echo "    docker stats $CONTAINER_NAME            # CPU/RAM"
echo ""
