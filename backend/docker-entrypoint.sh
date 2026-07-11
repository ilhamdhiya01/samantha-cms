#!/bin/sh
# Apply Prisma migrations when PRISMA_RUN_MIGRATE=1 and prisma CLI is available.
# Default: skip migrate (run migrations manually from a dev/build environment).
set -e

if [ "${PRISMA_RUN_MIGRATE}" = "1" ]; then
  if [ -f "node_modules/.bin/prisma" ]; then
    echo "[entrypoint] PRISMA_RUN_MIGRATE=1 → running prisma migrate deploy"
    npx prisma migrate deploy
  else
    echo "[entrypoint] PRISMA_RUN_MIGRATE=1 but prisma CLI not found in image; skipping migrate"
    echo "[entrypoint] run migrations manually: npx prisma migrate deploy"
  fi
else
  echo "[entrypoint] PRISMA_RUN_MIGRATE!=1 → skipping migrate"
fi

echo "[entrypoint] starting node dist/server.js"
exec node dist/server.js
