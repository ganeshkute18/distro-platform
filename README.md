# DistroPro — B2B Ordering & Inventory Management Platform

A production-grade internal platform for distribution businesses to manage orders, inventory, and approvals.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 15+ (or Docker)

### 1. Clone & Install

```bash
git clone <repo>
cd distro-platform
npm install        # installs all workspaces
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start PostgreSQL (Docker)

```bash
docker run -d \
  --name distro_postgres \
  -e POSTGRES_DB=distro_platform \
  -e POSTGRES_USER=distro_user \
  -e POSTGRES_PASSWORD=distro_pass \
  -p 5432:5432 \
  postgres:16-alpine
```

### 4. Database Setup

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed
cd ../..
```

### 5. Start Dev Servers

```bash
npm run dev
# API:  http://localhost:4000
# Web:  http://localhost:3000
# Docs: http://localhost:4000/api/docs
```

### Demo Login Credentials
| Role     | Email                    | Password      |
|----------|--------------------------|---------------|
| Owner    | owner@distro.com         | Password@123  |
| Staff    | staff@distro.com         | Password@123  |
| Customer | customer@distro.com      | Password@123  |

---

## 📁 Project Structure

```
distro-platform/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   └── shared-types/ # Shared TypeScript types
├── docker/           # Docker & Nginx configs
└── .env.example
```

---

## 🏗️ Architecture Overview

### Backend (NestJS)
- **Auth**: JWT access (15m) + refresh tokens (7d), bcrypt hashing
- **Guards**: JwtAuthGuard (global) + RolesGuard
- **Events**: EventEmitter2 for decoupled module communication
- **Inventory**: Atomic stock reservation via Prisma transactions

### Frontend (Next.js)
- **Route Groups**: `(auth)`, `(customer)`, `(staff)`, `(owner)`
- **State**: Zustand for cart, auth, notifications
- **Data Fetching**: TanStack Query with auto-refresh
- **Real-time**: Socket.IO for live notifications

### Real-time Flow
```
Order Created → EventEmitter → NotificationsService (DB)
                            → NotificationsGateway (Socket.IO)
                            → Owner's browser (instant badge update)
```

---

## 🐳 Docker Deployment

### Development
```bash
cd docker
docker-compose up -d
```

### Production
```bash
# Set production env vars in .env
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

---

## ☁️ Vercel + Railway Deployment

### Backend → Railway

1. Create new Railway project
2. Add PostgreSQL service
3. Deploy from `apps/api` directory
4. Set environment variables from `.env.example`
5. Run: `npx prisma migrate deploy && npx prisma db seed`

### Frontend → Vercel

1. Import repo to Vercel
2. Set Root Directory: `apps/web`
3. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-api.up.railway.app/api/v1
   NEXT_PUBLIC_SOCKET_URL=https://your-railway-api.up.railway.app
   ```
4. Deploy

---

## 📡 API Reference

Base URL: `http://localhost:4000/api/v1`
Swagger UI: `http://localhost:4000/api/docs`

### Authentication
```
POST /auth/login       → { accessToken, refreshToken, user }
POST /auth/refresh     → { accessToken, refreshToken }
POST /auth/logout
```

### Orders Workflow
```
POST   /orders                  (Customer)  → PENDING_APPROVAL
PATCH  /orders/:id/approve      (Owner)     → APPROVED
PATCH  /orders/:id/reject       (Owner)     → REJECTED
PATCH  /orders/:id/status       (Staff)     → PROCESSING → DISPATCHED → DELIVERED
```

---

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_ACCESS_SECRET` | Access token secret (min 32 chars) | ✅ |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary for product images | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |
| `NEXT_PUBLIC_API_URL` | Backend API URL (frontend) | ✅ |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO server URL | ✅ |

---

## 🗄️ Database

### Migrations
```bash
cd apps/api
npx prisma migrate dev --name <description>  # dev
npx prisma migrate deploy                     # production
npx prisma studio                             # GUI
```

---

## 🧪 Testing

```bash
# API unit tests
cd apps/api && npm test

# E2E tests
npm run test:e2e
```

---

## 📋 Order Status Flow

```
Customer places order
        ↓
  PENDING_APPROVAL  ← Owner notified (real-time)
        ↓
    APPROVED        ← Inventory reserved, Staff notified
        ↓
   PROCESSING       ← Staff starts packing
        ↓
   DISPATCHED       ← Inventory deducted, Customer notified
        ↓
   DELIVERED        ← Order complete
```

---

## 🔐 Role Permissions

| Feature | Owner | Staff | Customer |
|---------|-------|-------|----------|
| Approve/Reject Orders | ✅ | ❌ | ❌ |
| View all orders | ✅ | ✅* | Own only |
| Process/Dispatch | ✅ | ✅ | ❌ |
| Manage Products | ✅ | ❌ | ❌ |
| View Inventory | ✅ | ✅ | ❌ |
| Reports | ✅ | ❌ | ❌ |
| Place Orders | ❌ | ❌ | ✅ |

*Staff sees only APPROVED+ orders

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript, REST + Socket.IO |
| Database | PostgreSQL, Prisma ORM |
| State | Zustand, TanStack Query |
| Auth | JWT (access + refresh), bcrypt |
| Images | Cloudinary |
| Infra | Docker, Nginx |
| Monorepo | Turborepo |
