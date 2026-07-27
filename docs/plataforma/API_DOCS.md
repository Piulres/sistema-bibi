# Documentação da API — Swagger UI

Guia para explorar, testar e validar o contrato **OpenAPI 3.0** do **Sistema Bibi - ServiceOS**.

| Recurso | URL (dev) | URL (produção) |
|---------|-----------|----------------|
| **Swagger UI (interativo)** | http://localhost:3000/api/docs | https://sistema-bibi.netlify.app/api/docs |
| **Spec YAML** | http://localhost:3000/openapi.yaml | https://sistema-bibi.netlify.app/openapi.yaml |
| **Paths documentados** | 123 de 163 Route Handlers (40 sem YAML — aviso em `openapi:verify`) | idem |
| Legado (redirect) | `/api-docs.html` → `/api/docs` | idem |

Fonte da spec: [`public/openapi.yaml`](../../public/openapi.yaml) · Fluxos de negócio: [`produto/FLUXOS.md`](../produto/FLUXOS.md) §11.

---

## 1. Plano de execução (para você rodar)

### Pré-requisitos

```bash
cp .env.example .env          # opcional — setup cria .env se ausente
npm install                     # postinstall gera Prisma + copia Swagger UI
npm run setup                   # VM nova: schema + seed condicional (idempotente)
```

### Passo 1 — Subir o servidor

```bash
npm run dev
```

Aguarde `Ready` em http://localhost:3000.

### Passo 2 — Abrir o Swagger

No navegador: **http://localhost:3000/api/docs**

Você deve ver o cabeçalho do ServiceOS e a árvore de tags (Auth, Prestador, Interno, PJ, Beneficiário, …).

### Passo 3 — Autenticar (cookie de sessão)

1. No Swagger, expanda **Auth** → `POST /api/auth/login`
2. **Try it out** com um corpo de exemplo:

```json
{
  "email": "dra.helena@bibi.health",
  "password": "bibi123",
  "portal": "prestador"
}
```

3. Execute — resposta `200` define o cookie `bibi_session` (o Swagger usa `withCredentials: true`)
4. Teste `GET /api/auth/me` ou `GET /api/prestador/agenda`

**Outros portais (mesma senha `bibi123`):**

| Portal | `portal` no body | E-mail demo |
|--------|------------------|-------------|
| Prestador | `prestador` | `dra.helena@bibi.health` |
| Interno | `interno` | `faturamento@bibi.health` |
| PJ | `pj` | `rh@techcorp.com` |
| Beneficiário | `beneficiario` | `joao.pereira@email.com` |

### Passo 4 — Validar contrato e testes automatizados

```bash
# Sincroniza paths novos a partir dos Route Handlers
npm run openapi:sync

# Valida YAML, paths e cobertura vs Route Handlers
npm run openapi:verify

# Testes unitários do contrato + assets Swagger
npm run test -- tests/unit/openapi-contract.test.ts

# E2E: página /api/docs, redirect legado, assets self-hosted
npm run test:e2e -- e2e/api-docs.spec.ts

# Pacote completo (lint + docs + openapi + test + build)
npm run pre-release
```

### Passo 5 — Produção (quando publicar)

Após deploy manual (`npx netlify deploy --prod`):

- Swagger: https://sistema-bibi.netlify.app/api/docs
- YAML: https://sistema-bibi.netlify.app/openapi.yaml

> Se o site retornar **503 `usage_exceeded`**, é cota Netlify — não é falha do Swagger. Use dev local.

---

## 2. Arquitetura da documentação

```
public/openapi.yaml          ← contrato (186 paths, v3.0.17)
public/swagger-ui/           ← assets gerados (postinstall, gitignored)
src/app/api/docs/page.tsx    ← URL canônica /api/docs
src/components/api-docs/     ← cliente Swagger UI (CSP-safe)
scripts/verify-openapi.mjs   ← validação CI/pre-release
scripts/copy-swagger-ui.mjs  ← cópia de node_modules/swagger-ui-dist
```

**Por que self-hosted?** O CSP do projeto (`script-src 'self'`) bloqueia CDN externo. Os assets ficam em `/swagger-ui/*` e funcionam em dev e Netlify.

**Redirect legado:** `/api-docs.html` redireciona permanentemente para `/api/docs` (Next.js + HTML estático).

---

## 3. Mapa de testes

| Camada | Arquivo | O que valida |
|--------|---------|--------------|
| Script | `npm run openapi:verify` | YAML válido, ≥115 paths, sem paths órfãos; avisa handlers sem YAML |
| Vitest | `tests/unit/openapi-contract.test.ts` | Metadados, cookie auth, servidores, assets |
| Playwright | `e2e/api-docs.spec.ts` | UI carrega, YAML 200, redirect legado |
| Pre-release | `scripts/pre-release.mjs` | Inclui `openapi:verify` no pipeline |

Credenciais e env de teste: [`TESTES.md`](TESTES.md) · [`VARIAVEIS_AMBIENTE.md`](VARIAVEIS_AMBIENTE.md).

---

## 4. Exemplo com curl (sem Swagger)

```bash
# Login
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dra.helena@bibi.health","password":"bibi123","portal":"prestador"}'

# Agenda
curl -b cookies.txt http://localhost:3000/api/prestador/agenda
```

---

## 5. Manutenção do contrato

Ao criar ou alterar Route Handlers em `src/app/api/**/route.ts`:

1. Rode `npm run openapi:sync` — adiciona paths/métodos ausentes ao YAML
2. Refine manualmente summaries/schemas dos endpoints críticos (Voa, estoque, billing)
3. Rode `npm run openapi:verify` — paths documentados sem handler correspondente **falham**

O sync automático cobre **123 paths** de **163** Route Handlers — **40** ainda sem entrada no YAML (ex.: `clinic-finance/*`, `attachments/*`, `beneficiario/projects/*`). `openapi:verify` lista os primeiros 10 e emite aviso (não falha); paths órfãos no YAML **falham**. Endpoints novos recebem documentação mínima após `openapi:sync`; enriqueça descrições conforme necessário.

### 5.1 Inventário — handlers sem OpenAPI (v3.0.7)

`npm run openapi:verify` lista **40** Route Handlers ainda sem path no YAML (jul/2026). Agrupados por domínio — use as seções deste guia ou o README do segmento até o sync cobrir o módulo:

| Domínio | Paths | Doc canônica |
|---------|-------|--------------|
| Gestão clínica CEDIG | `/api/interno/clinic-finance/*` (6 rotas) | §8 · [`FLUXOS.md`](../produto/FLUXOS.md) §4.2.1 |
| Documentos clínicos | `/api/interno/exam-protocol-templates`, `.../{id}`, `/api/prestador/patients/{id}/exam-protocols`, `.../referrals`, `.../discharge-documents`, `/api/prestador/clinical-guides/export`, `/api/beneficiario/documents`, `/api/beneficiario/clinical-guides/export` | §7 · [`DOCUMENTOS_CLINICOS.md`](../produto/DOCUMENTOS_CLINICOS.md) |
| Obras / Engenharia | `/api/interno/projects/*`, `/api/interno/construction/*`, `/api/pj/projects/*`, `/api/prestador/campo/projects`, `/api/prestador/field-reports/*`, `/api/beneficiario/projects/*` (26 rotas) | [`segmentos/construction/README.md`](../segmentos/construction/README.md) |
| Anexos (upload/download) | `/api/interno/attachments`, `.../download`, `/api/pj/attachments/{id}/download`, `/api/interno/field-reports/attachments/{id}/download`, `/api/prestador/field-reports/attachments/*` | construction README · `src/lib/attachments/` |
| Operação CEDIG | `/api/interno/operation/provision-cedig` | [`clientes/cedig/OPERACAO.md`](../clientes/cedig/OPERACAO.md) |

Lista completa (ordenada):

```text
/api/beneficiario/projects
/api/beneficiario/projects/{id}
/api/beneficiario/projects/attachments/{id}/download
/api/interno/attachments
/api/interno/attachments/{id}/download
/api/interno/clinic-finance/expenses
/api/interno/clinic-finance/export
/api/interno/clinic-finance/kpis
/api/interno/clinic-finance/launches
/api/interno/clinic-finance/meta
/api/interno/construction/finance
/api/interno/construction/goals
/api/interno/construction/pipeline
/api/interno/exam-protocol-templates
/api/interno/exam-protocol-templates/{id}
/api/interno/field-reports/attachments/{id}/download
/api/interno/operation/provision-cedig
/api/interno/projects
/api/interno/projects/meta
/api/interno/projects/{id}
/api/interno/projects/{id}/allocations
/api/interno/projects/{id}/bdi
/api/interno/projects/{id}/budgets
/api/interno/projects/{id}/budgets/{budgetId}/pdf
/api/interno/projects/{id}/cash
/api/interno/projects/{id}/contracts
/api/interno/projects/{id}/environments
/api/interno/projects/{id}/field-reports
/api/interno/projects/{id}/financial-report
/api/interno/projects/{id}/tasks
/api/pj/attachments/{id}/download
/api/pj/projects
/api/pj/projects/{id}
/api/pj/projects/{id}/budgets
/api/pj/projects/{id}/budgets/{budgetId}/pdf
/api/prestador/campo/projects
/api/prestador/field-reports
/api/prestador/field-reports/attachments
/api/prestador/field-reports/attachments/{id}/download
/api/prestador/patients/{id}/exam-protocols
```

Roadmap: testes de contrato de resposta (P1 em [`TESTES.md`](TESTES.md)).

---

## 6. Export TISS (faturamento interno)

Endpoint para download da guia XML simplificada (POC Tier 4). Requer sessão interna com módulo **`billing`**.

| Método | Path | Resposta |
|--------|------|----------|
| `GET` | `/api/interno/invoices/{id}/tiss` | XML `application/xml` ou JSON de erro |

### Códigos HTTP (v3.0.4+)

| HTTP | Corpo | Causa |
|------|-------|-------|
| 200 | XML (`tiss-guia-{id}.xml`) | Fatura com itens e beneficiário com documento |
| 403 | `{ "error": "..." }` | Perfil sem módulo `billing` (ex.: RECEPCAO) |
| 404 | `{ "error": "Fatura não encontrada" }` | ID inexistente ou de outro tenant |
| 422 | `{ "error": "...", "code": "NO_ITEMS" \| "NO_PATIENT_DOCUMENT" }` | Fatura sem procedimentos ou beneficiário sem CPF |

Serviço: `src/lib/tiss-service.ts` (`TissBuildError`, `escapeXml`). Testes: `tests/api/tiss-guide.test.ts`.

### Exemplo curl

```bash
# Login interno (faturamento)
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"faturamento@bibi.health","password":"bibi123","portal":"interno"}'

# Download da guia (substitua INVOICE_ID)
curl -b cookies.txt -o tiss-guia.xml \
  http://localhost:3000/api/interno/invoices/INVOICE_ID/tiss
```

Fluxo completo (emitir fatura → PIX → TISS): [`produto/FLUXOS.md`](../produto/FLUXOS.md) §4.1 · motor de cobrança: [`PAYMENTS.md`](PAYMENTS.md).

---

## 7. Documentos clínicos (prestador + cadastros)

Endpoints do pacote **v3.0.5** para protocolos de exames e prescrições. Requer sessão **prestador** ou **interno** (`cadastros`), conforme a tabela.

| Método | Path | Auth | Função |
|--------|------|------|--------|
| `GET` | `/api/interno/exam-protocol-templates` | `cadastros` | Lista templates de exames (inclui inativos) |
| `POST` | `/api/interno/exam-protocol-templates` | `cadastros` | Cria template (`name`, `exams[]`, `clinicalIndication?`) |
| `PATCH` | `/api/interno/exam-protocol-templates/{id}` | `cadastros` | Edita template ou `active: false` |
| `GET` | `/api/prestador/patients/{id}/exam-protocols` | prestador | Lista templates ativos para aplicar |
| `POST` | `/api/prestador/patients/{id}/exam-protocols` | prestador | Aplica template → N× `ExamOrder` |
| `GET` | `/api/prestador/patients/{id}/medications` | prestador | Lista prescrições do paciente |
| `POST` | `/api/prestador/patients/{id}/medications` | prestador | Nova prescrição (`prescriptionKind`: `COMUM` \| `CONTROLE_ESPECIAL`) |
| `PATCH` | `/api/prestador/medications/{id}` | prestador | Transição de status: `ATIVA` \| `SUSPENSA` \| `ENCERRADA` |
| `GET` | `/api/prestador/patients/{id}/exam-orders` | prestador | Lista pedidos (`?appointmentId=` opcional) |
| `POST` | `/api/prestador/patients/{id}/exam-orders` | prestador | Cria pedido avulso (`examName` ou `procedureId`, `clinicalIndication?`) |
| `PATCH` | `/api/prestador/exam-orders/{id}` | prestador | Atualiza status, laudo (`resultSummary`), `markReviewed` |
| `GET` | `/api/prestador/patients/{id}/prescription-documents` | prestador | Lista receitas multi-item |
| `POST` | `/api/prestador/patients/{id}/prescription-documents` | prestador | Emite receita multi-item |
| `GET` | `/api/prestador/patients/{id}/referrals` | prestador | Lista encaminhamentos |
| `POST` | `/api/prestador/patients/{id}/referrals` | prestador | Emite encaminhamento (templates em `encaminhamento.ts`) |
| `PATCH` | `/api/prestador/referrals/{id}` | prestador | Cancela (`status: CANCELADO`) |
| `GET` | `/api/prestador/patients/{id}/discharge-documents` | prestador | Hub de guias de saída (+ `referralTemplates`) |
| `GET` | `/api/prestador/clinical-guides/export` | prestador | PDF guia (`type=receita\|exame\|encaminhamento\|atestado\|bundle`) |
| `GET` | `/api/beneficiario/documents` | beneficiário | Lista guias disponíveis no painel |
| `GET` | `/api/beneficiario/clinical-guides/export` | beneficiário | PDF da guia (`type` + `id`) |
| `GET` | `/api/prestador/patients/{id}/clinical-overview` | prestador | Visão agregada: medicações ativas, exames pendentes, protocolos |
| `GET` | `/api/prestador/patients/{id}/clinical-profile` | prestador | Perfil clínico estruturado (alergias, condições crônicas) |
| `PUT` | `/api/prestador/patients/{id}/clinical-profile` | prestador | Atualiza perfil clínico |

Variantes **VET** (pet): `/api/prestador/pets/{id}/exam-orders`, `clinical-overview`, `clinical-profile` — mesmo contrato.

### Corpo — aplicar protocolo de exames

```json
{
  "templateId": "tpl_abc123",
  "appointmentId": "apt_optional",
  "clinicalIndication": "Suspeita clínica opcional"
}
```

Resposta `200`: `{ orders: ExamOrder[], templateName: string }`. Erros comuns: `400` (template inativo ou sem exames), `404` (paciente).

### Corpo — prescrever medicamento

Campos obrigatórios: `medication`, `dosage`, `frequency`. Opcionais: `route`, `durationDays`, `quantity`, `notes`, `appointmentId`, `prescriptionKind` (default `COMUM`).

### Corpo — atualizar status da prescrição

```json
{ "status": "SUSPENSA" }
```

Reativar: `{ "status": "ATIVA" }`. Serviço: `src/lib/medication-service.ts` · `src/lib/exam-protocol-service.ts`.

### Corpo — criar pedido de exame avulso

```json
{
  "examName": "Hemograma completo",
  "clinicalIndication": "Controle pós-operatório",
  "appointmentId": "apt_optional",
  "procedureId": "proc_optional"
}
```

Obrigatório: `examName` **ou** `procedureId`. Resposta `200`: `{ examOrder }`.

### Corpo — atualizar pedido de exame (laudo / status)

```json
{
  "status": "LAUDADO",
  "resultSummary": "Resultado dentro da normalidade",
  "markReviewed": true
}
```

Status válidos: `SOLICITADO` · `AGENDADO` · `REALIZADO` · `LAUDADO` · `CANCELADO` (`src/lib/clinical/constants.ts`). Serviço: `src/lib/exam-order-service.ts`.

### Exemplo curl (prestador)

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dra.helena@bibi.health","password":"bibi123","portal":"prestador"}'

# Aplicar protocolo de exames
curl -b cookies.txt -X POST http://localhost:3000/api/prestador/patients/PATIENT_ID/exam-protocols \
  -H "Content-Type: application/json" \
  -d '{"templateId":"TEMPLATE_ID"}'
```

Fluxo de produto e validação manual: [`produto/DOCUMENTOS_CLINICOS.md`](../produto/DOCUMENTOS_CLINICOS.md) · [`produto/FLUXOS.md`](../produto/FLUXOS.md) §4.3.

> **OpenAPI:** paths de `exam-protocol-templates` podem exigir `npm run openapi:sync` após alterações nos Route Handlers. Prescrições já constam em `/api/prestador/medications/*`.

---

## 8. Gestão clínica CEDIG (interno `gestao`)

APIs do módulo **Gestão clínica** (`/interno/gestao` · `ClinicFinanceView`). Visível em nichos `MEDICAL` e `DENTAL`. Leitura: `requireInternoModule("gestao")`; escrita: `requireInternoModuleWrite("gestao")`.

| Método | Path | Função |
|--------|------|--------|
| `GET` | `/api/interno/clinic-finance/meta` | Metadados (médicos, procedimentos, tabelas de preço) |
| `GET` | `/api/interno/clinic-finance/launches` | Lista lançamentos (`year?`, `month?`) |
| `POST` | `/api/interno/clinic-finance/launches` | Registra exame; dispara ponte PPU (`bridgeExamLaunchToOperations`) |
| `GET` | `/api/interno/clinic-finance/expenses` | Lista despesas (`year?`, `month?`) |
| `POST` | `/api/interno/clinic-finance/expenses` | Cria despesa operacional |
| `GET` | `/api/interno/clinic-finance/kpis` | KPIs do período (`year?`, `month?`) |
| `GET` | `/api/interno/clinic-finance/export` | Export tabular (`format`, `year`, `month`) — ver §9 |

### POST `/launches` — campos principais

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|-------|
| `patientName` | string | sim | Nome do paciente |
| `providerId` | string | sim | ID do prestador |
| `procedureId` | string | sim | Tipo de exame |
| `paymentMethod` | string | sim | Ex.: `PIX`, `DINHEIRO` |
| `priceTable` | string | não | Default `PARTICULAR` |
| `amountReceived` | number | sim | Valor recebido |
| `syncOperations` | boolean | não | Default `true` — ponte automática |
| `appointmentId` | string | não | Prefill vindo da agenda |

Resposta `201`: `{ launch, bridgeStatus }` com `bridgeStatus` = `SYNCED` \| `PARTIAL` \| `FAILED` \| `SKIPPED`.

Serviço: `src/lib/clinic-finance/service.ts` · ponte: `src/lib/clinic-finance/bridge.ts`.

### Exemplo curl (tenant CEDIG)

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alana@cedig.demo","password":"bibi123","portal":"interno","tenant":"cedig"}'

curl -b cookies.txt http://localhost:3000/api/interno/clinic-finance/meta

curl -b cookies.txt -X POST http://localhost:3000/api/interno/clinic-finance/launches \
  -H "Content-Type: application/json" \
  -d '{"patientName":"Teste API","providerId":"PROVIDER_ID","procedureId":"PROC_ID","paymentMethod":"PIX","amountReceived":750}'
```

Fluxo de produto: [`produto/FLUXOS.md`](../produto/FLUXOS.md) §4.2.1 · piloto: [`clientes/cedig/STATUS.md`](../clientes/cedig/STATUS.md) · E2E: `e2e/cedig-gestao.spec.ts`.

> **OpenAPI:** rotas `clinic-finance/*` ainda não constam no YAML — use este §8 + `FLUXOS.md` até `openapi:sync` cobrir o módulo.

---

## 9. Exportações tabulares (v3.0.7)

Relatórios e listagens usam o parâmetro de query **`format`** nos endpoints de export. A UI monta links via `ExportButtons` (`src/components/ExportButtons.tsx`).

### Formatos suportados

| `format` | MIME | Uso típico |
|----------|------|------------|
| `csv` | `text/csv; charset=utf-8` | Planilhas, ERP (BOM UTF-8) |
| `json` | `application/json` | Integração, dataset canônico |
| `txt` | `text/plain` | Leitura humana — tabela pipe-delimited (`buildTxtFromTabular` em `exports/text.ts`) |
| `pdf` | `application/pdf` | Impressão / arquivo |
| `xlsx` | Excel OpenXML | Listagens internas (`LIST_EXPORT_FORMATS`) |

Constantes: `src/lib/exports/format.ts` · servidor: `serveTabularExport()` em `src/lib/exports/serve.ts`.

### Endpoints principais

| Método | Path | Auth | Query |
|--------|------|------|-------|
| `GET` | `/api/pj/reports` | PJ | `format` (default `csv`) |
| `GET` | `/api/interno/reports` | interno `relatorios` | `type=billing\|crm`, `format` |
| `GET` | `/api/interno/billing/export` | interno `billing` | `format` |
| `GET` | `/api/interno/audit/export` | interno `auditoria` | `format` + filtros da tela |
| `GET` | `/api/interno/clinic-finance/export` | interno `gestao` | `format`, `year`, `month` |
| `GET` | `/api/prestador/extrato/export` | prestador | `format` |
| `GET` | `/api/beneficiario/export` | beneficiário | `section`, `format` |

Resposta: arquivo em anexo (`Content-Disposition: attachment`) ou JSON estruturado.

### Exemplo curl (PJ)

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rh@techcorp.com","password":"bibi123","portal":"pj"}'

curl -b cookies.txt -o relatorio.pdf \
  "http://localhost:3000/api/pj/reports?format=pdf"
```

Fluxo completo por portal: [`produto/FLUXOS.md`](../produto/FLUXOS.md) §4.11 · testes: `tests/api/exports.test.ts`.

---

## 10. Referências

- [`ARQUITETURA.md`](ARQUITETURA.md) §20 — visão geral da API
- [`FLUXOS.md`](../produto/FLUXOS.md) §11 — mapa de APIs por portal
- [`RELEASES.md`](../versoes/RELEASES.md) — versão em produção
- Landing: botão **Ver API (Swagger)** → `/api/docs`
