# Plano de testes — Change Management (ServiceOS)

Documento de validação dos pacotes A–F de reversibilidade e auditoria acionável.

**Branch:** `cursor/change-management-pacote-a-b412`  
**Relacionado:** `docs/plataforma/TESTES.md` · `src/lib/change-management/`

---

## 1. Escopo por pacote

| Pacote | O que validar | Automatizado |
|--------|---------------|--------------|
| **A** | `TimelineEvent.metadata`, diff na auditoria, snapshots Patient/Company/PricingRule | `tests/unit/change-management.test.ts`, `tests/api/audit-revision.test.ts` |
| **B** | Undo local (forms/PEP), toast desfazer, walk-in `correlationId` | `tests/api/change-management.test.ts`, E2E manual |
| **C** | `runChangeCommand`, `EntityRevision`, restore/revert-recent APIs | `tests/api/change-management.test.ts` |
| **D** | void fatura, void PPU, reverse estoque, cancel CANCELLED | `tests/api/change-management.test.ts` |
| **E** | Webhook `ENTITY_REVERTED`, PEP retificação, cancel exame | `tests/api/change-management.test.ts` (parcial) |
| **F** | Export auditoria com colunas extras, flags env | `tests/api/exports.test.ts` (smoke) |

---

## 2. Matriz de casos automatizados

### Unitário (`tests/unit/change-management.test.ts`)

- `buildChangeMetadata` detecta `fieldsChanged`
- Serialização/parse JSON de metadata
- `buildDeleteMetadata` só com `before`
- Parse inválido → `null`

### API — auditoria (Pacote A)

| Caso | Endpoint / fluxo | Assert |
|------|------------------|--------|
| Patient UPDATE grava diff | `PATCH /api/interno/patients/[id]` | `metadata.fieldsChanged`, `reversible: true` |
| Company UPDATE grava diff | `PATCH /api/interno/companies/[id]` | idem |
| Pricing UPDATE grava diff | `PUT /api/interno/pricing-rules/[id]` | idem |
| Audit expõe `hasDiff` | `GET /api/interno/audit` | `metadata` parseado |

### API — change management (Pacotes B–D)

| Caso | Assert |
|------|--------|
| `revert-recent` desfaz UPDATE recente | estado + evento `REVERTED`/`RESTORED` |
| `restore` exige `confirm: RESTAURAR` | 400 sem confirmação |
| `restore` negado para RECEPCAO | 403 |
| Walk-in API | `correlationId` igual em Patient + Appointment events |
| `EntityRevision` criada após UPDATE Procedure | `GET /api/interno/revisions` |
| `void` fatura FECHADA | status `ANULADA`, usages `billed: false` |
| `void` fatura PAGA | 400 |
| Beneficiário cancel | timeline `CANCELLED` |

---

## 3. Casos manuais (pós-merge em `dev`)

| # | Fluxo | Passos | Resultado esperado |
|---|-------|--------|-------------------|
| M1 | Undo formulário cadastros | Editar beneficiário → alterar nome → Desfazer (Ctrl+Z) | Campo volta antes do save |
| M2 | Toast pós-salvar | Salvar edição → Desfazer no toast | `revert-recent` OK |
| M3 | Auditoria restore | `/interno/auditoria` → Ver alterações → Restaurar versão | Diff + novo evento |
| M4 | PEP rascunho | Prestador → atendimento → digitar → refresh página | Rascunho em sessionStorage |
| M5 | Walk-in | Agenda → walk-in via UI | Um POST, correlationId na timeline |
| M6 | Export auditoria | Export XLSX | Colunas Campos alterados / Reversível |

---

## 4. Comandos

```bash
# Pacote change management
npm run test -- tests/unit/change-management.test.ts tests/api/audit-revision.test.ts tests/api/change-management.test.ts

# Regressão completa
npm run test
npm run lint
npm run pre-release
```

---

## 5. Critérios de aceite para merge em `dev`

1. Todos os testes Vitest passando
2. `prisma db push` aplicado sem erro (novas colunas + `EntityRevision`)
3. Lint sem erros novos
4. `pre-release` OK (lint + docs + bootstrap dual-store + `db:verify` + test + build)
5. Documento `CHANGE_MANAGEMENT_DEPLOY.md` revisado pelo humano antes de publicar em ambiente integrado

---

## 6. Lacunas conhecidas (backlog)

- E2E Playwright dedicado para toast/restore na UI
- Restore de `PricingRule` DELETED (recriação)
- Estorno formal pós-PIX confirmado (nota de crédito completa)
- Aprovação 4-eyes quando `CHANGE_RESTORE_REQUIRES_APPROVAL=true`
