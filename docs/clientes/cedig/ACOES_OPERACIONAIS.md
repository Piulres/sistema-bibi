# CEDIG — Ações operacionais consolidadas

Playbook único do piloto CEDIG Cruzeiro: o que fazer no dia a dia, o que já foi validado e como reproduzir a massa de mapeamento.

Complementa [`README.md`](README.md) · [`ROTEIRO_HOMOLOGACAO.md`](ROTEIRO_HOMOLOGACAO.md) · [`FASE_2.md`](FASE_2.md) · [`HISTORICO_VALIDACAO.md`](HISTORICO_VALIDACAO.md).

> **Tenant:** `/?tenant=cedig` · **Store:** modo **operação** · **Senha:** `bibi123`  
> **Produção:** ServiceOS **v3.0.0** · https://sistema-bibi.netlify.app

---

## 1. Contas (quem faz o quê)

| Papel | Conta | Portal | Ações principais |
|-------|-------|--------|------------------|
| Secretária | `alana@cedig.demo` | `/interno/login` | Agenda, walk-in, gestão (lançamentos), cadastros leves |
| ADMIN CEDIG | `operacao@cedig.demo` | `/interno/login` | Usuários, branding, despesas, indicadores, segurança |
| Médico | `bruno.dias@cedig.demo` | `/login` | Fila do dia, atendimento, extrato |
| PJ CentralMed | `rh@centralmed.demo` | `/pj/login` | Consumo PPU, beneficiários, faturas |
| Beneficiário | `maria.cedig@email.com` | `/beneficiario/login` | Exames, agenda, faturas |

---

## 2. Playbook diário (produção)

### Manhã — Alana
1. `/?tenant=cedig` → `/interno/login`
2. **Agenda** (`/interno/agenda`) — conferir exames do dia; confirmar chegadas
3. **Walk-in** — paciente particular sem hora: preencher formulário no topo da agenda
4. Durante/após exames → **Gestão clínica** (`/interno/gestao`) → aba **Lançamentos**
   - Paciente · médico · tabela · exame · biópsias/polipectomias/clips
   - Valor sugerido automático → Registrar (ponte deve ficar **SYNCED**)

### Financeiro — ADMIN / Alana
5. Aba **Despesas** — lab, pessoal, insumos, cartão
6. Aba **Indicadores** — receita, despesas, lucro, produção por médico, frascos

### Médico — Bruno (ou outro)
7. `/login?tenant=cedig` → fila do dia + extrato (valores da ponte)

### Empresa / paciente (sob demanda)
8. PJ: `/pj/login?tenant=cedig` — consumo e faturas
9. Beneficiário: `/beneficiario/login?tenant=cedig` — **Exames** (labels CEDIG)

---

## 3. Fluxo ponta a ponta (invariante)

```text
Agenda / walk-in / lançamento na gestão
  → ClinicExamLaunch (SYNCED)
  → Appointment REALIZADO + ProcedureUsage + Invoice/Payment
  → Prestador (fila + extrato)
  → PJ (consumo + fatura convênio)
  → Beneficiário (Exames + faturas)
  → Dashboard / Indicadores (KPIs do mês)
```

Código: `src/lib/clinic-finance/bridge.ts`.

---

## 4. Ações já executadas (rodada 2026-07-26)

Ambiente local · `operation.db` · evidências em `/opt/cursor/artifacts/cedig-mapeamento/`.

| # | Ação | Resultado |
|---|------|-----------|
| 1 | Bootstrap dual-store + enrich CEDIG (`portalMass`) | 3 pacientes · 3 PJ · 5 médicos · 5 exames |
| 2 | Agendar exames da semana (27/07–01/08) | **21** `AGENDADO` |
| 3 | Walk-ins | **4** (Carlos, Helena, Roberto, Lucia) |
| 4 | Lançamentos homologação C1–C4 | **4 SYNCED** (R$ 900 / 1.250 / 3.200 / 450) |
| 5 | Despesas | lab R$ 300 + equipe R$ 500 |
| 6 | Navegar portal Interno (Alana) | Dashboard · agenda · gestão 3 abas |
| 7 | Navegar portal Prestador (Bruno) | Fila + extrato R$ 2.150 |
| 8 | Navegar portal PJ (CentralMed) | Consumo R$ 2.550 · faturas R$ 1.650 |
| 9 | Navegar portal Beneficiário (Maria) | Labels **Exame** · faturas |
| 10 | Conferir KPIs mês 07/2026 | Receita 11.750 · despesas 1.600 · lucro 10.150 |

### Distribuição da agenda (API)

| Dia | Exames |
|-----|--------|
| 26/07 | 8 |
| 27/07 | 5 |
| 28/07 | 4 (+ walk-in Lucia) |
| 29/07 | 4 |
| 30/07 | 3 |
| 31/07 | 4 |
| 01/08 | 3 |

Bugs bloqueantes: **nenhum**.

---

## 5. Reproduzir a massa (dev local)

```bash
npm run db:bootstrap:demo
echo operation > prisma/.data-store-mode
NEXT_PUBLIC_DISABLE_ONBOARDING_AUTO=true npm run dev
# outro terminal (com o server no ar):
./scripts/cedig-mapear.sh
```

| Script | Função |
|--------|--------|
| `scripts/cedig-mapear.sh` | Atalho: enrich + week-mapping |
| `scripts/cedig-enrich-operation.ts` | Pacientes, PJ e histórico CEDIG na `operation.db` |
| `scripts/cedig-week-mapping.mjs` | Semana + walk-ins + lançamentos + despesas via API |
| `scripts/cedig-golive-smoke.sh` | Smoke contra produção (v3.0.0) |

---

## 6. Checklist rápido de aceite (15 min)

- [ ] Modo **operação** ativo
- [ ] Alana lança 1 exame com valor sugerido (sem calcular à mão)
- [ ] Coluna Ponte = **SYNCED**
- [ ] Walk-in aparece na agenda após F5
- [ ] Bruno vê o exame no extrato/fila
- [ ] CentralMed vê consumo se tabela = CentralMed
- [ ] Maria vê **Exame** (não “Consulta” genérica fora do glossário)

Detalhe de preços: [`ROTEIRO_HOMOLOGACAO.md`](ROTEIRO_HOMOLOGACAO.md).  
Go-live produção: [`GO_LIVE_CHECKLIST.md`](GO_LIVE_CHECKLIST.md).
