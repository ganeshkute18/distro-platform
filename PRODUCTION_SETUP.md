# 🚀 Production Setup Guide

Step-by-step instructions to deploy DistroPro with real users.

---

## Prerequisites

- Node.js 20+
- PostgreSQL database (Railway / AWS RDS / Supabase / local)
- (Optional) SendGrid account for email verification

---

## Step 1 — Configure Environment Variables

Copy the template and fill in real values:

```bash
cp .env.example .env
```

**Minimum required changes:**

```bash
# 1. Your production database
DATABASE_URL="postgresql://user:pass@your-db-host:5432/distro_platform"

# 2. Generate fresh secrets (run this to get a value):
#    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_ACCESS_SECRET="<64-char random string>"
JWT_REFRESH_SECRET="<different 64-char random string>"
NEXTAUTH_SECRET="<another 64-char random string>"

# 3. Your real domain
FRONTEND_URL="https://your-domain.com"
CORS_ORIGINS="https://your-domain.com"
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_API_URL="https://api.your-domain.com/api/v1"
```

---

## Step 2 — Apply Database Migrations

```bash
cd apps/api
npm run db:migrate:deploy
```

This applies all pending migrations to your production database safely.

---

## Step 3 — Seed Base Data (No Test Users)

```bash
cd apps/api
npm run db:seed:prod
```

Creates:
- ✅ Sample agencies (HUL, Emami, AMUL)
- ✅ Sample categories (Personal Care, Dairy, Home Care)
- ✅ Sample products
- ❌ **Zero user accounts** — those come next

---

## Step 4 — Create the First Owner Account

```bash
cd apps/api
npm run db:setup-owner
```

Follow the interactive prompts:

```
📧 Enter your email address: admin@yourbusiness.com
👤 Enter your full name: Your Name
🔒 Enter a secure password (min 8 chars): YourSecure@Pass2026
🔒 Confirm password: YourSecure@Pass2026
🏢 Enter your business name (optional): Your Business Name
```

The owner account will be:
- ✅ Email verified (no email link needed)
- ✅ Auto-approved
- ✅ Ready to log in immediately

---

## Step 5 — Configure Email (For Real User Signups)

> Without this, verification emails are only logged to the console — new customers and staff **cannot verify their email** and therefore cannot log in.

Add to `.env`:

```bash
# Using SendGrid (free up to 100 emails/day)
SENDGRID_API_KEY="SG.your-api-key"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="DistroPro"
```

Then update `apps/api/src/modules/email/email.service.ts` to use the provider.

---

## Step 6 — Build & Start

```bash
# From root:
npm run build
# Then start each service or use your deployment platform (Railway, PM2, Docker)
```

---

## Step 7 — Invite Staff Members

Once logged in as Owner:

1. Go to **Owner Dashboard → Users**
2. Click **Generate Invitation Code**
3. Share the code with your staff member
4. Staff signs up at `/signup/staff` using the code
5. They verify their email
6. You approve them in the dashboard
7. They can now log in

---

## User Roles Summary

| Role | How Created | Self-Register? |
|---|---|---|
| **Owner** | Via `npm run db:setup-owner` CLI | ❌ No |
| **Staff** | Via invitation code from Owner | ❌ Invite only |
| **Customer** | Self-registers at `/signup/customer` | ✅ Yes |

---

## Maintenance Commands

```bash
# Apply new migrations after code updates
npm run db:migrate:deploy

# Regenerate Prisma client after schema changes
npm run db:generate

# Create an additional owner account
npm run db:setup-owner
```

---

## ⚠️ Important Security Notes

1. **Never run `db:seed` (dev seed) in production** — it creates test accounts with known passwords
2. **Rotate JWT secrets** if you suspect they were exposed — all users will be logged out
3. **Keep `.env` out of git** — it is in `.gitignore` ✅
4. **Use HTTPS** in production — Railway does this automatically
