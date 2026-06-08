# Railway Backend Deployment — Quick Reference Card

## 🎯 The Problem
```
Backend on Railway fails with: "DATABASE_URL is required and cannot be empty"
Frontend (Vercel) works ✅
Backend (Railway) crashes ❌
```

## 🔧 The Solution

### Step 1: Create PostgreSQL Service (5 min)
```
Railway Dashboard
├─ New → Database → Postgres
├─ Wait for database to start
└─ DATABASE_URL auto-generated ✓
```

### Step 2: Add Backend Service (2 min)
```
Railway Dashboard
├─ New → GitHub Repo
├─ Select your monorepo repository
└─ Backend service created ✓
```

### Step 3: Configure Backend Settings (3 min)

| Setting | Value |
|---------|-------|
| **Root Directory** | `./apps/api` |
| **Build Command** | `npm run build` |
| **Start Command** | `npx prisma migrate deploy --schema=./prisma/schema.prisma && node ./dist/src/main.js` |

### Step 4: Connect Postgres to Backend (1 min)
```
Postgres Service → "Connected Services" or "Add Plugin"
└─ Connect to Backend service ✓
```

**Result:** `DATABASE_URL` automatically injected into Backend environment

### Step 5: Add Environment Variables (2 min)

```
Backend Service → Variables

DATABASE_URL        (auto-injected by Postgres, do not modify)
NODE_ENV           production
JWT_ACCESS_SECRET  (random, 32+ chars)
JWT_REFRESH_SECRET (random, 32+ chars, different from access)
CORS_ORIGINS       https://your-frontend.vercel.app
```

### Step 6: Deploy (3-5 min)
```
Backend Service → Redeploy
├─ Monitor Build tab → should succeed
├─ Monitor Deploy tab → should show "🚀 API running..."
└─ Status: Running ✓
```

### Step 7: Verify (1 min)
```bash
# Test health endpoint
curl https://your-backend-url.railway.app/health

# Expected response
{
  "status": "ok",
  "service": "api",
  "timestamp": "2024-05-26T..."
}
```

## ⚡ Critical Requirements

| Item | Value | Why |
|------|-------|-----|
| **Root Directory** | `./apps/api` | Monorepo structure; tells Railway where backend code is |
| **Build Command** | `npm run build` | Runs NestJS build (nest build); outputs to dist/ |
| **Start Command** | `...migrate deploy... && node ./dist/src/main.js` | Runs migrations then starts server |
| **Prisma Path** | `./prisma/schema.prisma` | Relative to service root (./apps/api) |
| **Listen Address** | `0.0.0.0` | Railway requirement (not localhost) |
| **DATABASE_URL** | Auto-injected | Don't add manually; connect services instead |
| **NODE_ENV** | `production` | Disables Swagger, enables optimizations |

## ✅ Success Checklist

- [ ] Backend service status = **Running** (green)
- [ ] Latest deployment = **Completed** (green)
- [ ] Logs show: `🚀 API running on port 4000 (production)`
- [ ] `/health` endpoint returns 200 OK
- [ ] DATABASE_URL in Variables tab is NOT empty
- [ ] All required env vars are set
- [ ] Frontend can reach backend API
- [ ] Frontend login works

**If ALL above are checked:** You're done! ✅

## ❌ Troubleshooting

### "DATABASE_URL is required"
```
1. Backend service → Variables
2. Look for DATABASE_URL variable
3. If missing: Postgres not connected
   - Go to Postgres service
   - Find "Connected Services"
   - Verify Backend is listed
   - If not: Click "Connect Service" → select Backend
4. Redeploy Backend
```

### "Cannot find module" or build fails
```
1. Verify Root Directory = ./apps/api
2. Verify Build Command = npm run build
3. Verify Start Command uses ./prisma/schema.prisma (not ./apps/api/prisma/...)
4. Redeploy
```

### Frontend gets CORS error
```
1. Backend service → Variables
2. Update CORS_ORIGINS to include your Vercel frontend URL
   Example: https://distropro.vercel.app
3. Redeploy Backend
4. Clear frontend cache and retry
```

### Service crashes immediately
```
1. Check Backend service → Logs tab
2. Look for error message
3. Most common: DATABASE_URL empty or Prisma issue
4. Fix according to the error, redeploy
```

## 📊 File Reference

| File | Purpose |
|------|---------|
| [RAILWAY_DEPLOYMENT_GUIDE.md](RAILWAY_DEPLOYMENT_GUIDE.md) | Complete step-by-step setup guide |
| [RAILWAY_CONFIG_CHECKLIST.md](RAILWAY_CONFIG_CHECKLIST.md) | Detailed checklist for every setting |
| [RAILWAY_TROUBLESHOOTING.md](RAILWAY_TROUBLESHOOTING.md) | Troubleshooting guide for common issues |
| [validate-railway-setup.js](validate-railway-setup.js) | Local validation script |

## 🔗 Useful Links

- [Railway Dashboard](https://railway.app)
- [Railway Docs](https://docs.railway.app)
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)

## 📋 File Paths (for reference)

```
distro-platform/
├── apps/api/                           ← Backend service root
│   ├── package.json                    ← Build/start scripts defined here
│   ├── src/main.ts                     ← NestJS entry point
│   ├── prisma/schema.prisma            ← Database schema
│   ├── Dockerfile                      ← (Optional; using build/start instead)
│   └── dist/                           ← Compiled output (after build)
├── package.json                        ← Root workspace config
├── turbo.json                          ← Turbo build config
└── packages/shared-types/              ← Shared types package
```

## 🚀 Summary

1. ✅ Create Postgres service
2. ✅ Create Backend service from GitHub
3. ✅ Set Root Directory to `./apps/api`
4. ✅ Set Build Command to `npm run build`
5. ✅ Set Start Command (see above)
6. ✅ Connect Postgres to Backend
7. ✅ Add environment variables
8. ✅ Redeploy and verify
9. ✅ Test endpoints
10. ✅ Verify frontend integration

**Total time:** ~15-20 minutes

**Result:** Backend running on Railway with PostgreSQL database ✨

---

**Need detailed help?** → See [RAILWAY_DEPLOYMENT_GUIDE.md](RAILWAY_DEPLOYMENT_GUIDE.md)

**Having issues?** → See [RAILWAY_TROUBLESHOOTING.md](RAILWAY_TROUBLESHOOTING.md)

**Want to validate locally?** → Run: `node validate-railway-setup.js`
