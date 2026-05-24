#!/bin/bash
set -euo pipefail

# Minimal helper to install cloudflared on Amazon Linux 2023 and start a temporary tunnel
# to the local backend running on http://localhost:4000.
# This script does not modify Docker or the database.

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run this script with sudo or as root."
  exit 1
fi

echo "=== Installing cloudflared if missing ==="
if ! command -v cloudflared >/dev/null 2>&1; then
  curl -L -o /usr/local/bin/cloudflared \
    https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
  chmod +x /usr/local/bin/cloudflared
fi

cloudflared --version

echo "=== Starting temporary Cloudflare Tunnel for http://localhost:4000 ==="
echo "The tunnel will use a trycloudflare.com URL and forward requests to local port 4000."

echo "Run the following command to start the tunnel and capture the generated URL:"
echo "  cloudflared tunnel --url http://localhost:4000"

echo "If you want this command to stay in the foreground, run it directly and copy the URL from its output."
echo "If you need to keep the tunnel running in background, run:"
echo "  nohup cloudflared tunnel --url http://localhost:4000 > /tmp/cloudflared.log 2>&1 &"

echo "Then inspect /tmp/cloudflared.log for the trycloudflare URL."
