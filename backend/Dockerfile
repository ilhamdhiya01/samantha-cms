# --- Builder ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh

# prisma.config.ts requires DIRECT_URL to be resolvable; generate doesn't need a real DB connection.
ENV DIRECT_URL=postgresql://placeholder:placeholder@localhost:5432/postgres

RUN npx prisma generate
RUN npm run build
RUN chmod +x /usr/local/bin/entrypoint.sh

# Generate a minimal package.json for runtime: only packages that cannot be bundled.
RUN node -e "const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync('package.json','utf8')); const externals=['@prisma/adapter-pg','@prisma/client','bcryptjs','multer','pg','ws']; const deps={}; for (const e of externals) deps[e]=pkg.dependencies[e]; fs.writeFileSync('runtime.package.json', JSON.stringify({dependencies:deps}, null, 2));"
RUN mkdir -p /tmp/runtime && cp /app/runtime.package.json /tmp/runtime/package.json && \
    cd /tmp/runtime && npm install --package-lock-only && \
    cp /tmp/runtime/package-lock.json /app/runtime.package-lock.json

# --- Runtime ---
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache openssl wget

COPY --from=builder /app/runtime.package.json ./package.json
COPY --from=builder /app/runtime.package-lock.json ./package-lock.json
RUN npm ci --no-audit --no-fund --omit=peer

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /usr/local/bin/entrypoint.sh /usr/local/bin/entrypoint.sh

EXPOSE 4006
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --spider http://localhost:4006/health || exit 1

CMD ["/usr/local/bin/entrypoint.sh"]
