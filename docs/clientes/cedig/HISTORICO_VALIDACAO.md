# Histórico de validação — CEDIG Cruzeiro

Registro das rodadas de homologação assistida (browser + massa) do piloto CEDIG no ServiceOS.

Complementa [`ROTEIRO_HOMOLOGACAO.md`](ROTEIRO_HOMOLOGACAO.md) · [`README.md`](README.md) · [`MASSA_TESTES.md`](../../plataforma/MASSA_TESTES.md).

---

## Massa CEDIG (seed)

| Entidade | Quantidade / contas |
|----------|---------------------|
| Tenant | `cedig` · MEDICAL · branding CEDIG Cruzeiro |
| Procedimentos | 5 (Endo, Colo, Endo+Colo, Mucosectomia, Teste respiratório) |
| Interno | `operacao@cedig.demo` (ADMIN) · `alana@cedig.demo` / `recepcao@cedig.demo` · João Marcos · Márcia |
| Prestadores | Alexandre Marçal · Luiza Lage · Bruno Dias · Luiza Zeraik · Fernanda Auto (+ aliases) |
| Empresas PJ | CentralMed · Bem Saúde |
| PJ | `rh@centralmed.demo` |
| Pacientes / Beneficiários | Maria Silva · José Santos · Ana Particular (`*.cedig@email.com`) |
| Senha demo | `bibi123` |

---

## Rodadas

### 2026-07-25 — Gestão clínica (financeiro)

| Item | Resultado |
|------|-----------|
| Ambiente | `localhost:3000` · demo.db · `/?tenant=cedig` |
| Login | `alana@cedig.demo` |
| Escopo | `/interno/gestao` — lançamentos, despesas, KPIs |
| C1–C4 preços | ✅ 900 / 1250 / 3200 / 450 |
| Despesas | ✅ lab + equipe |
| Bug corrigido | `getPrisma()` em `clinic-finance/service.ts` |
| Evidências | `/opt/cursor/artifacts/cedig-homologacao/` |

### 2026-07-25 — Quatro portais + cadastros (esta rodada)

| Portal | Login | Escopo verificado | Resultado |
|--------|-------|-------------------|-----------|
| Interno ADMIN | `operacao@cedig.demo` | Nav, Dashboard, Cadastros (abas), Gestão, Branding, labels Exame | _(preencher)_ |
| Interno RECEPCAO | `alana@cedig.demo` | Gestão + Agenda + Cadastros (RBAC) | _(preencher)_ |
| Prestador | `bruno.dias@cedig.demo` | Início, Agenda, Pacientes, Extrato, Relatórios | _(preencher)_ |
| PJ | `rh@centralmed.demo` | Resumo, Beneficiários, Assinaturas, Faturas | _(preencher)_ |
| Beneficiário | `maria.cedig@email.com` | Abas (Agendar… Histórico), labels | _(preencher)_ |

**UX / UI / conteúdo (checklist):**

- [ ] Branding CEDIG visível (nome / cores)
- [ ] Labels “Exame” (não “Consulta”) no contexto MEDICAL CEDIG
- [ ] Cadastros: Beneficiários, Empresas, Exames, Usuários populados
- [ ] Gestão clínica acessível e operacional
- [ ] Portais PJ e Beneficiário com massa mínima (não tela vazia sem login)
- [ ] Sem erros de build / 500 nas rotas principais

---

## Avaliação de prontidão para o cliente

_(Atualizado após a rodada dos 4 portais.)_

| Dimensão | Status | Nota |
|----------|--------|------|
| Pedido do dono (planilha → gestão) | ✅ Pronto em código | Core do piloto |
| Tabelas de preço + equipe | ✅ | Particular / CentralMed / etc. |
| Homologação secretária (Alana) | 🟡 Parcial | Browser OK; falta validação humana in loco |
| 4 portais com massa CEDIG | 🟡 Em validação | Seed expandido nesta rodada |
| Produção / white-label final | ⏳ | Merge PR #169 + deploy + modo operação |
| Export Excel / PPU automático | ❌ Backlog | Não bloqueia piloto de gestão |

**Veredito provisório:** ver seção final após execução browser.
