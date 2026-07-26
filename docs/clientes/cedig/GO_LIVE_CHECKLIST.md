# Checklist go-live — CEDIG Cruzeiro

Validação pré-apresentação / uso em produção.

| Item | Valor |
|------|-------|
| **Produção** | https://sistema-bibi.netlify.app |
| **Pacote** | **v3.0.0** ([`RELEASES.md`](../../versoes/RELEASES.md)) |
| **Modo de dados** | **operação** (Netlify Blobs) · tenant `cedig` provisionado |
| **Playbook** | [`ACOES_OPERACIONAIS.md`](ACOES_OPERACIONAIS.md) |

---

## Resultado das baterias

### Produção v3.0.0 (25/07/2026)

| Check | Resultado |
|-------|-----------|
| Title / `#novidades` | ServiceOS **v3.0.0** |
| `/instalar` · PWA manifest | 200 · `display: standalone` |
| Modo dados | **operação** · CEDIG provisionado |
| Stop builds | ON |

### Smoke API CEDIG (25/07/2026)

| Camada | Resultado |
|--------|-----------|
| Vitest / lint / docs:verify / db:verify | OK (pacote release) |
| `npm run pre-release` | OK |
| Playwright `e2e/walkin-particular` (chromium) | **2 passed** |
| Smoke API CEDIG | script `scripts/cedig-golive-smoke.sh` (home **v3.0.0**, operação, walk-in, RBAC, gestão) |

Fluxos cobertos no smoke: modo operação estável, criar prestador + listar em nova sessão + login, walk-in persistente, RBAC Alana, gestão/KPIs, páginas HTTP.

### Mapeamento local 4 portais (26/07/2026)

Agenda da semana + walk-ins + lançamentos SYNCED + navegação Interno/Prestador/PJ/Beneficiário — ver [`ACOES_OPERACIONAIS.md`](ACOES_OPERACIONAIS.md) §4 · [`HISTORICO_VALIDACAO.md`](HISTORICO_VALIDACAO.md).

---

## Contas (senha `bibi123`)

| Papel | URL | E-mail |
|-------|-----|--------|
| ADMIN | `/?tenant=cedig` → `/interno/login` | `operacao@cedig.demo` |
| Secretária | idem | `alana@cedig.demo` |
| Prestador (seed) | `/login?tenant=cedig` | `bruno.dias@cedig.demo` |
| Prestador (novo) | `/login?tenant=cedig` | e-mail criado em Cadastros |
| PJ CentralMed | `/pj/login?tenant=cedig` | `rh@centralmed.demo` |
| Beneficiário | `/beneficiario/login?tenant=cedig` | `maria.cedig@email.com` |

**Não** usar `/interno/login` para prestador.

---

## Roteiro rápido de aceite (15 min)

1. Confirmar modo **operação** em `/interno/seguranca` (ADMIN plataforma `faturamento@bibi.health` se precisar).
2. Login Alana → `/interno/gestao` → lançar 1 exame + 1 despesa → ver KPIs.
3. Login ADMIN CEDIG → Cadastros → Usuários → criar prestador de teste.
4. Logout → `/login?tenant=cedig` → entrar com o prestador criado.
5. Login Alana → `/interno/agenda` → walk-in → confirmar chegada na lista (não some após F5).

---

## Regras que evitam “sumiu”

| Sintoma | Causa | Ação |
|---------|-------|------|
| Walk-in / usuário some | Modo **demo** | Segurança → Operação (`OPERAR`) |
| Login prestador falha | Portal/tenant errado | `/login?tenant=cedig` |
| Criar usuário 403 | Conta RECEPÇÃO | Usar `operacao@cedig.demo` |
| Massa CEDIG “vazia” no local | Store **operation** sem enrich | `./scripts/cedig-mapear.sh` ou `cedig-enrich-operation.ts` |

---

## Pronto para cliente?

| Camada | Status |
|--------|--------|
| Gestão clínica + preços | ✅ |
| Agenda / walk-in (modo operação) | ✅ |
| Ponte PPU (lançamento → fatura / extrato / PJ) | ✅ desde v2.6 · em produção **v3.0.0** |
| 4 portais técnicos (labels Exame) | ✅ mapeados 25–26/07 |
| Homologação humana in loco | ⏳ pendente |
| Treino Alana (15 min) | ⏳ usar [`ROTEIRO_HOMOLOGACAO.md`](ROTEIRO_HOMOLOGACAO.md) |

**Sim para piloto técnico** (planilha → gestão + PPU).  
**Não vender ainda como “os 4 portais CEDIG em produção plena”** até aceite humano in loco.

Re-smoke: `BASE=https://sistema-bibi.netlify.app bash scripts/cedig-golive-smoke.sh`
