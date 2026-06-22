#!/usr/bin/env bash
# Build usado na Netlify (GitHub e CLI). Garante env mínima mesmo se o painel
# não injetar variáveis do netlify.toml (comum em contas novas / deploy remoto).
set -euo pipefail

export DATABASE_URL="${DATABASE_URL:-file:./dev.db}"
export NETLIFY="${NETLIFY:-true}"

npm run db:push
npm run db:seed
npm run build
