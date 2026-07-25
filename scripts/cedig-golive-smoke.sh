#!/usr/bin/env bash
set -euo pipefail
BASE="https://sistema-bibi.netlify.app"
PASS=0
FAIL=0
note() { echo "✓ $*"; PASS=$((PASS + 1)); }
fail() { echo "✗ $*"; FAIL=$((FAIL + 1)); }
need() { if [[ "$1" == "$2" ]]; then note "$3"; else fail "$3 (got: $1)"; fi; }

ADMIN=$(mktemp)
OP=$(mktemp)
PREST=$(mktemp)
ALANA=$(mktemp)
OP2=$(mktemp)
ALANA2=$(mktemp)
trap 'rm -f "$ADMIN" "$OP" "$PREST" "$ALANA" "$OP2" "$ALANA2"' EXIT

echo "=== 1. Home / versão ==="
curl -sS "$BASE/" -o /tmp/cedig-home.html
if python3 -c 'from pathlib import Path; assert "2.4.0" in Path("/tmp/cedig-home.html").read_text()'; then
  note "home v2.4.0"
else
  fail "home sem v2.4.0"
fi
CSS=$(python3 -c 'import re; from pathlib import Path; m=re.findall(r"/_next/static/[^\"]+\.css", Path("/tmp/cedig-home.html").read_text()); print(m[0] if m else "")')
CODE=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE$CSS")
need "$CODE" "200" "CSS static"

echo "=== 2. Modo operação ==="
curl -sS -c "$ADMIN" -b "$ADMIN" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"faturamento@bibi.health","password":"bibi123","portal":"interno"}' >/dev/null
MODE=$(curl -sS -b "$ADMIN" "$BASE/api/interno/data-store")
if echo "$MODE" | grep -q '"mode":"operation"'; then
  note "modo operation"
else
  fail "modo não é operation — restaurando"
  curl -sS -b "$ADMIN" -X POST "$BASE/api/interno/data-store" \
    -H "Content-Type: application/json" -d '{"mode":"operation","confirm":"OPERAR"}' >/dev/null || true
  curl -sS -b "$ADMIN" -X POST "$BASE/api/auth/logout" >/dev/null || true
  rm -f "$ADMIN"
  curl -sS -c "$ADMIN" -b "$ADMIN" -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"faturamento@bibi.health","password":"bibi123","portal":"interno"}' >/dev/null
  curl -sS -b "$ADMIN" -X POST "$BASE/api/interno/operation/provision-cedig" \
    -H "Content-Type: application/json" -d '{"confirm":"CEDIG"}' >/dev/null || true
  MODE=$(curl -sS -b "$ADMIN" "$BASE/api/interno/data-store")
  if echo "$MODE" | grep -q '"mode":"operation"'; then note "modo operation (restaurado)"; else fail "falha operation"; fi
fi

echo "=== 3. Segmentos não rebaixam ==="
curl -sS -o /dev/null "$BASE/segmentos/veterinaria"
MODE2=$(curl -sS -b "$ADMIN" "$BASE/api/interno/data-store")
if echo "$MODE2" | grep -q '"mode":"operation"'; then note "operation após /segmentos"; else fail "rebaixou demo"; fi

echo "=== 4. Logins CEDIG ==="
curl -sS -c "$OP" -b "$OP" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"operacao@cedig.demo","password":"bibi123","portal":"interno","tenantSlug":"cedig"}' \
  | python3 -c 'import sys,json; assert json.load(sys.stdin)["user"]["tenantSlug"]=="cedig"'
note "login operacao@cedig.demo"
curl -sS -c "$ALANA" -b "$ALANA" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"alana@cedig.demo","password":"bibi123","portal":"interno","tenantSlug":"cedig"}' \
  | python3 -c 'import sys,json; assert json.load(sys.stdin)["user"]["name"]=="Alana"'
note "login alana@cedig.demo"

echo "=== 5. RBAC Alana ==="
ALANA_CREATE=$(curl -sS -b "$ALANA" -X POST "$BASE/api/interno/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"X","email":"x.rbac3@cedig.demo","password":"bibi123","role":"PRESTADOR"}')
if echo "$ALANA_CREATE" | grep -q administradores; then note "Alana 403 criar usuário"; else fail "Alana sem 403: $ALANA_CREATE"; fi

echo "=== 6. Prestador create + persist + login ==="
TS=$(date +%s)
EMAIL="golive.${TS}@cedig.demo"
curl -sS -b "$OP" -X POST "$BASE/api/interno/users" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Golive Prestador\",\"email\":\"$EMAIL\",\"password\":\"bibi123\",\"role\":\"PRESTADOR\"}" \
  | python3 -c 'import sys,json; assert "user" in json.load(sys.stdin)'
note "prestador criado"
curl -sS -c "$OP2" -b "$OP2" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"operacao@cedig.demo","password":"bibi123","portal":"interno","tenantSlug":"cedig"}' >/dev/null
curl -sS -b "$OP2" "$BASE/api/interno/users" \
  | python3 -c "import sys,json; assert '$EMAIL' in [u['email'] for u in json.load(sys.stdin)['users']]"
note "prestador persiste nova sessão"
curl -sS -c "$PREST" -b "$PREST" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"bibi123\",\"portal\":\"prestador\",\"tenantSlug\":\"cedig\"}" \
  | python3 -c 'import sys,json; assert json.load(sys.stdin).get("redirectTo")=="/prestador/dashboard"'
note "login portal prestador"
WRONG=$(curl -sS -b "$ADMIN" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"bibi123\",\"portal\":\"prestador\"}")
if echo "$WRONG" | grep -q '?tenant=cedig'; then note "mismatch aponta cedig"; else fail "msg: $WRONG"; fi

echo "=== 7. Walk-in persistente ==="
TODAY=$(date -u +%Y-%m-%d)
MINUTE=$((10 + RANDOM % 40))
HOUR=$((14 + RANDOM % 4))
SLOT=$(printf "%sT%02d:%02d:00.000Z" "$TODAY" "$HOUR" "$MINUTE")
AGENDA=$(curl -sS -b "$ALANA" "$BASE/api/interno/appointments?date=$TODAY")
python3 -c 'import json,sys; d=json.loads(sys.argv[1]); assert d.get("dataStoreMode")=="operation" and d.get("walkInEphemeral") is False' "$AGENDA"
note "agenda operation"
CPF=$(python3 - <<'PY'
import random
def dig(ns, w):
    s = sum(n * wi for n, wi in zip(ns, w))
    r = 11 - s % 11
    return 0 if r >= 10 else r
nums = [random.randint(0, 9) for _ in range(9)]
d1 = dig(nums, range(10, 1, -1))
d2 = dig(nums + [d1], range(11, 1, -1))
s = "".join(map(str, nums + [d1, d2]))
print(f"{s[:3]}.{s[3:6]}.{s[6:9]}-{s[9:]}")
PY
)
WALK=$(curl -sS -b "$ALANA" -X POST "$BASE/api/interno/appointments/walk-in" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Golive Walkin\",\"cpf\":\"$CPF\",\"birthDate\":\"1990-01-15\",\"autoAssignProvider\":true,\"scheduledAt\":\"$SLOT\",\"reason\":\"Exame walk-in\"}")
python3 -c 'import json,sys; d=json.loads(sys.argv[1]); assert "appointment" in d, d' "$WALK"
note "walk-in criado (auto-assign)"
curl -sS -c "$ALANA2" -b "$ALANA2" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"alana@cedig.demo","password":"bibi123","portal":"interno","tenantSlug":"cedig"}' >/dev/null
curl -sS -b "$ALANA2" "$BASE/api/interno/appointments?date=$TODAY" \
  | python3 -c 'import sys,json; assert "Golive Walkin" in [a["patientName"] for a in json.load(sys.stdin)["appointments"]]'
note "walk-in persiste"

echo "=== 8. Gestão ==="
curl -sS -b "$OP" "$BASE/api/interno/clinic-finance/kpis" \
  | python3 -c 'import sys,json; assert "kpis" in json.load(sys.stdin)'
note "KPIs"
curl -sS -b "$OP" "$BASE/api/interno/clinic-finance/meta" \
  | python3 -c 'import sys,json; assert len(json.load(sys.stdin).get("providers",[]))>=5'
note "médicos na gestão"

echo "=== 9. HTTP pages ==="
for path in "/?tenant=cedig" "/interno/gestao" "/interno/agenda" "/interno/cadastros?tab=users" "/login?tenant=cedig"; do
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" -b "$OP" "$BASE$path")
  if [[ "$CODE" == "200" || "$CODE" == "302" || "$CODE" == "307" ]]; then
    note "HTTP $CODE $path"
  else
    fail "HTTP $CODE $path"
  fi
done

echo ""
echo "==== RESULTADO: $PASS ok · $FAIL falhas ===="
if [[ "$FAIL" -ne 0 ]]; then exit 1; fi
exit 0
