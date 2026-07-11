# syntax=docker/dockerfile:1.6
# --- Builder ---
FROM node:20-alpine AS builder
ARG VITE_API_URL
WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
  npm ci --no-audit --no-fund
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js ./
COPY index.html ./
COPY src ./src
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env && npx tsc -b && npx vite build

# --- Runtime ---
FROM nginx:1.27-alpine-slim AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
