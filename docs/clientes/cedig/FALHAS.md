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
| P1-d | Alta | Modo operação rebaixado ao abrir `/segmentos` | ✅ `ensureDataStoreForSegmentAccess` não faz operation→demo automático |
| P2-d | Média | “Criar usuário” falha na recepção (Alana) | ✅ esperado RBAC ADMIN; UI esconde formulário + aviso (`operacao@cedig.demo`) |
| P1-e | Alta | Prestador criado some / login falha | ✅ flush Blob imediato + sync entre Lambdas; login exige `/login?tenant=cedig` (mensagem corrigida) |

Backlog fase 2/F (v2.6): ✅ export Excel · ✅ lançamento → PPU · ✅ E2E `cedig-gestao` · ✅ Beneficiário labels Exame · ✅ PJ Bem/Dr Saúde. Restante: homologação humana in loco + deploy.
