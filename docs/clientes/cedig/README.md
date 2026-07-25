# Cliente: CEDIG Cruzeiro

**Tenant piloto** do ServiceOS em operação real — Centro de Endoscopia e Diagnóstico (Cruzeiro/SP).

| Campo | Valor |
|-------|-------|
| **Site** | [cedigcruzeiro.com.br](https://www.cedigcruzeiro.com.br) |
| **Segmento** | `MEDICAL` (endoscopia digestiva) |
| **Slug sugerido** | `cedig` |
| **Contato público** | (12) 3199-7871 · WhatsApp |
| **Foco clínico** | Endoscopia · Colonoscopia · Teste respiratório |
| **Não confundir** | Clínica CEDIG de São Paulo (Vila Mariana/Tucuruvi) é outra rede |

---

## Equipe (operação)

| Papel | Nome |
|-------|------|
| Secretária | Alana |
| Enfermeiro | João Marcos |
| Téc. enfermagem | Márcia |
| Médicos | Alexandre Marçal · Luiza Lage · Bruno Dias · Luiza Zeraik · Fernanda Auto |

Credenciais (`/?tenant=cedig`, senha `bibi123`) — massa demo e bootstrap de **operação**:

- `alana@cedig.demo` / `recepcao@cedig.demo` — secretária
- `joao.marcos@cedig.demo` · `marcia@cedig.demo`
- `alexandre.marcal@cedig.demo` · `luiza.lage@cedig.demo` · `bruno.dias@cedig.demo` · `luiza.zeraik@cedig.demo` · `fernanda.auto@cedig.demo`
- `operacao@cedig.demo` — ADMIN

Em produção (modo operação): provisionar com `POST /api/interno/operation/provision-cedig` + `{ "confirm": "CEDIG" }` se o tenant ainda não existir na base Blobs.

**Criar usuários** (Cadastros → Usuários): somente ADMIN — `operacao@cedig.demo`. A conta Alana (`RECEPCAO`) lista usuários, mas não cria/edita (RBAC).

**Login do prestador criado:** `/login?tenant=cedig` (Portal Prestador) · e-mail/senha do cadastro — senha padrão sugerida `bibi123`. Não usar `/interno/login`.

---

## Tabelas de preço

Fonte: tabelas institucionais do cliente. Motor: `src/lib/clinic-finance/cedig-pricing.ts`.

### Exames diagnósticos

| Exame | Particular | CentralMed |
|-------|------------|------------|
| Endoscopia Digestiva Alta | R$ 750 | R$ 650 |
| Colonoscopia | R$ 1.450 | R$ 1.250 |
| Endoscopia + Colonoscopia | R$ 2.000 | R$ 1.900 |

### Teste respiratório

| Tabela | Valor |
|--------|-------|
| Particular | R$ 500 |
| Bem Saúde / Dr Saúde | R$ 450 |
| CentralMed | R$ 400 |

### Biópsias

R$ 150 por frasco (todas as tabelas).

### Polipectomias

| Faixa | Particular | CentralMed |
|-------|------------|------------|
| Simples ≤ 5 mm | R$ 550 | R$ 550 |
| Intermediária 5–10 mm | R$ 850 | R$ 800 |
| Avançada 10–15 mm | R$ 1.200 | R$ 1.150 |
| Complexa 15–20 mm | R$ 1.600 | R$ 1.400 |

### Mucosectomia (colonoscopia terapêutica)

- Particular: a partir de R$ 3.200  
- CentralMed: a partir de R$ 3.100  
- Inclui agulha injetora, solução para lifting e 1 alça padrão

### Clips / OPME

| Item | Particular | CentralMed |
|------|------------|------------|
| Clip hemostático | R$ 900 | R$ 800 |

Materiais especiais podem ser cobrados à parte (campo observações no lançamento).

**Bem Saúde / Dr Saúde:** preço próprio só no teste respiratório; demais itens usam Particular no cálculo sugerido.

---

## O que o dono pediu (síntese)

Substituir a planilha por gestão profissional, **simples para a secretária** e útil para decisão:

1. **Uma aba de lançamentos** — 1 linha por paciente (paciente, médico, tipo de exame, tabela, pagamento, valor, biópsias, polipectomias, mucosectomias, clips).
2. **Uma aba de despesas** — laboratório, anestesista, equipe, insumos, medicamentos, taxas de cartão, outras.
3. **Indicadores automáticos** — receita, despesas, lucro operacional, exames por tipo, produção por médico, frascos para lab, ticket médio, lucro por exame.

A secretária **não faz contas** — menus prontos + valor sugerido; o sistema calcula os indicadores.

---

## Como usar no piloto

1. Produção em **modo operação** — `/interno/seguranca` → `OPERAR` ([`OPERACAO_DADOS.md`](../../plataforma/OPERACAO_DADOS.md)).
2. White label CEDIG — `/interno/branding`.
3. Secretária Alana: `/interno/gestao` → aba **Lançamentos** (escolhe tabela Particular/CentralMed/…; valor sugere sozinho).
4. Admin/financeiro: aba **Despesas** + **Indicadores**.

| Portal | Login | Senha |
|--------|-------|-------|
| Interno ADMIN | `operacao@cedig.demo` | `bibi123` |
| Secretária | `alana@cedig.demo` | `bibi123` |
| Prestador | `bruno.dias@cedig.demo` | `bibi123` |
| PJ CentralMed | `rh@centralmed.demo` | `bibi123` |
| Beneficiário | `maria.cedig@email.com` | `bibi123` |

---

## Roadmap do piloto

| Fase | Entrega | Status |
|------|---------|--------|
| **A** | Módulo Gestão clínica (lançamentos + despesas + KPIs) | ✅ |
| **B** | Tenant CEDIG (branding, labels, catálogo, equipe, tabelas) | ✅ seed `/?tenant=cedig` |
| **C** | Homologação browser 4 portais + gestão | ✅ assistida 2026-07-25 · falta humano in loco |
| **D** | Integração opcional lançamento → fatura PPU / estoque kits | Backlog |
| **E** | Export Excel mensal (compatível com hábito da planilha) | Backlog |

Histórico: [`HISTORICO_VALIDACAO.md`](HISTORICO_VALIDACAO.md) · Roteiro: [`ROTEIRO_HOMOLOGACAO.md`](ROTEIRO_HOMOLOGACAO.md) · Falhas: [`FALHAS.md`](FALHAS.md) · Go-live: [`GO_LIVE_CHECKLIST.md`](GO_LIVE_CHECKLIST.md) · Smoke produção: `bash scripts/cedig-golive-smoke.sh`.

---

## Referências de código

- Tabelas de preço: `src/lib/clinic-finance/cedig-pricing.ts`
- Constantes: `src/lib/clinic-finance/constants.ts`
- Serviço: `src/lib/clinic-finance/service.ts`
- UI: `src/components/ClinicFinanceView.tsx`
- API: `/api/interno/clinic-finance/*`
- Catálogo / equipe seed: `prisma/seed-data/cedig-catalog.ts`
