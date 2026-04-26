# Railway Deployment - Complete Setup Guide
## Step-by-Step with Exact Environment Variables

---

## 📋 Your Situation
- ✅ GitHub repo connected to Railway
- ✅ Services detected
- ❓ Need to set environment variables

---

## STEP 1: See What Railway Created

### In Railway Dashboard:

1. Go to https://railway.app/dashboard
2. Click your project
3. You should see **3 services:**
   - ✅ `postgres` (PostgreSQL)
   - ✅ `api` (@distro/api)
   - ✅ `web` (@distro/web)

If you don't see them, click **"Add Service"** → **"GitHub"** → Select `distro-platform` repo

---

## STEP 2: PostgreSQL Setup (AUTOMATIC - No Action Needed)

Railway **automatically** creates PostgreSQL with these defaults:

```
Database: distro_platform
User: postgres
Password: (auto-generated)
Host: (auto-assigned)
```

✅ **You don't need to do anything!**

The `DATABASE_URL` is automatically created and injected.

---

## STEP 3: Set Environment Variables for API Service

### In Railway Dashboard:

1. Click **api** service
2. Go to **Variables** tab
3. Click **"New Variable"** and add these:

### Variables to Add:

```
KEY: JWT_ACCESS_SECRET
VALUE: change-me-access-secret-min-32-chars-long!@#123

KEY: JWT_ACCESS_EXPIRES_IN
VALUE: 15m

KEY: JWT_REFRESH_SECRET
VALUE: change-me-refresh-secret-min-32-chars-long!@#456

KEY: JWT_REFRESH_EXPIRES_IN
VALUE: 7d

KEY: API_PORT
VALUE: 4000

KEY: API_PREFIX
VALUE: api/v1

KEY: CORS_ORIGINS
VALUE: ${{ env.RAILWAY_PUBLIC_DOMAIN }}

KEY: CLOUDINARY_CLOUD_NAME
VALUE: your-cloudinary-name

KEY: CLOUDINARY_API_KEY
VALUE: your-api-key

KEY: CLOUDINARY_API_SECRET
VALUE: your-api-secret

KEY: NODE_ENV
VALUE: production
```

**Screenshot Guide:**
```
1. Click "New Variable" button
2. Enter KEY (e.g., JWT_ACCESS_SECRET)
3. Enter VALUE (e.g., change-me-access-secret-min-32-chars-long!@#123)
4. Click checkmark/save
5. Repeat for all variables
```

---

## STEP 4: Set Environment Variables for Web Service

### In Railway Dashboard:

1. Click **web** service
2. Go to **Variables** tab
3. Click **"New Variable"** and add these:

### Variables to Add:

```
KEY: NEXT_PUBLIC_API_URL
VALUE: ${{ env.api.RAILWAY_PRIVATE_DOMAIN }}/api/v1

KEY: NEXT_PUBLIC_SOCKET_URL
VALUE: ${{ env.api.RAILWAY_PRIVATE_DOMAIN }}

KEY: NODE_ENV
VALUE: production
```

---

## STEP 5: Deploy the Services

### In Railway Dashboard:

1. Go back to **project** view (see all 3 services)
2. Look for **"Deploy"** button or **"Apply Changes"** button
3. Click it
4. Wait for services to start (watch logs)

**Status indicators:**
- 🟢 Green = Running
- 🟡 Yellow = Starting
- 🔴 Red = Error

---

## STEP 6: Check Deployment Status

### Watch the logs:

1. Click **api** service
2. Go to **"Deploy"** tab
3. You should see build and deployment logs
4. Should end with something like:
   ```
   ✅ Successfully deployed
   🚀 Service is running
   ```

Repeat for **web** service.

---

## STEP 7: Get Your Public URLs

### For API Service:

1. Click **api** service
2. Look for **"Public Domain"** or **"Railway Domain"** (top right)
3. It looks like: `api-xxx.railway.app`
4. **Copy this!**

### For Web Service:

1. Click **web** service
2. Copy the **"Public Domain"** 
3. It looks like: `web-xxx.railway.app`
4. **Copy this!**

---

## STEP 8: Fix Web Service Variables with Real URLs

Now that you have the API URL, update the web variables:

### Update in Web Service Variables:

```
KEY: NEXT_PUBLIC_API_URL
VALUE: https://api-xxx.railway.app/api/v1

KEY: NEXT_PUBLIC_SOCKET_URL
VALUE: https://api-xxx.railway.app

KEY: NODE_ENV
VALUE: production
```

**Replace `api-xxx` with your actual API domain!**

---

## STEP 9: Redeploy Web Service

1. Click **web** service
2. Click **"Redeploy"** button (or the three dots menu)
3. Wait for it to redeploy with new variables

---

## ✅ TEST YOUR DEPLOYMENT

### Open in Browser:

```
https://web-xxx.railway.app
```

Should see:
- ✅ Login page loads
- ✅ No console errors
- ✅ Can click "Sign Up" button

### Test Login:

```
Email: owner@distro.com
Password: Password@123

Click Login
```

Should see:
- ✅ Dashboard loads
- ✅ Can see products
- ✅ Can navigate around

### Test API:

```
https://api-xxx.railway.app/api/docs
```

Should see:
- ✅ Swagger documentation
- ✅ All endpoints listed
- ✅ Can test endpoints

---

## 🐛 If Something Goes Wrong

### Check Logs:

1. Click **api** or **web** service
2. Go to **"Logs"** tab
3. Look for error messages
4. Common errors:

**Error: "Cannot connect to database"**
```
Solution: Database URL not injected
Action: Restart services in Railway
```

**Error: "Port already in use"**
```
Solution: Already running on this port
Action: Check if other service using port
```

**Error: "Environment variable not found"**
```
Solution: Misspelled variable name
Action: Check spelling (case-sensitive!)
```

### Restart Services:

1. Click service
2. Click menu (three dots)
3. Click **"Restart"**
4. Wait 1-2 minutes

### Redeploy from GitHub:

1. Click service
2. Click menu (three dots)
3. Click **"Redeploy"**
4. Wait for rebuild

---

## 📝 Environment Variables Explanation

| Variable | Where | What It Does |
|----------|-------|--------------|
| `JWT_ACCESS_SECRET` | API | Secret key for login tokens |
| `JWT_REFRESH_SECRET` | API | Secret key for refresh tokens |
| `DATABASE_URL` | API | Injected automatically (don't add!) |
| `NODE_ENV` | Both | Production vs development mode |
| `NEXT_PUBLIC_API_URL` | Web | Where web talks to API |
| `NEXT_PUBLIC_SOCKET_URL` | Web | WebSocket connection URL |

---

## 🎯 Quick Summary

```
1. ✅ Connect GitHub (DONE)
2. ✅ Add API variables (SECRET, EXPIRES, PORTS)
3. ✅ Add Web variables (API URLs, NODE_ENV)
4. ✅ Deploy services
5. ✅ Get public URLs
6. ✅ Update web variables with real URLs
7. ✅ Redeploy web
8. ✅ Test in browser

Total: 15-20 minutes
```

---

## 📊 Example: Complete Setup

**This is what it should look like:**

### API Service Variables:
```
JWT_ACCESS_SECRET: change-me-access-secret-min-32-chars-long!@#123
JWT_REFRESH_SECRET: change-me-refresh-secret-min-32-chars-long!@#456
API_PORT: 4000
API_PREFIX: api/v1
CORS_ORIGINS: web-xxx.railway.app
NODE_ENV: production
DATABASE_URL: (auto-injected)
```

### Web Service Variables:
```
NEXT_PUBLIC_API_URL: https://api-xxx.railway.app/api/v1
NEXT_PUBLIC_SOCKET_URL: https://api-xxx.railway.app
NODE_ENV: production
```

---

## 🎉 After Everything Works

### Share with Client:

```
🌐 Live App: https://web-xxx.railway.app

📧 Test Credentials:
   Email:    owner@distro.com
   Password: Password@123

   Email:    staff@distro.com
   Password: Password@123

   Email:    customer@distro.com
   Password: Password@123

📚 API Docs: https://api-xxx.railway.app/api/docs
```

---

## ❓ Common Questions

**Q: Do I need to add DATABASE_URL?**
```
A: Usually NO — Railway injects it automatically if your API service
   is linked to a Railway PostgreSQL service.

   If Railway asks for it manually, copy the DATABASE_URL value from:
   Postgres service → Variables tab
   Then paste into API service variable.

   Expected format:
   postgresql://postgres:<PASSWORD>@<HOST>:<PORT>/railway?sslmode=require
```

**Q: Can I change the test credentials?**
```
A: Yes! After deployment, modify in database
   Or create new users via API
```

**Q: What if I make changes to code?**
```
A: Push to GitHub → Railway auto-redeploys
   Takes 5-10 minutes
```

**Q: How do I check if deployment succeeded?**
```
A: Check Logs tab in Railway
   Look for ✅ or 🚀 messages
   Try accessing the URL in browser
```

**Q: Why is it saying "service not available"?**
```
A: Still deploying (wait 2-3 minutes)
   Or error in logs (check Logs tab)
   Or DATABASE_URL missing (restart)
```

---

## 🚀 Ready to Setup?

Follow the steps above and let me know:
1. What service is giving you trouble?
2. What's the exact error message?
3. Which variable you're having issues with?

I'll help you debug! 💪
