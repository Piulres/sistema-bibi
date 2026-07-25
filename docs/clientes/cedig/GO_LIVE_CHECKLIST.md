# Checklist go-live — CEDIG Cruzeiro

Validação pré-apresentação / uso em produção.  
**Produção:** https://sistema-bibi.netlify.app · pacote **v2.4.0** · modo **operação**

---

## Resultado da bateria (25/07/2026)

| Camada | Resultado |
|--------|-----------|
| Vitest | **529** testes OK |
| lint / docs:verify / db:verify | OK |
| `npm run pre-release` | OK |
| Playwright `e2e/walkin-particular` (chromium) | **2 passed** |
| Smoke API produção CEDIG | **21/21 OK** (`scripts/cedig-golive-smoke.sh`) |

Fluxos críticos cobertos no smoke: modo operação estável, criar prestador + listar em nova sessão + login, walk-in persistente, RBAC Alana, gestão/KPIs, páginas HTTP.

### Reexecutar o smoke (produção)

Pré-requisitos: site no ar (não `503 usage_exceeded`), `curl` + `python3`, credenciais demo em `AGENTS.md`.

```bash
bash scripts/cedig-golive-smoke.sh
```

| Seção | O que valida |
|-------|----------------|
| 1 | Home exibe `2.4.0` · CSS `/_next/static` 200 |
| 2–3 | Modo **operação** · não rebaixa após `/segmentos/*` |
| 4–6 | Logins CEDIG · RBAC Alana 403 · criar prestador + persistência + login `/login?tenant=cedig` |
| 7 | Walk-in com `autoAssignProvider` persiste em nova sessão |
| 8 | KPIs e meta (≥5 médicos) em `/api/interno/clinic-finance/*` |
| 9 | HTTP 200/302 nas rotas piloto |

O script usa `BASE=https://sistema-bibi.netlify.app` (editável no topo do arquivo). Se o modo não for operação, tenta restaurar via ADMIN plataforma + `provision-cedig`.

---

## Contas (senha `bibi123`)

| Papel | URL | E-mail |
|-------|-----|--------|
| ADMIN | `/?tenant=cedig` → `/interno/login` | `operacao@cedig.demo` |
| Secretária | idem | `alana@cedig.demo` |
| Prestador (seed) | `/login?tenant=cedig` | `bruno.dias@cedig.demo` |
| Prestador (novo) | `/login?tenant=cedig` | e-mail criado em Cadastros |

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

---

## Pronto para cliente?

**Sim — piloto Gestão + agenda/walk-in + usuários ADMIN**, com produção em operação e smoke verde.

Ainda **não** vender como “4 portais plenos CEDIG” (PPU/Excel = fase 2). Ver [`README.md`](README.md) roadmap.
