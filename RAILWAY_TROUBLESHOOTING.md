# Railway Backend Troubleshooting Guide

## Quick Diagnosis

### Problem: "DATABASE_URL is required and cannot be empty"

**When you see this:** Backend logs show this error, service crashes on startup

**Root causes (in order of likelihood):**
1. PostgreSQL service not connected to Backend service
2. DATABASE_URL variable is empty or malformed
3. Backend service restarted before Postgres was ready (race condition)

**Quick Fix:**
```
1. Open Railway dashboard
2. Click Postgres service → look for "Connected Services"
3. Verify Backend is listed there
4. If not listed: Click "Connect Service" → select Backend
5. Go to Backend service → Redeploy
```

---

## Issue: Build Fails

### "Cannot find module '@distro/shared-types'"

**Cause:** Monorepo workspace dependencies not installed

**Fix:**
1. Backend service → Settings
2. Verify **Root Directory** = `./apps/api`
3. Verify **Build Command** = `npm run build` (uses root npm install)
4. Redeploy

**Why this works:**
- Root `npm install` installs all workspace packages
- When build runs from `./apps/api`, it can resolve `@distro/shared-types`

---

### "Command failed: nest build" or "Cannot find module"

**Cause:** TypeScript compilation error in source code

**Fix:**
1. Run locally: `npm run build --workspace=apps/api`
2. Fix TypeScript errors
3. Commit and push to GitHub
4. Railway auto-redeploys

---

### Build takes >10 minutes

**Cause:** Npm cache issue or network problem

**Fix:**
1. Backend service → Settings
2. Scroll down to **Build Settings**
3. Click "Clear Build Cache"
4. Redeploy (will do full rebuild)

---

### Build succeeds but Deploy fails

**Cause:** Environment or runtime issue

**Fix:**
1. Check Backend service → Variables tab
2. Verify all required env vars are present
3. See "Issue: Deploy Fails" section below

---

## Issue: Deploy Fails

### "Prisma migrate failed" or "Cannot find schema"

**Error message typically shows:**
```
Error: Prisma schema file not found at /app/apps/api/prisma/schema.prisma
```

**Cause:** Start Command has incorrect schema path

**Current Setting (wrong):**
```
node ./apps/api/dist/src/main.js
```

**Correct Setting:**
```
npx prisma migrate deploy --schema=./prisma/schema.prisma && node ./dist/src/main.js
```

**Why:**
- Service root is `./apps/api` (set in Root Directory)
- Paths are relative to service root
- So `./prisma/schema.prisma` = `/app/apps/api/prisma/schema.prisma`

---

### "Error: connect ECONNREFUSED 127.0.0.1:5432"

**Cause:** Backend cannot reach PostgreSQL database

**Root causes:**
- DATABASE_URL is pointing to localhost (not Railway Postgres)
- PostgreSQL service not connected to Backend
- PostgreSQL service is down

**Fix:**
1. Check Backend service → Variables
2. Look at DATABASE_URL value
3. Should start with `postgresql://` and have a remote host
4. Should NOT contain `localhost` or `127.0.0.1`
5. If wrong, go to Postgres service and reconnect to Backend

---

### "JwtStrategy requires a secret or key"

**Cause:** The Passport JWT strategy needs `JWT_ACCESS_SECRET` at startup.

**What this means:**
- The app is starting, but auth config is missing a required secret
- `JWT_ACCESS_SECRET` is needed for `JwtStrategy`
- `JWT_REFRESH_SECRET` is also required for refresh token generation

**Fix:**
1. Go to Backend service → Variables
2. Add or verify:
   - `JWT_ACCESS_SECRET` = a random 32+ character secret
   - `JWT_REFRESH_SECRET` = a random 32+ character secret
3. Redeploy backend

> Note: This is a runtime environment issue, not a build issue.

---

### "getaddrinfo ENOTFOUND postgres.railway.internal"

**Cause:** Railway internal DNS resolution failing (rare)

**Fix:**
1. Restart the Backend service:
   - Backend service → Deployments → click "Redeploy"
   - This triggers a fresh start with DNS resolution
2. If still fails, restart Postgres service too
3. Contact Railway support if persists

---

### Service crashes immediately after deploying

**Check logs:**
```
Backend service → Logs tab (or bottom of Dashboard)
Look for error messages in the last 10 lines
```

**Common causes:**
- DATABASE_URL empty/missing → See "DATABASE_URL is required" fix
- PORT already in use → Unusual on Railway, but see below
- Memory limit exceeded → Increase in Settings → Resources (if available)
- Unhandled promise rejection → Check logs, fix code

**Fix for PORT issue:**
1. Backend service → Variables
2. Remove or change `API_PORT`
3. Let Railway's `$PORT` env var take precedence
4. Start command automatically uses this

---

## Issue: Service Running but API Not Responding

### "Service Running but 502 Bad Gateway"

**Cause:** Server started but immediately crashed, or not listening on correct port

**Check logs:**
```
Backend service → Logs tab
Scroll to bottom to see latest entries
Look for crash or error messages
```

**Common errors:**
- `EADDRINUSE` = port already in use
- `MODULE_NOT_FOUND` = dependency issue
- `ENOMEM` = out of memory

**Fix:**
1. Check Build and Start Commands are correct
2. Verify Root Directory is `./apps/api`
3. Check all env vars are set
4. Redeploy

---

### "Timeout connecting to API"

**Cause:** Server listening but very slow to start

**Reasons:**
- Database migrations taking a long time
- First-time Prisma client generation
- Low Railway memory allocation

**Fix:**
1. Wait 3-5 minutes (migrations can be slow first time)
2. Check logs: Backend service → Logs tab
3. Look for "prisma migrate deploy" progress
4. If stuck, check if database is accessible
5. Redeploy

---

### "Cannot read property 'get' of undefined" (app.get is not a function)

**Cause:** NestJS app not initialized properly

**This shouldn't happen if:**
- NODE_ENV is set to `production`
- main.ts bootstrap() runs successfully
- All modules load without error

**Fix:**
1. Check local build: `npm run build --workspace=apps/api`
2. Check for TypeScript errors
3. Verify main.ts is correct
4. Commit, push, redeploy

---

## Issue: Database Connection Works but Queries Fail

### "Prisma error: P1001"

**Full error:** `Can't reach database server at 'host:port'`

**Cause:** DATABASE_URL correct format but host/port unreachable

**Fix:**
1. Verify DATABASE_URL format: `postgresql://user:pass@host:port/db?sslmode=require`
2. Verify host and port are correct
3. Check if Postgres service is Running (green status)
4. Try re-connecting services:
   - Postgres service → Settings
   - Click disconnect from Backend
   - Click connect to Backend again
5. Redeploy Backend

---

### "Prisma error: P2024"

**Full error:** `Timed out fetching a new connection from the connection pool`

**Cause:** Too many database connections, pool exhausted

**Fix:**
1. Backend service → Settings → look for "Instances" or resource limit
2. Limit concurrent connections (default usually fine)
3. Or increase Postgres connection limit in Postgres settings
4. Restart both services

---

### "Prisma error: P3008"

**Full error:** `The production database is not empty`

**Cause:** Trying to run `migrate dev` instead of `migrate deploy`

**Our Start Command uses `migrate deploy` which is correct.**

**If you see this error:**
1. Check Start Command doesn't include `migrate dev`
2. Verify it says: `npx prisma migrate deploy --schema=./prisma/schema.prisma`
3. Redeploy

---

## Issue: CORS Errors

### Frontend gets "CORS error" or "Blocked by CORS policy"

**Error in browser console:**
```
Access to XMLHttpRequest at 'https://backend-...' from origin 'https://frontend-...'
has been blocked by CORS policy
```

**Cause:** Backend CORS_ORIGINS doesn't include frontend URL

**Fix:**
1. Get frontend URL: Go to Vercel, copy production URL
   - Looks like: `https://distropro.vercel.app`
2. Backend service → Variables tab
3. Update `CORS_ORIGINS` variable:
   - Single frontend: `https://distropro.vercel.app`
   - Multiple: `https://distropro.vercel.app,https://admin.distropro.vercel.app`
4. Make sure to include `https://` (not just domain)
5. Redeploy Backend

**Test after fix:**
1. Go to frontend
2. Open browser DevTools → Network tab
3. Try to call API
4. Verify request goes through (no CORS error)

---

### Frontend gets 401 after login

**This is NOT a CORS error, but related.**

**Cause:** JWT tokens not matching between frontend and backend

**Fix:**
1. Backend service → Variables
2. Verify `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` exist and have values
3. Make sure they're different from each other
4. Make sure they're 32+ characters long
5. Redeploy Backend
6. Clear frontend cookies/local storage
7. Try login again

---

## Issue: Logs Not Showing

### "Backend service → Logs tab is empty"

**Cause:** Logs are clearing faster than expected, or service never started

**Fix:**
1. Go to Backend service → Deployments tab
2. Click the most recent deployment
3. Click "Deploy" tab
4. Scroll through the full deploy log
5. Look for errors or issues

---

### "I see 'Starting application' but then nothing"

**Cause:** Application hanging during startup

**Common causes:**
- Waiting for DATABASE_URL check
- Migrations running (can take 1-2 minutes first time)
- App stuck on some initialization

**What to check:**
1. Let it run for 5 minutes
2. Check if DATABASE_URL is set (go to Variables tab)
3. Check Postgres service status (should be Running)
4. If still stuck, redeploy

---

## Local Validation

### Before Deploying to Railway, Test Locally

**Step 1: Set up local environment**
```bash
cd apps/api

# Create .env.local (or use .env)
echo 'DATABASE_URL=postgresql://user:pass@localhost:5432/distro_platform' > .env.local
echo 'NODE_ENV=development' >> .env.local
echo 'JWT_ACCESS_SECRET=test-secret-32-chars-or-more!!' >> .env.local
echo 'JWT_REFRESH_SECRET=test-secret-32-chars-or-more!!' >> .env.local
echo 'CORS_ORIGINS=http://localhost:3000' >> .env.local
```

**Step 2: Set up local database**
```bash
# Option A: Use Docker Compose from root
cd ../..
docker-compose up -d postgres

# Wait 10 seconds for database to be ready
sleep 10

cd apps/api
```

**Step 3: Run migrations**
```bash
npx prisma migrate deploy
```

**Step 4: Build the project**
```bash
npm run build
```

**Step 5: Start the server**
```bash
npm run start
```

**Step 6: Test endpoints**
```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/v1/health
```

**Expected responses:**
- Both should return 200 OK with JSON
- No errors about DATABASE_URL

**If anything fails locally:**
- Fix the issue locally first
- Then deploy to Railway (same issue likely exists there)

---

## Debug Mode

### Enable Verbose Logging

**Temporarily (testing only):**
1. Backend service → Variables
2. Add: `DEBUG=*` (enables all debug logs)
3. Redeploy
4. Watch logs to see detailed output
5. Remove `DEBUG=*` after debugging

---

### SSH into Railway Container (Advanced)

Railway doesn't provide direct SSH, but you can:

1. View logs in real-time: Backend service → Logs
2. Check recent environment: Backend service → Variables
3. View build logs: Deployments → click deployment → Build tab

**For deeper debugging:**
- Add console.log statements to code
- Redeploy
- Check logs again

---

## Recovery Steps

### If Service is Stuck in Error Loop

**Step 1: Stop auto-deploy**
1. Backend service → Settings
2. Find "Disable auto-deploy on push" (or similar)
3. Toggle it ON to pause deployments

**Step 2: Fix the issue**
1. Identify the problem using troubleshooting above
2. Fix in code or Railway settings
3. Commit and push

**Step 3: Re-enable and redeploy**
1. Backend service → Settings
2. Toggle "Disable auto-deploy" OFF
3. Click Redeploy button

**Step 4: Monitor**
1. Watch Deployments tab
2. Check logs as it starts
3. Verify service goes to Running status

---

## When to Contact Railway Support

Contact Railway support if you encounter:
- Service crashes with no clear error message
- Database connection errors persist after checking all settings
- Deployment fails at Railway infrastructure level (not code)
- Resource limit issues (out of memory, disk full, etc.)
- Network issues preventing connection to database

**When contacting support, include:**
- Project ID and service name
- Most recent deployment ID
- Full error message from logs
- Steps you've already tried

**Railway Support:** [https://railway.app/support](https://railway.app/support)

---

## Common Configuration Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Root Directory = `/` or empty | "Cannot find package.json in /app/apps/api" | Set to `./apps/api` |
| Build Command = `npm run dev` | Build hangs forever | Use `npm run build` |
| Start Command = `npm run dev` | Service crashes (dev mode not for prod) | Use `node ./dist/src/main.js` |
| Start Command = `node ./apps/api/dist/src/main.js` | Path not found (from root, not service root) | Use `node ./dist/src/main.js` |
| Prisma path = `./apps/api/prisma/schema.prisma` | Schema not found | Use `./prisma/schema.prisma` |
| DATABASE_URL manually set | Conflicts with Postgres connection | Delete it, let Railway auto-inject |
| CORS_ORIGINS = `*` in production | Security issue | Set to specific frontend domain |
| JWT_SECRET too short | JWT failures | Use 32+ character random string |
| NODE_ENV = `development` in production | Swagger docs exposed, logging verbose | Set to `production` |

---

## Success Indicators

**If you see these, deployment is working:**

✅ Backend service status: **Running** (green)
✅ Latest deployment: **Completed** (green)
✅ Logs show: `🚀 API running on port 4000 (production)`
✅ `/health` endpoint returns 200 OK
✅ No error logs in last hour
✅ Frontend can reach and login to backend

**If you don't see these, something is wrong — use this guide to debug.**

---

## Quick Reference

```bash
# View all variables
Backend service → Variables tab

# View logs
Backend service → Logs tab (or Dashboard bottom)

# Check build output
Backend service → Deployments → active deployment → Build tab

# Check deploy output
Backend service → Deployments → active deployment → Deploy tab

# Force redeploy
Backend service → Deployments → Redeploy button

# Change build command
Backend service → Settings → Build Command

# Change start command
Backend service → Settings → Start Command

# Reconnect database
Postgres service → look for "Connected Services" section
or
Backend service → Settings → find Plugins/Database connection
```

---

## Next Steps After Fixing

1. ✅ Verify backend is running smoothly
2. ✅ Test frontend login flow end-to-end
3. ✅ Monitor logs for 24 hours
4. ✅ Set up any additional services (Redis, S3, etc.) if needed
5. ✅ Document the final configuration
6. ✅ Create a runbook for future deployments

---

**Still stuck?** Go back to [RAILWAY_DEPLOYMENT_GUIDE.md](RAILWAY_DEPLOYMENT_GUIDE.md) and carefully follow each step.
