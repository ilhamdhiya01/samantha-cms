# Samantha CMS Monorepo

Frontend (`frontend/`) + Backend (`backend/`) — single repo, orchestrated by root `docker-compose.yml`.

## Layout

- `frontend/` — React 18 + Vite 5 + Tailwind 3, served by nginx, port `${FE_PORT:-5176}`
- `backend/` — Express + Prisma + JWT, port `${BE_PORT:-4006}`

## Local dev

```bash
# Frontend
cd frontend && cp .env.example .env && npm i && npm run dev

# Backend
cd backend && cp .env.example .env && npm i && npm run dev
```

## Environment files

On the VPS, create these three files (all outside git):

- `/.env` — Docker Compose orchestration (non-secret)
- `/frontend/.env` — frontend build-time variables (Vite embeds these into the static bundle)
- `/backend/.env` — backend runtime (secrets)

Example root `/.env`:

```bash
COMPOSE_PROJECT_NAME=samantha-cms
FE_PORT=5176
BE_PORT=4006
```

Example `/frontend/.env`:

```bash
VITE_API_URL=http://localhost:4006
```

Important: `VITE_API_URL` must be in `frontend/.env` because the frontend Dockerfile copies it into the build stage. Vite embeds it into the static bundle at **build time**, so it is not read at runtime from `env_file`.

## Deploy (auto on push to main)

GitHub Actions runs lint + typecheck, then SSH to VPS to build and start services via Docker Compose.

Manual deploy on VPS:

```bash
cd ~/samantha-cms
docker compose build --no-cache frontend backend
docker compose up -d
```

## VPS

- Host: `43.157.223.21`
- Frontend: http://43.157.223.21:5176
- Backend: http://43.157.223.21:4006

## GitHub Secrets (Settings → Secrets → Actions)

- `VPS_HOST` = `43.157.223.21`
- `VPS_USER` = `ubuntu`
- `VPS_SSH_KEY` = isi `cat ~/.ssh/id_ed25519` (full private key block)
- `GHCR_USER` = `ilhamdhiya01`
- `GHCR_PAT` = GitHub PAT classic, scope `read:packages` (https://github.com/settings/tokens/new )
