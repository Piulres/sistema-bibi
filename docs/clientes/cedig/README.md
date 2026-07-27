# Cliente: CEDIG Cruzeiro

**Tenant piloto** do ServiceOS — Centro de Endoscopia e Diagnóstico (Cruzeiro/SP).

| Campo | Valor |
|-------|-------|
| **Site** | [cedigcruzeiro.com.br](https://www.cedigcruzeiro.com.br) |
| **Segmento** | `MEDICAL` · labels UI **Exame** |
| **Slug** | `cedig` (`/?tenant=cedig`) |
| **Produção** | **v3.0.16** @ https://sistema-bibi.netlify.app · modo **operação** |
| **Contato** | (12) 3199-7871 · WhatsApp |
| **Foco** | Endoscopia · Colonoscopia · Teste respiratório |
| **Não confundir** | CEDIG São Paulo (Vila Mariana/Tucuruvi) é outra rede |

### Documentação viva (usar estes)

| Doc | Papel |
|-----|-------|
| [`STATUS.md`](STATUS.md) | **Status + timeline** — atualizar em toda entrega |
| [`OPERACAO.md`](OPERACAO.md) | Playbook diário (Alana / médicos / PJ) |
| [`HOMOLOGACAO.md`](HOMOLOGACAO.md) | Checklist de preços C1–C4 |

---

## Equipe e credenciais

| Papel | Nome / conta | Senha |
|-------|----------------|-------|
| Secretária | Alana · `alana@cedig.demo` | `bibi123` |
| ADMIN | `operacao@cedig.demo` | `bibi123` |
| Enfermagem | `joao.marcos@cedig.demo` · `marcia@cedig.demo` | `bibi123` |
| Médicos | `alexandre.marcal` · `luiza.lage` · `bruno.dias` · `luiza.zeraik` · `fernanda.auto` `@cedig.demo` | `bibi123` |
| PJ | `rh@centralmed.demo` · `rh@bemsaude.demo` · `rh@drsaude.demo` | `bibi123` |
| Beneficiário | `maria.cedig@email.com` | `bibi123` |

- Provisionar produção: `POST /api/interno/operation/provision-cedig` + `{ "confirm": "CEDIG" }`
- Criar usuários: só ADMIN (`operacao@cedig.demo`)
- Prestador: `/login?tenant=cedig` — **não** `/interno/login`

---

## Pedido do cliente

Substituir a planilha por gestão simples para a secretária:

1. **Lançamentos** — 1 linha/paciente (exame, tabela, pagamento, biópsias, polipectomias, clips…)
2. **Despesas** — lab, equipe, insumos, cartão…
3. **Indicadores** — receita, lucro, produção, frascos, ticket

A secretária **não faz contas** — valor sugerido + KPIs automáticos.

---

## Tabelas de preço

Motor: `src/lib/clinic-finance/cedig-pricing.ts`.

| Exame | Particular | CentralMed |
|-------|------------|------------|
| Endoscopia Digestiva Alta | R$ 750 | R$ 650 |
| Colonoscopia | R$ 1.450 | R$ 1.250 |
| Endoscopia + Colonoscopia | R$ 2.000 | R$ 1.900 |
| Mucosectomia | a partir de R$ 3.200 | a partir de R$ 3.100 |
| Teste respiratório | R$ 500 | R$ 400 (Bem/Dr Saúde: R$ 450) |
| Biópsia (frasco) | R$ 150 | R$ 150 |
| Clip hemostático | R$ 900 | R$ 800 |

Polipectomias: Simples 550 · Intermediária 850/800 · Avançada 1200/1150 · Complexa 1600/1400 (Particular/CentralMed).

---

## Código

- Preço: `src/lib/clinic-finance/cedig-pricing.ts`
- Ponte PPU: `src/lib/clinic-finance/bridge.ts`
- UI: `src/components/ClinicFinanceView.tsx`
- API: `/api/interno/clinic-finance/*`
- Seed: `prisma/seed-data/cedig-catalog.ts`
- Store: `cedig` ∈ `OPERATION_TENANT_SLUGS`
