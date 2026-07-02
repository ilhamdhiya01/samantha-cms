# cms-backend

Samantha Software House — CMS Backend (Express + Prisma + Supabase Postgres).

## Stack

- Node.js 20+, TypeScript 5 (strict)
- Express 4 + Helmet + CORS + express-rate-limit
- Prisma 5 (PostgreSQL via Supabase)
- Supabase JS (server-side, service role)
- Zod (validation)
- JWT (jsonwebtoken) + bcryptjs (auth)
- Multer (media upload)
- tsx (dev) → tsc (build)

## Setup

```bash
npm install
cp .env.example .env
# edit .env: DATABASE_URL, DIRECT_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npx prisma generate
npx prisma migrate dev
npm run seed  # bikin 1 admin default
```

## Run

```bash
# dev
npm run dev

# prod build
npm run build
npm start
```

## Env

| Key | Required | Notes |
|-----|----------|-------|
| `PORT` | no | default 4001 |
| `DATABASE_URL` | yes | Supabase pooled connection |
| `DIRECT_URL` | yes | Supabase direct connection (for Prisma migrate) |
| `SUPABASE_URL` | yes | https://xxx.supabase.co |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Backend-only, never expose |
| `JWT_SECRET` | yes | min 16 chars |
| `CORS_ORIGIN` | no | comma-separated origins |

## Endpoints (initial)

- `GET /` — service info
- `GET /health` — health + DB check

Next tasks (T-CMS-002..): auth, CRUD posts/projects/experiences, media upload.
