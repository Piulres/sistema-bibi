# Deploy — Change Management (preparação ambiente `dev`)

Checklist para integrar o pacote de reversibilidade no ambiente de desenvolvimento integrado.  
**Não executar deploy Netlify nem publicação em produção** — apenas preparação.

---

## 1. Pré-requisitos

- Branch mergeada ou em review: `cursor/change-management-pacote-a-b412` → `dev`
- Node 20+ e dependências: `npm install`
- Acesso ao banco do ambiente `dev` (SQLite local ou snapshot VM)

---

## 2. Migração de schema (obrigatório)

Novos artefatos Prisma:

- `TimelineEvent`: `metadata`, `correlationId`, `reversesId`, `reversible`
- `EntityRevision`: tabela nova

```bash
cp .env.example .env   # se ainda não existir
npx prisma generate
npx prisma db push
npm run db:seed        # opcional — repopular demo após push em VM nova
```

**Nota:** não usar `db:reset` em ambientes com dados reais de integração.

---

## 3. Variáveis de ambiente (`dev`)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `CHANGE_RESTORE_WINDOW_MS` | `300000` | Janela do desfazer rápido (toast / revert-recent) |
| `CHANGE_RESTORE_REQUIRES_CONFIRM` | `true` | Exige `RESTAURAR` no restore admin |
| `CHANGE_RESTORE_REQUIRES_APPROVAL` | `false` | Reservado Pacote F (4-eyes) |

Copiar bloco de `.env.example` para o `.env` do ambiente `dev` se quiser customizar.

---

## 4. Validação local (antes de subir `dev`)

```bash
npm run test -- tests/unit/change-management.test.ts tests/api/audit-revision.test.ts tests/api/change-management.test.ts
npm run lint
npm run pre-release
```

---

## 5. Smoke manual em `dev` (após merge)

1. Login interno: `faturamento@bibi.health` / `bibi123`
2. `/interno/cadastros` → editar beneficiário → salvar → toast **Desfazer**
3. `/interno/auditoria` → evento `UPDATED` → **Ver alterações** → **Restaurar versão** (admin)
4. `/interno/agenda` → walk-in → verificar na auditoria `correlationId` compartilhado
5. `/prestador/atendimento/[id]` → PEP → refresh → rascunho preservado

---

## 6. O que **não** fazer neste pacote

| Ação | Motivo |
|------|--------|
| `netlify deploy` | Publicação só com pedido humano explícito |
| PR direto na `main` | Fluxo: `cursor/*` → `dev` → `main` |
| `db:reset` em integração | Destrutivo |
| Atualizar `RELEASES.md` | Só após deploy confirmado em produção |

---

## 7. Rollback

- Código: revert do merge em `dev`
- Schema: colunas novas são opcionais/nullable — versão anterior do app continua lendo `TimelineEvent` sem `metadata`
- Dados: eventos com metadata permanecem; rollback de código não apaga auditoria

---

## 8. Próximo passo após `dev` estável

1. QA manual da matriz em `TESTES_CHANGE_MANAGEMENT.md`
2. Merge `dev` → `main` no fechamento do pacote
3. `pre-release` na `main`
4. Deploy manual humano conforme `docs/plataforma/OPERACOES.md`
