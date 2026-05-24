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

### Step 1: Update EC2 Environment Variables
SSH into your EC2 instance and update the backend .env file:

```bash
# SSH to EC2
ssh -i "$EC2_KEY" ec2-user@$EC2_IP

# Edit the environment file
nano /home/ec2-user/.env

# Add/update CORS_ORIGINS with your Vercel production domain:
# CORS_ORIGINS="https://distro-platform.vercel.app,http://localhost:3000"
```

**Critical:** The `CORS_ORIGINS` value must exactly match your Vercel deployment domain.
For example, if deployed at `https://distro-platform.vercel.app`, use exactly that.

### Step 2: Rebuild Docker Image with Updated Code
On EC2, pull the latest code and rebuild the API image:

```bash
cd /home/ec2-user/app/distro-platform

# Pull latest changes from git (includes CORS fix)
git fetch --all
git reset --hard origin/main

# Rebuild the API Docker image
docker build --target production -f apps/api/Dockerfile -t distro-api:latest .
```

### Step 3: Stop Old Container and Start New One
```bash
# Stop and remove old container
docker stop distro-api
docker rm distro-api

# Start new container with updated code and .env
docker run -d \
  --name distro-api \
  --restart unless-stopped \
  --env-file /home/ec2-user/.env \
  -p 4000:4000 \
  --log-opt max-size=50m \
  --log-opt max-file=3 \
  distro-api:latest

# Check logs
docker logs -f distro-api
```

### Step 4: Verify Backend is Running
```bash
# Test health endpoint
curl http://localhost:4000/health

# Should return:
# {"status":"ok","service":"api","timestamp":"2024-..."}
```

### Step 5: Test Login Flow from Vercel
1. Navigate to your Vercel-deployed frontend
2. Try logging in with credentials:
   - **PLATFORM_ADMIN**: `platform@distropro.in` / `password123`
   - **OWNER**: `owner@nathsales.com` / `password123` 
3. Check browser DevTools Network tab:
   - POST request to `/api/v1/auth/login` should return **200 OK**
   - Should NOT see "Provisional headers" warning
   - Response should include `{ accessToken, refreshToken, user }`
4. Should redirect to appropriate dashboard (PLATFORM_ADMIN → /admin, OWNER → /owner)

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
