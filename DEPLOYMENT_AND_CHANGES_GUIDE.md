# Deployment, Changes & Real-Time Updates Guide
## distro-platform B2B System

---

## 📋 Quick Summary

You asked three important questions:

1. ✅ **Real Logins**: Implemented - sample users + invitation system
2. ✅ **Sign Up Control**: Implemented - role-based signup with restrictions
3. ✅ **Real-Time Changes**: Explained - different approaches below

---

## 🔐 Authentication System Overview

### User Roles & How They Sign Up

#### 1. **CUSTOMER** (Public Signup - No Approval Needed)
```
Anyone can sign up directly as a customer
Endpoint: POST /api/v1/auth/signup/customer
```

```json
{
  "email": "newcustomer@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "businessName": "John's Store"
}
```

✅ **Instant approval** - User can login immediately

---

#### 2. **STAFF** (Invitation-Only - Owner Controls)
```
Owner generates invitation code
Staff uses code to sign up
Endpoint: POST /api/v1/auth/signup/staff
```

**Step 1: Owner generates invitation code**
```
Endpoint: POST /api/v1/auth/invitations/generate
Headers: Authorization: Bearer <owner_token>

Body:
{
  "role": "STAFF",
  "email": "newstaff@example.com",    // Optional: pre-assign
  "expiresInDays": 7
}

Response:
{
  "code": "STAFF_ABC123_1234567890",
  "role": "STAFF",
  "expiresAt": "2026-04-30T12:00:00Z"
}
```

**Step 2: Staff signs up with code**
```
Endpoint: POST /api/v1/auth/signup/staff

Body:
{
  "email": "newstaff@example.com",
  "password": "SecurePassword123!",
  "name": "Jane Staff",
  "invitationCode": "STAFF_ABC123_1234567890"
}
```

✅ **Approved by code** - Staff can login after signup

---

#### 3. **OWNER** (Manual Creation Only - Database)
```
Only created by Admin in database OR existing owner with approval
NO public signup allowed
Prevents anyone from becoming owner
```

---

## 📝 Test Credentials (After Seeding)

Run these commands:
```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed
```

### Login Credentials:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Owner** | owner@distro.com | Password@123 | Full system access |
| **Staff** | staff@distro.com | Password@123 | Orders, inventory |
| **Customer** | customer@distro.com | Password@123 | Catalog, orders |

### Sample Staff Invitation Codes:

```
STAFF_ABC123_TEST001  (expires in 7 days)
STAFF_DEF456_TEST002  (expires tomorrow)
```

**Test signup with invitation:**
```
Email: anyemail@test.com
Password: TestPassword123!
Invitation Code: STAFF_ABC123_TEST001
```

---

## 🚀 Making Real-Time Changes on AWS

### **SCENARIO 1: Code Changes (Features, Bug Fixes)**

#### Timeline: 5-10 minutes

**Process:**
```
1. Make changes locally
   └─ Edit src/modules/auth/...
   └─ Test locally with: npm run dev
   
2. Commit to GitHub
   └─ git add .
   └─ git commit -m "your message"
   └─ git push origin main
   
3. AWS auto-detects changes
   └─ Railway/AWS webhook triggered
   └─ Rebuilds Docker image
   └─ Runs tests (if configured)
   
4. Deploy to production
   └─ Stops old service
   └─ Starts new service
   └─ Duration: 3-5 minutes
   
5. Changes go live
   └─ Your updates are visible
   └─ No manual redeployment needed
```

**Example: Adding new feature**
```typescript
// 1. Add new method to auth.service.ts
async myNewFeature() {
  // implementation
}

// 2. Add endpoint to auth.controller.ts
@Post('new-feature')
newFeature() {
  return this.authService.myNewFeature();
}

// 3. Commit and push
git add apps/api/src/modules/auth/*
git commit -m "feat: add new authentication feature"
git push origin main

// 4. Wait 5-10 minutes for AWS to deploy automatically
```

---

### **SCENARIO 2: Database Schema Changes**

#### Timeline: 10-15 minutes

**Process:**
```
1. Update Prisma schema
   └─ Edit apps/api/prisma/schema.prisma
   
2. Create migration locally
   └─ npx prisma migrate dev --name descriptive_name
   
3. Commit migration
   └─ git add apps/api/prisma/migrations/
   └─ git commit -m "migration: add new field"
   └─ git push origin main
   
4. AWS rebuilds and runs migration
   └─ During container startup
   └─ Applies migration to production DB
   └─ If migration fails, service rolls back
   
5. Data structure updated live
```

**Example: Adding new field to User**
```prisma
// 1. Update schema
model User {
  // existing fields...
  phoneVerified Boolean @default(false)  // NEW FIELD
}

// 2. Create migration
npx prisma migrate dev --name add_phone_verified_to_user

// 3. Commit and push
git add apps/api/prisma/
git commit -m "migration: add phone verification field"
git push origin main

// 4. On AWS: Automatically runs migration during redeploy
```

---

### **SCENARIO 3: Configuration Changes (Instant)**

#### Timeline: Immediate (no redeploy needed)

**Process:**
```
1. Update AWS Secrets Manager
   └─ Go to AWS Console > Secrets Manager
   └─ Edit secret value
   └─ Save
   
2. Service picks up change
   └─ Immediate (within seconds)
   └─ No restart needed
   
3. Changes apply instantly
```

**Example: Change JWT expiration**
```
Existing value: JWT_ACCESS_EXPIRES_IN=15m

Update to: JWT_ACCESS_EXPIRES_IN=1h

Changes take effect immediately for new tokens
```

---

### **SCENARIO 4: Data-Driven Changes (Instant - Recommended)**

#### Timeline: Immediate (best practice)

Instead of hardcoding changes in code, store in database!

**Process:**
```
1. Create feature_flags or settings table
   └─ Store configuration in database
   
2. Update via API or Admin panel
   └─ No code change needed
   └─ No redeploy needed
   
3. App checks database at runtime
   └─ Instant changes
   
4. Rollback instantly
   └─ Just revert database value
```

**Example: Toggle features**
```typescript
// Create settings table
model Setting {
  id    String @id @default(cuid())
  key   String @unique
  value String
  
  @@map("settings")
}

// Use in code
async getAppSettings() {
  const allowSignup = await prisma.setting.findUnique({
    where: { key: 'allow_customer_signup' }
  });
  
  return allowSignup.value === 'true';
}

// Admin can update via dashboard instantly
// No code change, no redeploy!
```

---

## ⚡ Quick Action Guide

### To Deploy Code Changes:
```bash
cd D:\distro-platform\distro-platform

# 1. Make your changes
# 2. Test locally: npm run dev
# 3. Commit and push
git add .
git commit -m "feat: your change description"
git push origin main

# Done! AWS deploys automatically in 5-10 minutes
# Check deployment status on Railway dashboard
```

### To Add Database Schema:
```bash
# 1. Edit apps/api/prisma/schema.prisma

# 2. Create migration
cd apps/api
npx prisma migrate dev --name your_migration_name

# 3. Commit and push
git add prisma/migrations/
git commit -m "migration: description"
git push origin main

# AWS auto-runs migration on next deploy
```

### To Test Locally Before Pushing:
```bash
# 1. Start dev servers
npm run dev

# 2. Make changes
# 3. Test in browser/Postman
# 4. If good, commit and push
# 5. If issues, fix locally first
```

---

## 🔍 Monitoring Deployments

### View Deployment Status:

1. **Railway Dashboard**
   - Go to railway.app
   - Click your project
   - Click service (distro-api / distro-web)
   - View deployment logs

2. **Check Logs**
   ```bash
   # View API logs
   aws logs tail /ecs/distro-api --follow --region us-east-1
   
   # View Web logs
   aws logs tail /ecs/distro-web --follow --region us-east-1
   ```

3. **Check Service Status**
   ```bash
   aws ecs describe-services \
     --cluster distro-production \
     --services distro-api-service distro-web-service \
     --region us-east-1
   ```

---

## ⚠️ Important Considerations

### 1. **Zero-Downtime Deployment**
- AWS ECS automatically handles zero-downtime deployments
- Old containers run while new ones start
- Requests redirected after health checks pass

### 2. **Database Migrations**
- Always test migrations locally first
- Have rollback plan (create `down` migrations)
- Never delete columns without backup

### 3. **Secrets Management**
- Never commit `.env` files
- Always use AWS Secrets Manager for sensitive data
- Rotate credentials periodically

### 4. **Testing**
- Always test locally before pushing
- Use feature branches for major changes
- Review code before merging to main

---

## 🛠️ Troubleshooting Changes

### Changes not showing up after deploy?

```bash
# 1. Check deployment status
aws ecs describe-services --cluster distro-production --services distro-api-service

# 2. Check task logs
aws logs tail /ecs/distro-api --follow

# 3. Force redeploy
aws ecs update-service --cluster distro-production --service distro-api-service --force-new-deployment

# 4. Check if changes were actually pushed
git log --oneline origin/main | head -5
```

### Deployment stuck or failing?

```bash
# Check latest task
aws ecs describe-tasks --cluster distro-production --tasks <task-id>

# View detailed error logs
aws logs get-log-events --log-group-name /ecs/distro-api --log-stream-name <stream-name>

# Rollback by pushing previous commit
git revert <commit-id>
git push origin main
```

---

## 📚 Security Checklist

- ✅ Credentials stored in AWS Secrets Manager (not code)
- ✅ Code changes tested locally before pushing
- ✅ Migrations backed up before running
- ✅ Always use HTTPS in production
- ✅ Audit logs enabled for all changes
- ✅ Rate limiting configured on API
- ✅ CORS properly configured

---

## 🚀 Summary: How to Deploy to Client

```
1. ✅ Push to GitHub
   git push origin main

2. ✅ Wait 5-10 minutes
   AWS auto-rebuilds and deploys

3. ✅ Share URL with client
   https://distro-alb-xxx.us-east-1.elb.amazonaws.com

4. ✅ Provide test credentials
   owner@distro.com / Password@123

5. ✅ Guide client on signup options
   - Customers: Direct signup
   - Staff: Need invitation code from owner
```

---

## 📞 Still Have Questions?

- **Code changes timing?** 5-10 minutes via auto-deployment
- **Database changes?** Same process, 10-15 minutes
- **Configuration updates?** Instant via Secrets Manager
- **Rollback changes?** Push previous commit to main
- **Emergency fix?** Fix locally, test, push to main

**All changes are tracked in Git history for audit trail!** 📊

