#!/bin/bash
# ═══════════════════════════════════════════════════════════
# DistroPro — EC2 Deployment Script
# Run this ON the EC2 instance via SSH
# ═══════════════════════════════════════════════════════════

set -e

APP_DIR="/home/ec2-user/app"
REPO_URL="https://github.com/ganeshkute18/distro-platform.git"

echo "🚀 Starting DistroPro deployment on EC2..."

# ─── 1. Clone or pull latest code ─────────────────────────
cd "$APP_DIR"

if [ -d "distro-platform" ]; then
  echo "📦 Pulling latest code..."
  cd distro-platform
  git pull origin main
else
  echo "📦 Cloning repository..."
  git clone "$REPO_URL"
  cd distro-platform
fi

# ─── 2. Copy env file ────────────────────────────────────
if [ -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env" apps/api/.env
  echo "✅ .env file copied to apps/api/"
else
  echo "⚠️  No .env file found at $APP_DIR/.env"
  echo "   Create it with your DATABASE_URL, JWT secrets, etc."
  exit 1
fi

# ─── 3. Build Docker image ───────────────────────────────
echo "🐳 Building Docker image..."
docker build \
  --target production \
  -f apps/api/Dockerfile \
  -t distro-api:latest \
  .

# ─── 4. Stop old container if running ────────────────────
echo "🛑 Stopping old container..."
docker stop distro-api 2>/dev/null || true
docker rm distro-api 2>/dev/null || true

# ─── 5. Run new container ────────────────────────────────
echo "▶️  Starting new container..."
docker run -d \
  --name distro-api \
  --restart unless-stopped \
  --env-file apps/api/.env \
  -p 4000:4000 \
  distro-api:latest

# ─── 6. Wait for healthy ─────────────────────────────────
echo "⏳ Waiting for healthcheck..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ API is healthy!"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌ Healthcheck failed after 30 attempts"
    echo "📋 Container logs:"
    docker logs distro-api --tail 50
    exit 1
  fi
  sleep 2
done

# ─── 7. Show status ──────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ Deployment complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "API URL:  http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):4000/api/v1"
echo "Health:   http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):4000/health"
echo ""
echo "Useful commands:"
echo "  docker logs distro-api -f          # Follow logs"
echo "  docker exec -it distro-api sh      # Shell into container"
echo "  docker restart distro-api          # Restart"
echo ""

# ─── 8. Cleanup old images ───────────────────────────────
docker image prune -f > /dev/null 2>&1
echo "🧹 Old images cleaned up"
