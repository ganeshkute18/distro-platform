# AWS CORS Configuration Deployment Guide

## Problem
Frontend login requests from Vercel were being blocked by CORS preflight failures. The NestJS backend had incomplete CORS configuration:
- Missing `allowedHeaders` (Authorization, Content-Type, etc.)
- Default `CORS_ORIGINS` hardcoded to `http://localhost:3000` (dev only)
- No handling for production Vercel domain

## Solution Applied (Commit 931edcd)
Enhanced backend CORS configuration in [apps/api/src/main.ts](apps/api/src/main.ts):
- Added explicit `allowedHeaders` list (Content-Type, Authorization, X-Tenant-ID, X-Tenant-Slug, Accept)
- Added `exposedHeaders` for pagination (X-Total-Count, X-Page-Number)
- Improved origin parsing to handle comma-separated and wildcard origins
- Now defaults to both `localhost:3000` and `localhost:3001` for development

## Required Deployment Steps

### Step 0: DNS records for HTTPS API
Create an A record for the API subdomain pointing to your EC2 public IPv4 address.

- Name: `api`
- Type: `A`
- Value: `<EC2_PUBLIC_IPV4>`
- TTL: `300`

Optional for convenience:
- Name: `www.api`
- Type: `CNAME`
- Value: `api.distropro.in`

### Step 1: EC2 security group changes
Update the EC2 security group to allow only the necessary public ports:

- Inbound TCP 80 from `0.0.0.0/0`
- Inbound TCP 443 from `0.0.0.0/0`
- Inbound TCP 22 from your administrative IP only, e.g. `203.0.113.45/32`
- Remove any inbound rule opening TCP 4000 to the public internet

### Step 2: Install Nginx and configure reverse proxy
SSH into EC2 and run the setup script or manual commands.

```bash
ssh -i "$EC2_KEY" ec2-user@$EC2_IP
cd /home/ec2-user/app/distro-platform

# Copy .env into apps/api if not already present
cp /home/ec2-user/.env apps/api/.env

# Use the helper script:
API_DOMAIN=api.distropro.in CERTBOT_EMAIL=admin@distropro.in ./infra/setup-nginx-ssl.sh
```

If you prefer manual install:

```bash
sudo dnf install -y nginx certbot python3-certbot-nginx || sudo yum install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
sudo tee /etc/nginx/conf.d/api.distropro.in.conf > /dev/null <<'EOF'
server {
  listen 80;
  server_name api.distropro.in;
  location / {
    return 301 https://$host$request_uri;
  }
  location /.well-known/acme-challenge/ {
    root /var/lib/letsencrypt;
  }
}
server {
  listen 443 ssl http2;
  server_name api.distropro.in;
  ssl_certificate /etc/letsencrypt/live/api.distropro.in/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.distropro.in/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
EOF
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx --noninteractive --agree-tos --email admin@distropro.in -d api.distropro.in --redirect
sudo systemctl enable --now certbot.timer || true
sudo certbot renew --dry-run
```

### Step 3: Keep backend Docker running on localhost:4000
Make sure the Docker backend stays running exactly as before.
The Nginx proxy will forward external HTTPS traffic to the internal API container.

```bash
docker stop distro-api
docker rm distro-api
docker run -d \
  --name distro-api \
  --restart unless-stopped \
  --env-file /home/ec2-user/.env \
  -p 4000:4000 \
  --log-opt max-size=50m \
  --log-opt max-file=3 \
  distro-api:latest
```

### Step 4: Update backend CORS_ORIGINS and Vercel settings
In the backend `.env` file, set CORS_ORIGINS to the actual frontend origin(s), not the API domain.

```bash
CORS_ORIGINS="https://distropro.in"
# or if needed:
# CORS_ORIGINS="https://distropro.in,https://www.distropro.in"
```

In the Vercel project environment variables, update:

- `NEXT_PUBLIC_API_URL=https://api.distropro.in/api/v1`
- `NEXT_PUBLIC_SOCKET_URL=https://api.distropro.in`

### Step 5: Verify login/auth from Vercel
1. Confirm `https://api.distropro.in` resolves to your EC2 public IP.
2. Confirm `nginx -t` passes and `sudo systemctl status nginx` is active.
3. Confirm `curl -I https://api.distropro.in/api/v1/health` returns `200`.
4. Confirm the browser sees `https://api.distropro.in/api/v1/auth/login` and not HTTP.
5. Confirm login from Vercel returns `200 OK` with `accessToken` and `refreshToken`.

## Automated Deployment Option
If you want to redo the entire AWS setup with the CORS fix included:

```bash
# On your local machine, update .env.aws:
# - Set EC2_IP, EC2_KEY, RDS credentials
# - Set CORS_ORIGINS to your Vercel domain

# Then run the automated setup:
source .env.aws
./infra/init-clean-aws.sh
```

This will:
- Reset RDS database
- Deploy latest code with CORS fix
- Create PLATFORM_ADMIN account
- Configure all environment variables including CORS_ORIGINS

## Free HTTPS alternative: Cloudflare Tunnel
When you do not want to purchase a domain, use Cloudflare Tunnel to expose the backend over HTTPS:

1. SSH to EC2.
2. Install `cloudflared`.
3. Run `cloudflared tunnel --url http://localhost:4000`.
4. Copy the generated `https://<tunnel-url>.trycloudflare.com` URL.
5. Set Vercel env vars to:
   - `NEXT_PUBLIC_API_URL=https://<tunnel-url>/api/v1`
   - `NEXT_PUBLIC_SOCKET_URL=https://<tunnel-url>`
6. Redeploy the Vercel frontend.

See [infra/CLOUDFLARE_TUNNEL.md](infra/CLOUDFLARE_TUNNEL.md) for exact commands.

## Troubleshooting

### "Failed to load response data" or "Provisional headers are shown"
This indicates a CORS preflight failure:
1. Check backend logs: `docker logs distro-api`
2. Verify `CORS_ORIGINS` includes your exact frontend domain
3. Verify no typos in domain name
4. Restart container after updating .env: `docker restart distro-api`

### Login redirect not working
1. Verify token is being received (check Network tab > Response)
2. Check browser console for errors
3. Verify `NEXT_PUBLIC_API_URL` is correctly set in Vercel environment variables

### Backend logs show CORS errors
1. Check that `--env-file` points to correct .env with CORS_ORIGINS set
2. Verify environment variable syntax: `CORS_ORIGINS="https://domain.com,http://localhost:3000"`
3. No spaces after commas in comma-separated list

## Files Modified
- [apps/api/src/main.ts](apps/api/src/main.ts) - Enhanced CORS configuration
- [.env.aws.example](.env.aws.example) - Documented CORS_ORIGINS requirement
- [infra/init-clean-aws.sh](infra/init-clean-aws.sh) - Updated documentation

## Testing Headers
To verify CORS headers are being sent correctly, run:

```bash
# From your local machine:
curl -i -X OPTIONS http://13.205.128.48:4000/api/v1/auth/login \
  -H "Origin: https://distro-platform.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization,Content-Type"
```

Should return:
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://distro-platform.vercel.app
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-Tenant-ID,X-Tenant-Slug,Accept
Access-Control-Allow-Credentials: true
```
