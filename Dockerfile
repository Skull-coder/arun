FROM node:24-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# cache-bust: 2026-07-21
COPY . .

# Pass in the public clerk key so it gets baked into the frontend
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Skip Zod env validation during build (since we don't have database URLs etc)
ENV SKIP_ENV_VALIDATION=1
# Provide a dummy database URL so Drizzle ORM doesn't crash during module initialization
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

ENV NEXT_TELEMETRY_DISABLED=1

# Build the app
RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Since we are using a custom server.js, we must copy the entire built app
COPY --from=builder /app ./
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run our custom Socket.io server engine
CMD ["node", "server.js"]
