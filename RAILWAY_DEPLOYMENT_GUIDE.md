# Railway Deployment Guide — Backend (NestJS + Prisma)

## Overview

This guide fixes the `DATABASE_URL is required and cannot be empty` error on Railway by properly configuring the backend service, PostgreSQL database, and environment variables.

**Status:** ✅ Backend should deploy successfully with this guide
**Platform:** Railway.app
**Backend:** NestJS + Prisma (monorepo: `@distro/api`)
**Database:** PostgreSQL
**Frontend:** Vercel (separate deployment)

---

## Prerequisites

- [ ] Railway account with billing setup
- [ ] Backend repository connected to Railway
- [ ] GitHub repo with main branch containing `/apps/api`
- [ ] Vercel frontend already deployed (for CORS_ORIGINS value)

---

## Part 1: Create PostgreSQL Database Service

### Step 1.1: Add PostgreSQL Service

1. Go to **railway.app dashboard**
2. Open your project
3. Click **+ New** button
4. Select **Database** → **Postgres**
5. Railway creates a new PostgreSQL service
6. Wait ~30 seconds for the service to boot

### Step 1.2: Generate DATABASE_URL

1. Click on the **Postgres** service
2. Go to **Variables** tab
3. Look for **DATABASE_URL** variable (Railway auto-generates this)
4. Copy the full connection string
5. It should look like:
   ```
   postgresql://postgres:<PASSWORD>@<HOST>:<PORT>/railway?sslmode=require
   ```

✅ **Important:** This DATABASE_URL will be automatically available to services connected to this Postgres service.

---

## Part 2: Configure Backend Service

### Step 2.1: Add Backend Service from GitHub

1. In your project dashboard, click **+ New**
2. Select **GitHub Repo** (or connect your repo if not already connected)
3. Select your monorepo repository
4. Click **Add Service**
5. Railway creates a new backend service

### Step 2.2: Configure Service Settings

1. Click on the **Backend** service (or whatever it's named)
2. Go to **Settings** tab
3. Scroll to **Root Directory** section
4. Set the root directory to: `./apps/api`
   - This tells Railway where the backend code is in the monorepo
   - ✅ **Critical for monorepo:** Without this, Railway won't find the package.json

### Step 2.3: Configure Build Command

1. In the same **Settings** tab
2. Find **Build Command** section
3. Replace with:
   ```bash
   npm run build
   ```
   - This runs the build script from `/apps/api/package.json`
   - `nest build` compiles TypeScript → JavaScript in `dist/`
   - Prisma client is generated during `npm install`

### Step 2.4: Configure Start Command

1. Still in **Settings** tab
2. Find **Start Command** section
3. Replace with:
   ```bash
   npx prisma migrate deploy --schema=./prisma/schema.prisma && node ./dist/src/main.js
   ```
   - `prisma migrate deploy` runs pending migrations (idempotent)
   - `node ./dist/src/main.js` starts the NestJS server
   - ✅ **From root:** Paths are relative to the service root directory (which is `./apps/api`)

### Step 2.5: Connect PostgreSQL to Backend

**This is the critical step that fixes DATABASE_URL injection:**

1. Go to the **Backend** service
2. Look for **Plugins** section or **Dependencies** section
3. Click **Add Plugin** or **Connect Service**
4. Select the **Postgres** service from the dropdown
5. Railway automatically injects `DATABASE_URL` into the backend's environment variables

✅ **Result:** The backend service now has access to `DATABASE_URL` from Postgres

---

## Part 3: Configure Environment Variables

### Step 3.1: Add Required Variables to Backend Service

1. Click on the **Backend** service
2. Go to **Variables** tab
3. Railway already shows `DATABASE_URL` (from Postgres connection)
4. Add the following environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Disables Swagger docs, enables logging |
| `JWT_ACCESS_SECRET` | (generate random string, 32+ chars) | Keep secret, rotate in production |
| `JWT_REFRESH_SECRET` | (generate random string, 32+ chars) | Keep secret, different from access |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app` | Replace with your Vercel URL |
| `API_PORT` | `4000` | Railway injects `$PORT`, but this is fallback |
| `CLOUDINARY_CLOUD_NAME` | (from Cloudinary) | Optional, only if using image uploads |
| `CLOUDINARY_API_KEY` | (from Cloudinary) | Optional |
| `CLOUDINARY_API_SECRET` | (from Cloudinary) | Optional |

**Example CORS_ORIGINS:**
- Single origin: `https://distropro.vercel.app`
- Multiple origins: `https://distropro.vercel.app,https://admin.distropro.vercel.app`

### Step 3.2: Verify DATABASE_URL

1. Still in **Variables** tab
2. Look for `DATABASE_URL` variable (added by Postgres connection)
3. It should start with `postgresql://` and end with `?sslmode=require`
4. ✅ **Do NOT add it manually** — Railway automatically injects it

---

## Part 4: Deploy and Verify

### Step 4.1: Trigger Deployment

1. Go to the **Backend** service
2. Look for **Deployments** tab
3. You should see a deployment already triggered (from GitHub push)
4. If not, click **Redeploy** button
5. Wait for deployment to complete (~2-5 minutes)

### Step 4.2: Monitor Build Logs

1. Click on the active deployment
2. Go to **Build** tab to watch the build process
3. You should see:
   ```
   npm ci
   npx prisma generate
   npm run build
   ```
4. If build fails, check the error message

### Step 4.3: Monitor Runtime Logs

1. After build succeeds, click **Deploy** tab
2. Watch the runtime logs
3. You should see:
   ```
   > npx prisma migrate deploy
   > node ./dist/src/main.js
   🚀 API running on port 4000 (production)
   ```

### Step 4.4: Get Public API URL

1. In the **Backend** service dashboard
2. Look for **Public URL** or **Domain**
3. It looks like: `https://backend-production-xxxx.railway.app`
4. This is your public API endpoint
5. ✅ **Use this as CORS_ORIGINS** in frontend if frontend is on different domain

---

## Part 5: Verify Backend is Working

### Test 5.1: Health Check Endpoint

```bash
curl https://backend-production-xxxx.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "api",
  "timestamp": "2024-05-26T10:30:00.000Z"
}
```

### Test 5.2: Try a Real Endpoint

```bash
curl https://backend-production-xxxx.railway.app/api/v1/health
```

Expected response: `200 OK` with similar JSON

---

## Troubleshooting

### Error: "DATABASE_URL is required and cannot be empty"

**Root Cause:** Postgres service not connected to backend service

**Fix:**
1. Go to Backend service → **Variables** tab
2. Look for `DATABASE_URL` variable
3. If missing or empty, go to **Settings** → check Postgres connection
4. Re-add the Postgres service connection (see Part 2.5)
5. Redeploy backend

### Error: "Prisma migrate failed" or "Cannot find Prisma schema"

**Root Cause:** Incorrect root directory or schema path

**Fix:**
1. Go to Backend service → **Settings**
2. Check **Root Directory** is set to `./apps/api`
3. Check **Start Command** uses: `npx prisma migrate deploy --schema=./prisma/schema.prisma`
4. Redeploy

### Error: "Cannot find module '@distro/shared-types'"

**Root Cause:** Monorepo dependencies not installed

**Fix:**
1. Backend service → **Settings**
2. Ensure **Root Directory** is `./apps/api`
3. Ensure **Build Command** is `npm run build`
4. The root npm install will install workspace dependencies
5. Redeploy

### Error: "listen EADDRINUSE :::4000"

**Root Cause:** Port conflict (rare on Railway)

**Fix:**
1. Go to Backend service → **Variables**
2. Remove `API_PORT` variable (let Railway's `$PORT` take precedence)
3. Or set `API_PORT` to something like `3001`
4. Redeploy

### Frontend gets CORS error

**Root Cause:** Backend CORS_ORIGINS doesn't include frontend URL

**Fix:**
1. Get your Vercel frontend URL (e.g., `https://distropro.vercel.app`)
2. Go to Backend service → **Variables**
3. Update `CORS_ORIGINS` to include frontend URL
4. Redeploy backend
5. Clear frontend browser cache and try again

---

## Production Checklist

Before going live, verify all of the following:

- [ ] Backend service shows **"Running"** status (green indicator)
- [ ] Latest deployment succeeded (check **Deployments** tab)
- [ ] `curl /health` returns `200 OK`
- [ ] Frontend login works (frontend can reach backend API)
- [ ] DATABASE_URL is set and contains `postgresql://`
- [ ] NODE_ENV is set to `production`
- [ ] All JWT secrets are set and are 32+ characters
- [ ] CORS_ORIGINS includes the frontend URL
- [ ] Database migrations ran successfully (check logs)
- [ ] No errors in the last 10 deployments
- [ ] Backend public URL is updated in frontend CORS settings (if needed)

---

## Understanding Railway Environment Injection

### Why DATABASE_URL appears automatically

When you connect the Postgres service to the Backend service in Railway:
1. Railway generates a DATABASE_URL in the Postgres service
2. Railway automatically exposes it to connected services
3. You don't need to manually add it to Backend variables
4. Railway handles all credential rotation and SSL certificates

### Why other services don't share variables

- Each Railway service is isolated
- Services only share variables if explicitly "connected" via the UI
- Frontend (Vercel) is separate and doesn't get Railway's DATABASE_URL
- Frontend gets its env vars from Vercel dashboard only

---

## Quick Reference: File Structure in Railway

```
Root build context: monorepo root /
Service root directory: ./apps/api

After Railway copies files:
/
├── package.json          ← Root workspace manifest
├── apps/
│   └── api/
│       ├── package.json  ← API package
│       ├── src/
│       │   └── main.ts
│       ├── dist/         ← Built output
│       └── prisma/
│           └── schema.prisma
└── packages/
    └── shared-types/
```

Build steps:
1. `npm ci` — installs from root (all workspaces)
2. `npx prisma generate` — generates Prisma client
3. `npm run build` — runs build script from `/apps/api/package.json` → produces `dist/`
4. Start: `node ./dist/src/main.js` — from service root (`./apps/api`)

---

## FAQ

**Q: Why do I need both Build Command and Start Command?**
A: Build command runs once during deployment (npm run build). Start command runs every time the service boots. Separating them allows caching and faster restarts.

**Q: Can I use a Dockerfile instead of these commands?**
A: Yes, but then you need to explicitly set Dockerfile path in Railway. The build/start commands are simpler for this monorepo.

**Q: Do I need to manually run migrations?**
A: No, the Start Command includes `prisma migrate deploy` which runs migrations on every boot (idempotent, only applies pending).

**Q: What if I need different env vars for staging vs production?**
A: Create a second Railway project for staging. Each project has its own services and env vars.

**Q: How often does Railway rebuild?**
A: Every time you push to the connected branch (usually main/master). Railway automatically deploys.

**Q: Can I see the detailed build logs?**
A: Yes, go to Backend service → **Deployments** → click a deployment → **Build** tab.

---

## Next Steps

1. ✅ Follow Part 1-4 above to configure Railway
2. ✅ Run the verification tests in Part 5
3. ✅ Check the troubleshooting section if any errors
4. ✅ Update frontend CORS_ORIGINS if needed
5. ✅ Test frontend login flow end-to-end

**Success indicators:**
- Backend service is "Running" (green)
- `/health` endpoint responds
- Frontend can login and access API
- No DATABASE_URL errors in logs

---

## Support Links

- [Railway Docs](https://docs.railway.app)
- [Railway PostgreSQL Setup](https://docs.railway.app/databases/postgresql)
- [Railway Environment Variables](https://docs.railway.app/guides/variables)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate/getting-started)
