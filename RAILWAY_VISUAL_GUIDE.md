# Railway Backend Configuration — Visual Step-by-Step Guide

## Before You Start

✅ You have:
- Railway account with billing
- GitHub repo connected to Railway
- PostgreSQL service exists in Railway
- Backend service exists in Railway
- Frontend (Vercel) already deployed

---

## STEP 1: Navigate to Backend Service

**In Railway Dashboard:**

```
Projects
  └─ Your Project
     ├─ PostgreSQL (database)
     └─ Backend ← CLICK HERE
```

**After clicking Backend service, you should see:**
```
┌─ Backend Service ─────────────────────────────────────────┐
│                                                             │
│  Status: [Crashed] or [Running]                           │
│                                                             │
│  Tabs: Dashboard | Settings | Variables | Deployments     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## STEP 2: Go to Settings Tab

```
Backend Service
  └─ Settings ← CLICK HERE
```

**In Settings, find these sections:**

### Section 1: Root Directory
```
┌──────────────────────────────────────────┐
│ Root Directory                           │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ ./apps/api                           │ │  ← ENTER THIS
│ └──────────────────────────────────────┘ │
│                                          │
│ ℹ️  Must be relative path, not absolute  │
└──────────────────────────────────────────┘
```

### Section 2: Build Command
```
┌──────────────────────────────────────────┐
│ Build Command                            │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ npm run build                        │ │  ← ENTER THIS
│ └──────────────────────────────────────┘ │
│                                          │
│ ℹ️  This runs from /apps/api package.json│
└──────────────────────────────────────────┘
```

### Section 3: Start Command
```
┌──────────────────────────────────────────────────────────────┐
│ Start Command                                                │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ npx prisma migrate deploy --schema=./prisma/schema...   │ │
│ │ && node ./dist/src/main.js                              │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ℹ️  Paths relative to ./apps/api (service root)             │
│ ℹ️  '&&' means only start server if migrations succeed      │
└──────────────────────────────────────────────────────────────┘
```

**After entering all three, scroll down and click "Save Changes"**

---

## STEP 3: Go to Variables Tab

```
Backend Service
  └─ Variables ← CLICK HERE
```

**You should see:**
```
┌─ Variables ──────────────────────────────────────────────┐
│                                                          │
│ DATABASE_URL    | postgresql://... ✓ AUTO-INJECTED     │
│                 |                                        │
│ [Add Variable]  [+ Add]                                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Check DATABASE_URL:**
- ✅ It should exist (auto-injected by Postgres connection)
- ✅ It should start with `postgresql://`
- ✅ It should end with `?sslmode=require`
- ❌ If empty or missing: Postgres not connected (see STEP 4)

**Add Required Variables:**

Click **[+ Add]** and add each:

### Variable 1: NODE_ENV
```
Name:  NODE_ENV
Value: production

[Save]
```

### Variable 2: JWT_ACCESS_SECRET
```
Name:  JWT_ACCESS_SECRET
Value: [GENERATE RANDOM: 32+ characters]

Example: xK9mL2pQ5vR8sT1uW4yZ7aB3cD6eF9gH2jK

[Save]
```

### Variable 3: JWT_REFRESH_SECRET
```
Name:  JWT_REFRESH_SECRET
Value: [GENERATE DIFFERENT RANDOM: 32+ characters]

Example: aBc3dEf6gHi9jKl2mNo5pQr8sTu1vWx4yZ

[Save]
```

### Variable 4: CORS_ORIGINS
```
Name:  CORS_ORIGINS
Value: https://your-frontend-domain.vercel.app

Example: https://distropro.vercel.app

[Save]
```

**Result:**
```
┌─ Variables ──────────────────────────────────────────────┐
│                                                          │
│ DATABASE_URL        | postgresql://... ✓                │
│ NODE_ENV            | production       ✓                │
│ JWT_ACCESS_SECRET   | xK9mL2pQ...     ✓                │
│ JWT_REFRESH_SECRET  | aBc3dEf6...     ✓                │
│ CORS_ORIGINS        | https://distro... ✓              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## STEP 4: Connect PostgreSQL Service

**If DATABASE_URL is missing or empty in Variables:**

### Option A: From Postgres Service Side
```
Projects
  └─ Your Project
     ├─ PostgreSQL ← CLICK HERE
     │   └─ Look for "Connected Services" section
     │       └─ Click "Connect Service"
     │           └─ Select "Backend"
     │
     └─ Backend
```

### Option B: From Backend Service Side
```
Backend Service
  └─ Settings (scroll down)
     └─ Look for "Add Plugin" or "Database" section
        └─ Select "PostgreSQL"
        └─ Railway connects them
```

**After connecting:**
```
Backend Service → Variables

DATABASE_URL | postgresql://postgres:PASSWORD@HOST:PORT/railway?sslmode=require
            ↑
        Should appear here automatically
```

---

## STEP 5: Redeploy Backend

```
Backend Service
  └─ Deployments ← CLICK HERE
     └─ Look for a blue "Redeploy" button at the top
        └─ CLICK "Redeploy"
```

**Deployment starts:**
```
┌─ Deployments ────────────────────────────────────────────┐
│                                                          │
│ • Deployment #47  [Building] ← Currently deploying     │
│   Started: just now                                      │
│   Status: In Progress...                                │
│                                                          │
│ • Deployment #46  [Failed]                              │
│ • Deployment #45  [Failed]                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## STEP 6: Monitor Build (Click Active Deployment)

```
Deployments
  └─ • Deployment #47 [Building] ← CLICK THIS
     └─ Build tab ← CLICK HERE
```

**Watch for:**
```
Build Log:

✓ npm ci
✓ npx prisma generate
✓ npm run build

[Build succeeded in 3 minutes 45 seconds]
```

❌ If build fails:
- Check error message
- Most common: Root Directory is wrong
- Fix it, redeploy

---

## STEP 7: Monitor Deploy (In Same Deployment)

```
Deployment #47
  └─ Deploy tab ← CLICK HERE
```

**Watch for:**
```
Deploy Log:

> npx prisma migrate deploy --schema=./prisma/schema.prisma
[migrationCreated] Initial
[completed] 1 migration executed

> node ./dist/src/main.js
🚀 API running on port 4000 (production)

[Service successfully started]
```

❌ If deploy fails:
- Most common: DATABASE_URL empty
- Check Variables tab
- Verify Postgres connection
- Redeploy

---

## STEP 8: Verify It Works

**Get your backend URL:**
```
Backend Service → Dashboard (top right)

Look for: "Public URL" or similar
Example: https://backend-production-7x8x.railway.app
```

**Test health endpoint:**
```bash
curl https://backend-production-7x8x.railway.app/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "api",
  "timestamp": "2024-05-26T10:30:00.000Z"
}
```

✅ If you see this: Backend is working!

---

## STEP 9: Test Frontend Integration

1. Go to frontend (Vercel)
2. Try to login
3. Check browser console for errors
4. If CORS error: update CORS_ORIGINS variable

---

## Visual Checklist

```
┌─ Railway Dashboard ───────────────────────────────────────┐
│                                                           │
│ Backend Service Status ──────────────────────────────────│
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Status: [⚫ Running] ← Should be GREEN              │ │
│ │                                                     │ │
│ │ Settings:                                           │ │
│ │ ├─ Root Directory: ./apps/api ✓                   │ │
│ │ ├─ Build Command: npm run build ✓                │ │
│ │ ├─ Start Command: npx prisma... && node... ✓    │ │
│ │                                                     │ │
│ │ Variables:                                          │ │
│ │ ├─ DATABASE_URL: postgresql://... ✓              │ │
│ │ ├─ NODE_ENV: production ✓                        │ │
│ │ ├─ JWT_ACCESS_SECRET: ••••• ✓                   │ │
│ │ ├─ JWT_REFRESH_SECRET: ••••• ✓                 │ │
│ │ └─ CORS_ORIGINS: https://... ✓                  │ │
│ │                                                     │ │
│ │ Latest Deployment:                                 │ │
│ │ ├─ Status: [✓ Completed]                          │ │
│ │ ├─ Build: [✓ Success]                             │ │
│ │ └─ Logs: 🚀 API running on port 4000 ✓          │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ PostgreSQL Service Status ────────────────────────────────│
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Status: [⚫ Running] ✓                              │ │
│ │ Connected to: Backend ✓                            │ │
│ │ Provides: DATABASE_URL ✓                           │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Quick Reference Table

| Item | Value | Status |
|------|-------|--------|
| Root Directory | `./apps/api` | ✓ |
| Build Command | `npm run build` | ✓ |
| Start Command | `npx prisma migrate deploy --schema=./prisma/schema.prisma && node ./dist/src/main.js` | ✓ |
| DATABASE_URL | auto-injected | ✓ |
| NODE_ENV | `production` | ✓ |
| JWT_ACCESS_SECRET | 32+ chars random | ✓ |
| JWT_REFRESH_SECRET | 32+ chars random | ✓ |
| CORS_ORIGINS | your-frontend.vercel.app | ✓ |
| Postgres Connection | Connected | ✓ |
| Deployment Status | Completed | ✓ |
| Service Status | Running | ✓ |
| Health Endpoint | 200 OK | ✓ |

---

## If Anything Goes Wrong

```
❌ Problem                      ✓ Solution
─────────────────────────────  ─────────────────────────────
Build failed                    Check Root Directory = ./apps/api
Deploy failed                   Check DATABASE_URL in Variables
DATABASE_URL empty              Connect Postgres to Backend service
Frontend CORS error             Update CORS_ORIGINS with frontend URL
Service crashes on startup      Check logs for specific error
```

---

## Success! 🎉

**When you see all of this:**
- Backend status: Running (green)
- Latest deployment: Completed (green)
- Logs show: "🚀 API running on port 4000"
- Health check: 200 OK response
- Frontend login: Works without CORS errors

**Congratulations!** Your Railway backend is deployed and working ✨

---

**Need help?** → See [RAILWAY_TROUBLESHOOTING.md](RAILWAY_TROUBLESHOOTING.md)

**Want detailed explanation?** → See [RAILWAY_DEPLOYMENT_GUIDE.md](RAILWAY_DEPLOYMENT_GUIDE.md)

**Quick overview?** → See [RAILWAY_QUICK_REFERENCE.md](RAILWAY_QUICK_REFERENCE.md)
