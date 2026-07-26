# Roteiro de homologação — CEDIG `/interno/gestao`

Complementa [`README.md`](README.md) · playbook [`ACOES_OPERACIONAIS.md`](ACOES_OPERACIONAIS.md).  
Massa geral: [`docs/plataforma/MASSA_TESTES.md`](../../plataforma/MASSA_TESTES.md). Estratégia: [`docs/plataforma/TESTES.md`](../../plataforma/TESTES.md).

> **Nota:** checklist assistido (browser / secretária Alana). Falhas mapeadas: [`FALHAS.md`](FALHAS.md).  
> Tours: ao pular o tour principal, os micro-tours do portal não abrem mais. Em demos: `NEXT_PUBLIC_DISABLE_ONBOARDING_AUTO=true`.  
> **`?tenant=cedig` usa store operation** — não basta só `db:seed` na `dev.db`.

---

## Pré-condições

```bash
# Recomendado (dual-store + CEDIG na operation.db)
npm run db:bootstrap:demo
echo operation > prisma/.data-store-mode
DATABASE_URL="file:./operation.db" DUAL_DATA_STORE=false npx tsx scripts/cedig-enrich-operation.ts
NEXT_PUBLIC_DISABLE_ONBOARDING_AUTO=true npm run dev   # http://localhost:3000

# Atalho: enrich + semana + C1–C4 via API
# ./scripts/cedig-mapear.sh
```

| Item | Valor |
|------|-------|
| Tenant | `/?tenant=cedig` |
| Store | **operation** (`prisma/operation.db`) |
| Login | `alana@cedig.demo` / `bibi123` |
| Alternativa | `recepcao@cedig.demo` / `bibi123` |
| Tela | `/interno/gestao` |

---

## Massa usada neste roteiro

| Papel | Conta |
|-------|-------|
| Secretária | Alana (`alana@cedig.demo`) |
| Médicos (select) | Alexandre Marçal · Luiza Lage · Bruno Dias · Luiza Zeraik · Fernanda Auto |
| Exames | Endoscopia · Colonoscopia · Endo+Colo · Mucosectomia · Teste respiratório |
| Tabelas | Particular · CentralMed · Bem Saúde · Dr Saúde |

---

## Ações (checklist)

### A — Contexto tenant
1. Abrir `http://localhost:3000/?tenant=cedig`
2. Confirmar branding / segmento CEDIG (cookie `bibi_segment`)

### B — Login secretária
3. Ir a `/interno/login`
4. Entrar com `alana@cedig.demo` / `bibi123`
5. Dispensar onboarding tour se aparecer
6. Confirmar nav com **Gestão clínica**

### C — Lançamentos (aba 1)
7. Abrir `/interno/gestao` → aba **Lançamentos**
8. **Caso C1 — Particular / Endoscopia + 1 biópsia**
   - Paciente: `Maria Teste Homolog`
   - Médico: Dr. Bruno Dias
   - Tabela: Particular
   - Exame: Endoscopia Digestiva Alta
   - Biópsias: 1
   - Esperado sugestão: **R$ 900** (750 + 150)
   - Registrar e ver na tabela
9. **Caso C2 — CentralMed / Colonoscopia**
   - Paciente: `José CentralMed`
   - Médico: Dra. Luiza Lage
   - Tabela: CentralMed
   - Exame: Colonoscopia
   - Esperado: **R$ 1.250**
   - Registrar
10. **Caso C3 — Particular / Colo + polipectomia intermediária + clip**
    - Paciente: `Ana Polipectomia`
    - Médico: Dr. Alexandre Marçal
    - Tabela: Particular
    - Exame: Colonoscopia
    - Polipectomia: Intermediária × 1
    - Clips: 1
    - Esperado: **R$ 3.200** (1450 + 850 + 900)
    - Registrar
11. **Caso C4 — Teste respiratório / Bem Saúde**
    - Paciente: `Pedro Respiratório`
    - Tabela: Bem Saúde
    - Exame: Teste respiratório
    - Esperado: **R$ 450**
    - Registrar

### D — Despesas (aba 2)
12. Aba **Despesas**
13. Lançar: categoria Laboratório · descrição `Lab biópsias — homolog` · valor `300`
14. Lançar: categoria Pessoal · descrição `Pagamento equipe — homolog` · valor `500`
15. Confirmar lista com os dois itens

### E — Indicadores (aba 3)
16. Aba **Indicadores**
17. Conferir: receita do mês > 0 · despesas ≥ 800 · lucro = receita − despesas
18. Conferir: exames por tipo · produção por médico · frascos (lab) ≥ 1 · ticket médio

### F — Encerramento
19. Capturar evidências (screenshot / vídeo)
20. Logout (opcional)

---

## Critérios de aceite

- [ ] Secretária não precisa calcular à mão (sugestão preenche valor)
- [ ] Menus de médico, exame, tabela e polipectomia preenchidos
- [ ] 4 lançamentos + 2 despesas visíveis no mês corrente
- [ ] KPIs batem com os lançamentos
- [ ] Labels “Exame” (não “Consulta”) no contexto MEDICAL CEDIG

---

## Resultado das execuções assistidas

### 2026-07-25 — gestão (gestão clínica)

| Campo | Valor |
|-------|-------|
| Ambiente | local · tenant `cedig` · `alana@cedig.demo` |
| Resultado | ✅ **OK** — C1–C4, D1–D2 e KPIs |
| Fix na sessão | `getPrisma()` em `clinic-finance/service.ts` |
| Evidências | `/opt/cursor/artifacts/cedig-homologacao/` |

### 2026-07-26 — C1–C4 + 4 portais (modo operation)

| Campo | Valor |
|-------|-------|
| Ambiente | local · **operation.db** · `/?tenant=cedig` |
| Resultado | ✅ **OK** — C1–C4 SYNCED · despesas · KPIs · Interno/Prestador/PJ/Beneficiário |
| Massa extra | 21 exames na semana · 4 walk-ins |
| Evidências | `/opt/cursor/artifacts/cedig-mapeamento/` |
| Detalhe | [`ACOES_OPERACIONAIS.md`](ACOES_OPERACIONAIS.md) §4 |

### Valores observados vs esperados

| Caso | Esperado | Observado |
|------|----------|-----------|
| C1 Endoscopia Particular + 1 biópsia | R$ 900 | R$ 900 |
| C2 Colonoscopia CentralMed | R$ 1.250 | R$ 1.250 |
| C3 Colo + polipectomia intermediária + clip | R$ 3.200 | R$ 3.200 |
| C4 Teste respiratório Bem Saúde | R$ 450 | R$ 450 |
| D Lab + Pessoal | R$ 300 + R$ 500 | OK |

Bugs UX: nenhum nas execuções.
