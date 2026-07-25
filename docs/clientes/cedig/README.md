# Cliente: CEDIG Cruzeiro

**Tenant piloto** do ServiceOS em operação real — Centro de Endoscopia e Diagnóstico (Cruzeiro/SP).

| Campo | Valor |
|-------|-------|
| **Site** | [cedigcruzeiro.com.br](https://www.cedigcruzeiro.com.br) |
| **Segmento** | `MEDICAL` (endoscopia digestiva) |
| **Slug sugerido** | `cedig` |
| **Contato público** | (12) 3199-7871 · WhatsApp |
| **Foco clínico** | Endoscopia · Colonoscopia |
| **Não confundir** | Clínica CEDIG de São Paulo (Vila Mariana/Tucuruvi) é outra rede |

---

## O que o dono pediu (síntese)

Substituir a planilha por gestão profissional, **simples para a secretária** e útil para decisão:

1. **Uma aba de lançamentos** — 1 linha por paciente (paciente, médico, tipo de exame, pagamento, valor, biópsias, polipectomias, mucosectomias, clips).
2. **Uma aba de despesas** — laboratório, anestesista, Bruno, Luiza, insumos, medicamentos, taxas de cartão, outras.
3. **Indicadores automáticos** — receita, despesas, lucro operacional, exames por tipo, produção por médico, frascos para lab, ticket médio, lucro por exame.

A secretária **não faz contas** — só lança; o sistema calcula.

---

## O que o ServiceOS já tinha vs o pedido

| Necessidade CEDIG | Antes | Agora (módulo Gestão clínica) |
|-------------------|-------|-------------------------------|
| Faturamento / receita | ✅ Pay Per Use + faturas | Mantido |
| Lançamento 1 paciente/exame com contadores | ❌ | ✅ `ClinicExamLaunch` |
| Despesas mensais (opex) | ❌ (só obras/construction) | ✅ `ClinicExpense` |
| KPIs lucro / ticket / produção | ❌ | ✅ `/interno/gestao` |
| Catálogo endoscopia | ❌ seed genérico | ✅ procedimentos CEDIG |
| Dual-store operação | ✅ | Usar modo **operação** |

---

## Como usar no piloto

1. Produção em **modo operação** — `/interno/seguranca` → `OPERAR` ([`OPERACAO_DADOS.md`](../../plataforma/OPERACAO_DADOS.md)).
2. White label CEDIG — `/interno/branding` (nome, cores, logo).
3. Cadastro de médicos (Bruno, Luiza, etc.) em Cadastros → Prestadores.
4. Secretária: `/interno/gestao` → aba **Lançamentos**.
5. Admin/financeiro: aba **Despesas** + **Indicadores**.

Credenciais iniciais: as do bootstrap de operação (ou usuários criados no tenant CEDIG).

---

## Roadmap do piloto

| Fase | Entrega | Status |
|------|---------|--------|
| **A** | Módulo Gestão clínica (lançamentos + despesas + KPIs) | Em implementação |
| **B** | Tenant CEDIG (branding, labels “Exame”, catálogo) em operação | Em implementação |
| **C** | Homologação com secretária (UX + exemplos) | Pendente humano |
| **D** | Integração opcional lançamento → fatura PPU / estoque kits | Backlog |
| **E** | Export Excel mensal (compatível com hábito da planilha) | Backlog |

---

## Referências de código

- Constantes: `src/lib/clinic-finance/constants.ts`
- Serviço: `src/lib/clinic-finance/service.ts`
- UI: `src/components/ClinicFinanceView.tsx`
- API: `/api/interno/clinic-finance/*`
- Catálogo seed: `prisma/seed-data/cedig-catalog.ts`
