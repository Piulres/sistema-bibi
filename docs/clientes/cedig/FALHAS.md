# Falhas mapeadas — CEDIG (piloto)

Fonte: homologação browser 2026-07-25 · [`HISTORICO_VALIDACAO.md`](HISTORICO_VALIDACAO.md).

| ID | Severidade | Falha | Status |
|----|------------|-------|--------|
| P1-a | Alta | Prestador “Pacientes” vazio apesar de pacientes / lançamentos | ✅ API + seed histórico |
| P1-b | Alta | Labels “Consulta” no prestador (CEDIG = Exame) | ✅ `useLabels()` agenda/dashboard/pacientes |
| P2-a | Média | Médicos duplicados no select (aliases seed) | ✅ aliases demoted + dedupe |
| P2-b | Média | Lançamento sem `patientId` | ✅ select + resolve por nome |
| P2-c | Média | Massa greenfield (4 portais “ocos”) | ✅ agenda + 4 launches + 2 despesas |
| P3-a | Baixa | Tours micro após dismiss do tour principal | ✅ skip auto micros |
| P3-b | Baixa | Interno Agenda “Consulta” hardcoded | ✅ `labels.appointment` |
| S2 | Baixa | Tabela Dr Saúde sem empresa no seed | ✅ empresa no catálogo |
| P1-c | Alta | Walk-in “não funciona” / some da agenda | ✅ causa: modo **demo** na Netlify (Lambda `/tmp`); uso exige **modo operação** + aviso na agenda |

Backlog (não nesta leva): export Excel · lançamento → fatura PPU · E2E Playwright · Beneficiário “Consulta” residual em `BeneficiarioView`.
