#!/bin/sh
set -e
if ! npx prisma migrate deploy; then
  echo "migrate deploy failed; falling back to db push for existing databases"
  npx prisma db push
fi
exec node dist/index.js
