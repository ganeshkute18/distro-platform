# Free HTTPS Backend via Cloudflare Tunnel

This is a minimal free alternative to buying a domain or configuring Nginx for SSL.
It exposes your existing AWS EC2 Docker backend at `http://localhost:4000` through a temporary `*.trycloudflare.com` HTTPS URL.

## Requirements
- Backend Docker container must already be running on EC2 and listening on `localhost:4000`
- No changes to database or Prisma schema
- No Docker rebuild required unless the backend image is broken
- Do not use Railway/Render/domain purchase/Nginx

## Steps

### 1. SSH into EC2

```bash
ssh -i "$EC2_KEY" ec2-user@$EC2_IP
```

### 2. Install cloudflared on Amazon Linux 2023

```bash
sudo curl -L -o /usr/local/bin/cloudflared \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo chmod +x /usr/local/bin/cloudflared
cloudflared --version
```

### 3. Start the temporary tunnel forwarding the backend

```bash
cloudflared tunnel --url http://localhost:4000
```

The command output will include a generated HTTPS URL like:

```text
https://random-name.trycloudflare.com
```

Capture that exact URL.

### 4. Verify the backend health endpoint via tunnel

```bash
curl -i https://<tunnel-url>/health
```

Expected response:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"status":"ok","service":"api","timestamp":"..."}
```

### 5. Update Vercel environment variables

In Vercel, update the frontend project settings:

- `NEXT_PUBLIC_API_URL=https://<tunnel-url>/api/v1`
- `NEXT_PUBLIC_SOCKET_URL=https://<tunnel-url>`

Do not change backend Docker setup or database.

### 6. Redeploy the Vercel frontend

Trigger a redeploy in Vercel after updating the env vars.

### 7. Verify login works from Vercel

Try logging in with:

- `platform@distropro.in`
- `owner@nathsales.com`

Confirm the browser network request goes to `https://<tunnel-url>/api/v1/auth/login` and returns `200 OK`.

## Notes
- The tunnel URL is temporary; if the tunnel stops, you must restart it and update Vercel again.
- This is a free development workaround when you do not want to purchase a domain.
- The backend remains on `localhost:4000` and is not exposed publicly except through the tunnel.
- Since this is a temporary URL, keep Vercel environment updates minimal and change them only when the tunnel URL changes.
