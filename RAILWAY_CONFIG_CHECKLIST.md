# Railway Backend Configuration Checklist

## Current Issue
- ❌ Backend fails to deploy on Railway
- ❌ Error: "DATABASE_URL is required and cannot be empty"
- ❌ Frontend (Vercel) works, backend doesn't

## Pre-Deployment Checklist

### Project Structure
- [ ] Monorepo has `/apps/api` with NestJS backend
- [ ] `/apps/api/package.json` exists with build/start scripts
- [ ] `/apps/api/src/main.ts` exists
- [ ] `/apps/api/prisma/schema.prisma` exists
- [ ] Dockerfile exists at `/apps/api/Dockerfile` (optional, using build/start commands instead)

### Backend Code
- [ ] `@distro/api` package.json has: `"start": "node dist/src/main.js"`
- [ ] `@distro/api` package.json has: `"build": "nest build"`
- [ ] `main.ts` has `ensureDatabaseUrl()` check (expected)
- [ ] main.ts listens on `0.0.0.0:$PORT` (required for Railway)
- [ ] Prisma schema is valid: `npx prisma validate`

### Dependencies
- [ ] Node.js: 20.x (set in root package.json `engines`)
- [ ] npm: >=10.0.0
- [ ] @nestjs/core and @nestjs/common installed
- [ ] @prisma/client installed
- [ ] All peer dependencies resolved (no warnings)

---

## Railway Service Configuration Checklist

### Step 1: PostgreSQL Service
- [ ] PostgreSQL service exists in Railway project
- [ ] Service status shows "Running" (green indicator)
- [ ] Click Postgres service → Variables tab
- [ ] DATABASE_URL variable exists
- [ ] DATABASE_URL format: `postgresql://postgres:PASSWORD@HOST:PORT/railway?sslmode=require`
- [ ] DATABASE_URL is NOT empty

### Step 2: Backend Service (Root Settings)

**Location:** Backend service → Settings tab

- [ ] **Root Directory** = `./apps/api`
  - ❌ Must NOT be empty or `/`
  - ❌ Must NOT be `apps/api` (should include `./`)
  - ✅ Correct: `./apps/api`

### Step 3: Backend Service (Build Command)

**Location:** Backend service → Settings tab → Build Command

- [ ] **Build Command** = `npm run build`
  - This runs the build script from `/apps/api/package.json`
  - Results in: `/apps/api/dist/src/main.js`
  - Prisma client is generated during `npm install` (before build)

### Step 4: Backend Service (Start Command)

**Location:** Backend service → Settings tab → Start Command

- [ ] **Start Command** = `npx prisma migrate deploy --schema=./prisma/schema.prisma && node ./dist/src/main.js`
  - Paths are relative to service root (`./apps/api`)
  - `prisma migrate deploy` = runs pending migrations
  - `&&` = only start server if migrations succeed
  - `node ./dist/src/main.js` = starts NestJS server

### Step 5: Backend Service (PostgreSQL Connection)

**Location:** Backend service → (look for Plugins/Dependencies section or go to Postgres service)

- [ ] PostgreSQL service is connected to Backend service
- [ ] After connection, Backend service has `DATABASE_URL` in Variables tab
- [ ] `DATABASE_URL` is NOT empty

**How to connect:**
1. Option A: Backend service → Look for "Add Plugin" → select Postgres
2. Option B: Postgres service → Look for "Connect to Service" → select Backend
3. Either method works; Railway makes the connection bidirectional

### Step 6: Backend Service (Environment Variables)

**Location:** Backend service → Variables tab

Required variables:

| Variable | Required | Value |
|----------|----------|-------|
| `DATABASE_URL` | ✅ Yes | Auto-injected by Postgres connection |
| `NODE_ENV` | ✅ Yes | `production` |
| `JWT_ACCESS_SECRET` | ✅ Yes | Random string, 32+ chars (keep secret) |
| `JWT_REFRESH_SECRET` | ✅ Yes | Random string, 32+ chars (keep secret, different) |
| `CORS_ORIGINS` | ✅ Yes | `https://your-frontend.vercel.app` |
| `API_PORT` | ❌ No | (Railway uses `$PORT` env var) |
| `CLOUDINARY_CLOUD_NAME` | ❌ No | (Only if using image uploads) |
| `CLOUDINARY_API_KEY` | ❌ No | (Only if using image uploads) |
| `CLOUDINARY_API_SECRET` | ❌ No | (Only if using image uploads) |

**Example values:**
```
NODE_ENV=production
JWT_ACCESS_SECRET=your-super-secret-access-key-minimum-32-characters-long!
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters-long!
CORS_ORIGINS=https://distropro.vercel.app
```

### Step 7: Backend Service (GitHub Connection)

**Location:** Backend service → Settings tab

- [ ] GitHub repository is connected
- [ ] Repository branch is `main` or `master` (default)
- [ ] "Auto-deploy on push" is enabled (default)

---

## Deployment Checklist

### Trigger Deployment

- [ ] Go to Backend service → Deployments tab
- [ ] Latest deployment shows (should auto-trigger from recent git push)
- [ ] If not, click **Redeploy** button
- [ ] Deployment status shows blue "In Progress" indicator

### Monitor Build Phase

**Location:** Backend service → Deployments → click active deployment → Build tab

- [ ] Build logs show starting...
- [ ] ✅ Expect to see: `npm ci` (installing dependencies)
- [ ] ✅ Expect to see: `npx prisma generate` (generating Prisma client)
- [ ] ✅ Expect to see: `npm run build` (compiling TypeScript)
- [ ] Build completes successfully (no red errors)
- [ ] Build time: 3-5 minutes (normal)

### Monitor Deploy Phase

**Location:** Backend service → Deployments → click active deployment → Deploy tab

- [ ] Status shows "Deploying" → "Running" (green)
- [ ] ✅ Expect to see: `npx prisma migrate deploy` in logs
- [ ] ✅ Expect to see: `🚀 API running on port 4000 (production)` in logs
- [ ] ✅ No error logs about DATABASE_URL
- [ ] Service stays "Running" (doesn't crash)
- [ ] Deploy time: 1-2 minutes after build

---

## Runtime Verification Checklist

### 1. Check Service Status
- [ ] Backend service shows **Running** status (green indicator)
- [ ] No yellow/orange warnings
- [ ] No red crash indicators

### 2. Test Health Endpoint

Get your Backend public URL:
1. Backend service → top right → copy **Public URL** (looks like `https://backend-production-xxxx.railway.app`)

Test endpoint:
```bash
curl https://backend-production-xxxx.railway.app/health
```

- [ ] Response code: `200 OK`
- [ ] Response body:
  ```json
  {
    "status": "ok",
    "service": "api",
    "timestamp": "2024-05-26T..."
  }
  ```

### 3. Test API Endpoint

```bash
curl https://backend-production-xxxx.railway.app/api/v1/health
```

- [ ] Response code: `200 OK`

### 4. Check Recent Logs

**Location:** Backend service → Logs tab (or bottom of Dashboard)

- [ ] No "DATABASE_URL is required" errors
- [ ] No "Prisma schema" errors
- [ ] No "Cannot find module" errors
- [ ] No "listen EADDRINUSE" errors
- [ ] Recent logs show healthy operation

### 5. Verify Database Connection

In Railway logs, look for successful Prisma output:

- [ ] Logs show: `Prisma schema validated` (or similar)
- [ ] No connection refused errors
- [ ] No authentication errors

### 6. Test Frontend Integration

From Vercel frontend:
```bash
# In browser console or make a fetch request
fetch('https://backend-production-xxxx.railway.app/health')
  .then(r => r.json())
  .then(console.log)
```

- [ ] Request succeeds (no CORS error)
- [ ] Response is valid JSON
- [ ] Status shows "ok"

### 7. Test Login Flow (if available)

- [ ] Go to frontend
- [ ] Try to login
- [ ] Frontend successfully calls backend API
- [ ] Login succeeds and receives JWT tokens
- [ ] No CORS or 502 errors

---

## If Deployment Fails: Debugging Checklist

### Build Failed

- [ ] Check Backend service → Deployments → failed deployment → Build tab
- [ ] Read the error message carefully
- [ ] Common causes:
  - [ ] Root Directory is not `./apps/api`
  - [ ] Build Command is incorrect
  - [ ] Missing dependencies (npm install failed)
  - [ ] TypeScript compilation errors

**Action:** Fix the error, commit code, push to GitHub, redeploy

### Deploy Failed (after successful build)

- [ ] Check Backend service → Deployments → failed deployment → Deploy tab
- [ ] Read the error message
- [ ] Common causes:
  - [ ] DATABASE_URL is empty or missing
  - [ ] Start Command is incorrect
  - [ ] Prisma schema path is wrong
  - [ ] Environment variable issue

**Action:** 
1. Check env vars in Backend service → Variables tab
2. Verify DATABASE_URL exists and is not empty
3. Fix Start Command if needed
4. Redeploy

### Service Running but API Not Responding

- [ ] Go to Backend service → Logs tab
- [ ] Search for errors about DATABASE_URL
- [ ] Search for Prisma errors
- [ ] Check for port binding errors

**Action:**
1. If DATABASE_URL error: check Postgres connection (Part 2.5 of guide)
2. If Prisma error: verify schema path in Start Command
3. Redeploy

### DATABASE_URL Empty

- [ ] Go to Backend service → Variables tab
- [ ] Look for DATABASE_URL variable
- [ ] If missing: Postgres is not connected
  - [ ] Go to Postgres service → look for "Connected Services"
  - [ ] Verify Backend is listed
  - [ ] If not, click "Connect Service" and add Backend
  - [ ] Redeploy Backend

- [ ] If present but empty: variable is malformed
  - [ ] Click the variable to view full value
  - [ ] Should start with `postgresql://`
  - [ ] Should end with `?sslmode=require`
  - [ ] If malformed, delete and re-connect Postgres service

---

## Quick Comparison: What Should Happen

### ❌ Current (Broken)
```
Railway Dashboard
├─ Backend Service
│  ├─ Status: Crashed
│  ├─ Error: DATABASE_URL is required
│  └─ Variables: empty (no DATABASE_URL)
└─ Postgres Service
   └─ (not connected to Backend)
```

### ✅ After Fix
```
Railway Dashboard
├─ Backend Service
│  ├─ Status: Running ✅
│  ├─ Root Directory: ./apps/api
│  ├─ Build Command: npm run build
│  ├─ Start Command: npx prisma migrate deploy... && node ./dist/src/main.js
│  ├─ Variables:
│  │  ├─ DATABASE_URL=postgresql://... ✅ (auto-injected)
│  │  ├─ NODE_ENV=production
│  │  ├─ JWT_ACCESS_SECRET=...
│  │  ├─ JWT_REFRESH_SECRET=...
│  │  └─ CORS_ORIGINS=https://your-frontend.vercel.app
│  └─ Logs: 🚀 API running on port 4000 (production)
└─ Postgres Service
   ├─ Status: Running ✅
   └─ Connected to: Backend Service ✅
```

---

## Verification Success Criteria

**Backend deployment is FIXED when:**

1. ✅ Backend service status = **Running** (green)
2. ✅ `curl /health` returns 200 with valid JSON
3. ✅ Logs show: `🚀 API running on port 4000 (production)`
4. ✅ DATABASE_URL is in Variables tab and is NOT empty
5. ✅ All required env vars are set
6. ✅ No errors in recent logs
7. ✅ Frontend can reach backend and login works

**If ALL above are true:** Deployment is successful ✅

---

## Next Steps After Successful Deployment

1. Update frontend CORS settings if backend URL changed
2. Run end-to-end tests (login, browse, checkout if applicable)
3. Monitor logs for 24 hours for any issues
4. Set up log alerts (optional, in Railway settings)
5. Document the deployment for future reference

---

## Links & Resources

- [Railway Dashboard](https://railway.app)
- [Railway Docs](https://docs.railway.app)
- [Railway PostgreSQL Docs](https://docs.railway.app/databases/postgresql)
- [Railway Environment Variables](https://docs.railway.app/guides/variables)
- [Railway Deployments](https://docs.railway.app/guides/deployments)
