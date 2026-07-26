#!/usr/bin/env bash
# CEDIG — consolida enrich + massa da semana (dev local).
# Uso: ./scripts/cedig-mapear.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Enrich CEDIG na operation.db (portalMass)"
DATABASE_URL="file:./operation.db" DUAL_DATA_STORE=false npx tsx scripts/cedig-enrich-operation.ts

echo "→ Agenda da semana + walk-ins + gestão (API)"
BASE_URL="${BASE_URL:-http://localhost:3000}" node scripts/cedig-week-mapping.mjs

echo "✓ Massa CEDIG pronta — abra /?tenant=cedig (playbook: docs/clientes/cedig/ACOES_OPERACIONAIS.md)"
