# 🚀 START HERE — Railway Backend Deployment

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend (Vercel) | ✅ Working | Already deployed |
| Backend (Railway) | ❌ Failed | `DATABASE_URL` error |
| Database (PostgreSQL) | ⏸️ Exists | Not connected to backend |

## The Fix (3 Steps)

### Step 1: Connect Services in Railway (2 minutes)
```
1. Go to railway.app dashboard
2. Click your project
3. Click PostgreSQL service
4. Look for "Connected Services" section
5. Click "Connect Service" or "Add Plugin"
6. Select Backend service
7. ✅ DATABASE_URL now automatically injected
```

### Step 2: Configure Backend Service (5 minutes)
```
Backend Service → Settings

Root Directory:   ./apps/api
Build Command:    npm run build
Start Command:    npx prisma migrate deploy --schema=./prisma/schema.prisma && node ./dist/src/main.js
```

### Step 3: Add Environment Variables (3 minutes)
```
Backend Service → Variables

NODE_ENV           = production
JWT_ACCESS_SECRET  = (generate random string, 32+ chars)
JWT_REFRESH_SECRET = (generate random string, 32+ chars)
CORS_ORIGINS       = https://your-vercel-domain.vercel.app
```

**That's it!** → Redeploy backend → ✅ Should work

---

## Verification (Test It)

After redeploy succeeds:

```bash
# 1. Get your backend URL from Railway dashboard
# 2. Test health endpoint
curl https://your-backend-url.railway.app/health

# Expected response:
# {
#   "status": "ok",
#   "service": "api",
#   "timestamp": "2024-05-26T..."
# }

# 3. Try login from frontend
# Should work without CORS errors
```

---

## If Something Goes Wrong

### "DATABASE_URL is required" error still appears
If you see this error during startup, Railway is not injecting the PostgreSQL connection string into the backend runtime.

```
1. Reload Railway dashboard
2. Go to Backend service → Variables
3. Confirm `DATABASE_URL` exists and is not empty
4. If `DATABASE_URL` is missing or empty:
   - Go to Postgres service
   - Open "Connected Services"
   - Connect the Backend service to Postgres
5. If `DATABASE_URL` is present:
   - Ensure it is a Railway Postgres URL (postgresql://... ?sslmode=require)
   - Redeploy backend
```

> Note: This value must be injected by the connected Railway Postgres service. Do not rely on local `.env` values for Railway runtime.

### "JwtStrategy requires a secret or key" error
If the backend begins startup but then fails with `JwtStrategy requires a secret or key`, the JWT secret is missing from Railway runtime env vars.

```
1. Go to Backend service → Variables
2. Confirm `JWT_ACCESS_SECRET` exists and is not empty
3. Confirm `JWT_REFRESH_SECRET` exists and is not empty
4. Set both to strong random strings (32+ characters)
5. Redeploy backend
```

> Note: `JWT_ACCESS_SECRET` is required at application startup for Passport JWT strategy.

### "Cannot find module" or build fails
```
1. Backend → Settings
2. Verify Root Directory = ./apps/api (with ./)
3. Verify Build Command = npm run build
4. Redeploy
```

### Frontend gets CORS error
```
1. Backend → Variables
2. Find CORS_ORIGINS
3. Make sure it includes your Vercel frontend URL
   Example: https://distropro.vercel.app
4. Redeploy backend
5. Clear frontend browser cache
```

---

## Documentation Available

| Document | Purpose | Time |
|----------|---------|------|
| [RAILWAY_QUICK_REFERENCE.md](RAILWAY_QUICK_REFERENCE.md) | Quick overview | 5 min |
| [RAILWAY_DEPLOYMENT_GUIDE.md](RAILWAY_DEPLOYMENT_GUIDE.md) | Detailed step-by-step | 20 min |
| [RAILWAY_CONFIG_CHECKLIST.md](RAILWAY_CONFIG_CHECKLIST.md) | Verification checklist | 30 min |
| [RAILWAY_TROUBLESHOOTING.md](RAILWAY_TROUBLESHOOTING.md) | Problem solving | 10-30 min |
| [validate-railway-setup.js](validate-railway-setup.js) | Local validation | 2 min |

## Success Checklist

After deployment:
- [ ] Backend service shows "Running" (green)
- [ ] Deployment logs show "🚀 API running on port 4000"
- [ ] Health endpoint returns 200 OK
- [ ] DATABASE_URL is in Variables and not empty
- [ ] Frontend login works

**All checked?** → Deployment successful! ✅

---

## Why This Works

**The Problem:**
- Postgres exists but wasn't connected to backend
- Backend couldn't access DATABASE_URL
- Service crashed on startup

**The Solution:**
- Connect services → Railway auto-injects DATABASE_URL
- Configure paths for monorepo (Root Directory = ./apps/api)
- Set build/start commands for NestJS
- Deploy → works! ✅

---

## Next: Run Local Validation (Optional)

```bash
# Check if everything is configured correctly locally
node validate-railway-setup.js

# Output will show:
# ✓ All checks passed
# ⚠ Any warnings
# ✗ Any failures

# Fix any failures, then deploy with confidence
```

---

## Timeline

| Step | Duration | What You Do |
|------|----------|------------|
| 1. Connect services | 2 min | Click in Railway UI |
| 2. Configure backend | 5 min | Update 3 settings |
| 3. Add env vars | 3 min | Copy/paste variables |
| 4. Deploy | 5 min | Click redeploy, wait |
| 5. Verify | 2 min | Test endpoints |
| **Total** | **~17 min** | Backend running ✅ |

---

## Need More Help?

| Question | Answer |
|----------|--------|
| Where do I find Backend public URL? | Backend service → top right corner |
| What's DATABASE_URL format? | `postgresql://user:pass@host:port/db?sslmode=require` |
| Can I test locally? | Yes, run `node validate-railway-setup.js` |
| What if still doesn't work? | See RAILWAY_TROUBLESHOOTING.md |
| How do I update after fixing? | Commit → push → Railway auto-deploys |

---

## Critical Remember

✅ **DO:**
- Connect PostgreSQL to Backend in Railway UI
- Set Root Directory to `./apps/api`
- Set NODE_ENV to `production`
- Update CORS_ORIGINS with your frontend URL

❌ **DON'T:**
- Use old AWS/EC2/CloudFlare configs
- Manually add DATABASE_URL (let Railway inject it)
- Use `npm run dev` in production
- Leave Root Directory empty

---

## You're Ready! 🎉

**Next action:**
1. Open railway.app dashboard
2. Click PostgreSQL service
3. Connect to Backend service
4. Configure backend settings (above)
5. Redeploy
6. Verify with health check

**Estimated time to working backend: 15-20 minutes**

---

For detailed guidance: → [RAILWAY_DEPLOYMENT_GUIDE.md](RAILWAY_DEPLOYMENT_GUIDE.md)

For troubleshooting: → [RAILWAY_TROUBLESHOOTING.md](RAILWAY_TROUBLESHOOTING.md)

For checklist: → [RAILWAY_CONFIG_CHECKLIST.md](RAILWAY_CONFIG_CHECKLIST.md)

Good luck! 🚀
