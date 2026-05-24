#!/bin/bash
set -euo pipefail

API_DOMAIN="${API_DOMAIN:-}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-4000}"
NGINX_CONF="/etc/nginx/conf.d/${API_DOMAIN}.conf"

if [ -z "$API_DOMAIN" ] || [ -z "$CERTBOT_EMAIL" ]; then
  cat <<EOF
Usage:
  API_DOMAIN=api.distropro.in CERTBOT_EMAIL=admin@distropro.in ./infra/setup-nginx-ssl.sh

This script installs Nginx, writes a reverse proxy config, and obtains a Let's Encrypt certificate.
EOF
  exit 1
fi

echo "=== Installing Nginx and Certbot ==="
sudo dnf install -y nginx certbot python3-certbot-nginx || sudo yum install -y nginx certbot python3-certbot-nginx

if [ ! -x "$(command -v nginx)" ]; then
  echo "ERROR: nginx installation failed."
  exit 1
fi

echo "=== Writing Nginx HTTP config to $NGINX_CONF ==="
sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
  listen 80;
  server_name ${API_DOMAIN};

  location /.well-known/acme-challenge/ {
    root /var/lib/letsencrypt;
  }

  location / {
    return 301 https://\$host\$request_uri;
  }
}
EOF

echo "=== Testing Nginx configuration ==="
sudo nginx -t

echo "=== Enabling and starting Nginx ==="
sudo systemctl enable --now nginx

sudo mkdir -p /var/lib/letsencrypt
sudo chown -R nginx:nginx /var/lib/letsencrypt || true

echo "=== Obtaining Let's Encrypt certificate for ${API_DOMAIN} ==="
sudo certbot certonly --webroot --webroot-path /var/lib/letsencrypt --noninteractive --agree-tos --email "$CERTBOT_EMAIL" -d "$API_DOMAIN"

echo "=== Writing full HTTPS Nginx config to $NGINX_CONF ==="
sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
  listen 80;
  server_name ${API_DOMAIN};

  location /.well-known/acme-challenge/ {
    root /var/lib/letsencrypt;
  }

  location / {
    return 301 https://\$host\$request_uri;
  }
}

server {
  listen 443 ssl http2;
  server_name ${API_DOMAIN};

  ssl_certificate /etc/letsencrypt/live/${API_DOMAIN}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${API_DOMAIN}/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers on;
  ssl_ciphers "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256";
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
  add_header X-Frame-Options DENY;
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy "no-referrer-when-downgrade";
  add_header X-XSS-Protection "1; mode=block";

  client_max_body_size 50M;

  location / {
    proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_cache_bypass \$http_upgrade;
  }
}
EOF

echo "=== Testing Nginx configuration ==="
sudo nginx -t

echo "=== Reloading Nginx ==="
sudo systemctl reload nginx

echo "=== Enabling Certbot renewal timer ==="
sudo systemctl enable --now certbot.timer || true

echo "=== HTTPS setup complete ==="
echo "External API is now available at: https://$API_DOMAIN/api/v1"
echo "Verify renewal with: sudo certbot renew --dry-run"
