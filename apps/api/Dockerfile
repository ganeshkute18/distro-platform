# ─── Builder ─────────────────────────────────────────────────────────────────
# Build context: repository ROOT (Railway default)
# This Dockerfile properly handles the npm workspaces monorepo structure.
FROM node:20-alpine AS builder
WORKDIR /app

# Install build tools needed for native modules
RUN apk add --no-cache python3 make g++

# 1. Copy workspace manifest files first (for better layer caching)
COPY package.json package-lock.json turbo.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/

# 2. Install ALL workspace dependencies from root
RUN npm ci

# 3. Copy all source files
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# 4. Generate Prisma client (does NOT need DATABASE_URL)
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma

# 5. Build the API
RUN npm run build --workspace=apps/api

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL — required by Prisma engine binaries at runtime
RUN apk add --no-cache openssl

# Copy workspace manifests for production install
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install production deps only
RUN npm ci --omit=dev --ignore-scripts \
  && npm install prisma@5.14.0 --no-save

# Copy built output and prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Railway injects $PORT — use it, fall back to 4000
EXPOSE 4000

# Run migrations then start the server (use root-relative paths)
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma && node ./apps/api/dist/src/main.js"]
