# Samantha CMS Monorepo

Frontend (`cms-frontend/`) + Backend (`cms-backend/`) — single repo, two Docker images.

## Layout
- `cms-frontend/` — React 18 + Vite 5 + Tailwind 3, served by nginx, port 5176
- `cms-backend/` — Express + Prisma + JWT, port 4006

## Local dev
```bash
# Frontend
cd cms-frontend && cp .env.example .env && npm i && npm run dev

# Backend
cd cms-backend && cp .env.example .env && npm i && npm run dev
```

## Deploy (auto on push to main)
GitHub Actions builds both images → pushes to `ghcr.io/ilhamdhiya01/samantha-cms/{frontend,backend}` → SSH to VPS → pulls & restarts containers.

Manual deploy on VPS:
```bash
cd ~/apps/samantha-cms
docker compose -f docker-compose.yml pull
docker compose -f docker-compose.yml up -d
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
- `GHCR_PAT` = GitHub PAT classic, scope `read:packages` (https://github.com/settings/tokens/new)
