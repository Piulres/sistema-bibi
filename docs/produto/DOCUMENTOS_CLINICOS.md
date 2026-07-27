# Documentos clínicos — atestado, receita e protocolos

Referência para prestadores (médicos) e agentes. Escopo: feedback operacional sobre
protocolos de exames, atestado, receita comum/especial e usabilidade mobile/desktop.

## O que a plataforma faz hoje

| Documento | Onde | Status |
|-----------|------|--------|
| Protocolo de cuidado | `/interno/cadastros?tab=protocols` + aba Protocolos no atendimento | Editável + ativar/desativar |
| Protocolo de exames | mesma aba Cadastros + aba Exames (aplicar em lote) | Editável + ativar/desativar |
| Receita comum / controle especial | Care Chart (Medicação) + template PEP | Estruturada + reativar |
| Receita multi-item | Aba **Receita** no atendimento (`PrescriptionDocumentForm`) | N medicamentos por documento; templates de preparo (ex.: colonoscopia) |
| Atestado (afastamento / acompanhamento / comparecimento) | PEP → tipo Atestado | Texto estruturado CFM |
| Assinatura digital / Atesta CFM / SNCR | — | Fora do escopo POC |

## Atestado (pesquisa — CFM)

Base: **Resolução CFM nº 2.381/2024** (documentos médicos) e **2.382/2024** (Atesta CFM).

Campos que o formulário do ServiceOS cobre na POC:

- Tipo: afastamento, acompanhamento ou declaração de comparecimento
- Identificação do paciente (nome + CPF quando disponível)
- Quantidade de dias e data de início / comparecimento
- CID **somente** com checkbox de autorização do paciente
- Observações opcionais + aviso de que a emissão oficial nacional é via Atesta CFM

**Não coberto:** integração obrigatória Atesta CFM, QRCode de bloco físico, assinatura
qualificada ICP-Brasil.

## Receita comum e de controle especial (pesquisa — Anvisa)

Base: **Portaria SVS/MS 344/1998**, atualizações **RDC 1000/2025** e prazos SNCR.

| Tipo na UI | Uso |
|------------|-----|
| `COMUM` | Medicamentos sem controle especial |
| `CONTROLE_ESPECIAL` | Receita de Controle Especial (duas vias; listas C1/C5 etc.) |

**Ativar / inativar:**

- Prescrição estruturada: status `ATIVA` \| `SUSPENSA` \| `ENCERRADA` + botão **Reativar**
- Templates de protocolo (cuidado e exames): flag `active` no cadastro interno

**Não coberto:** Notificações de Receita A/B (amarela/azul), numeração SNCR, retenção
eletrônica Anvisa, modelos oficiais PDF tipográficos.

## Receita multi-item (`PrescriptionDocument`) — v3.0.13

Complementa a prescrição unitária (`MedicationPrescription`) com documentos que agrupam **vários medicamentos** em um único registro — útil para preparos (colonoscopia), kits e orientações combinadas.

| Campo | Descrição |
|-------|-----------|
| `title` | Título do documento (ex.: "Pré-colonoscopia") |
| `prescriptionKind` | `COMUM` ou `CONTROLE_ESPECIAL` |
| `items[]` | Lista ordenada: `medication`, `dosage`, `frequency` (+ `route`, `durationDays`, `quantity`, `notes`) |
| `appointmentId` | Vínculo opcional ao atendimento em curso |
| `status` | `ATIVA` (default) |

**Onde na UI:** `/prestador/atendimento/[id]` → aba **Receita** → `PrescriptionDocumentForm`.

**Massa demo:** João (3 medicamentos) e Pedro (preparo colonoscopia) — ver [`MASSA_TESTES.md`](../plataforma/MASSA_TESTES.md).

**API:** `GET/POST /api/prestador/patients/{id}/prescription-documents` — ver [`API_DOCS.md`](../plataforma/API_DOCS.md) §7.

## Equipe no atendimento — v3.0.13

Profissionais auxiliares vinculados ao agendamento via `AppointmentParticipant`.

| Conceito | Detalhe |
|----------|---------|
| Papéis | `ANESTESISTA`, `TECNICO_ENFERMAGEM`, `ASSISTENTE`, `PARALEGAL`, `OUTRO` — rótulos por nicho |
| Requisitos | `Procedure.teamRequirements` (JSON) — ex.: colonoscopia exige anestesista |
| Custo PPU | `chargeFee: true` gera `ProcedureUsage` de taxa de equipe |
| Validação | Bloqueia `REALIZADO` se papel obrigatório estiver ausente |

**Onde na UI:** `/prestador/atendimento/[id]` → aba **Equipe** → `AppointmentTeamPanel`.

**API:** `.../appointments/{id}/participants` — ver [`API_DOCS.md`](../plataforma/API_DOCS.md) §7.

## Protocolos de exames

Modelo `ExamProtocolTemplate` — lista de nomes de exames + indicação clínica padrão.
No atendimento, **Aplicar protocolo** gera um `ExamOrder` por item. Pedidos avulsos e laudos usam `POST/PATCH …/exam-orders` — ver [`API_DOCS.md`](../plataforma/API_DOCS.md) §7.

## UI mobile / desktop (correções)

- `TabBar`: rótulos curtos no mobile (`shortLabel`), área de toque ≥ 44px
- Formulários: `min-w-0`, empilhamento `flex-col` → `sm:flex-row`
- Laudo de exame: textarea inline (sem `window.prompt`)
- Protocolos de cuidado: edição após criar (antes só ativar/desativar)

## Código canônico

- `src/lib/clinical/atestado.ts` · `src/lib/clinical/receita.ts`
- `src/lib/exam-protocol-service.ts` · `src/lib/pep-templates.ts`
- `src/components/ExamProtocolTemplatesPanel.tsx` · `ProtocolTemplatesPanel.tsx`
- `src/components/clinical/ClinicalCarePanel.tsx` · `AtendimentoView.tsx`
- `src/lib/prescription-document-service.ts` · `src/lib/appointment-team-service.ts`
- `src/components/clinical/PrescriptionDocumentForm.tsx` · `AppointmentTeamPanel.tsx`

**Contrato HTTP:** [`plataforma/API_DOCS.md`](../plataforma/API_DOCS.md) §7 (protocolos de exames e prescrições).

## Validação rápida

1. Interno → Cadastros → Protocolos: criar/editar/desativar protocolo de exames
2. Prestador → Atendimento → Exames → Aplicar protocolo
3. Medicação → receita controle especial → Suspender → Reativar
4. Prontuário → Atestado → preencher dias + CID com autorização → Gerar template
5. Reduzir viewport: abas com rótulos curtos e formulários sem overflow horizontal
