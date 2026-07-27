# Documentos clínicos — atestado, receita e protocolos

Referência para prestadores (médicos) e agentes. Escopo: feedback operacional sobre
protocolos de exames, atestado, receita comum/especial e usabilidade mobile/desktop.

## O que a plataforma faz hoje

| Documento | Onde | Status |
|-----------|------|--------|
| Protocolo de cuidado | `/interno/cadastros?tab=protocols` + aba Protocolos no atendimento | Editável + ativar/desativar |
| Protocolo de exames | mesma aba Cadastros + aba Exames (aplicar em lote) | Editável + ativar/desativar |
| Receita comum / controle especial | Care Chart (Medicação) + template PEP | Estruturada + reativar |
| Receita multi-item (documento) | Aba clínica no atendimento · `PrescriptionDocumentForm` | N medicamentos por receita — v3.0.13 |
| Equipe no atendimento | Aba **Equipe** em `/prestador/atendimento/[id]` | Papéis por nicho + taxa PPU opcional — v3.0.13 |
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

## Receita multi-item (v3.0.13)

Modelo `PrescriptionDocument` + `PrescriptionDocumentItem` — uma receita com vários medicamentos no mesmo documento.

| Aspecto | Detalhe |
|---------|---------|
| UI | `PrescriptionDocumentForm` em `ClinicalCarePanel` / `AtendimentoView` |
| API | `GET/POST /api/prestador/patients/{id}/prescription-documents` (`?appointmentId=` no GET) |
| Compatibilidade | Cada item gera também `MedicationPrescription` (Care Chart / medicações ativas) |
| Tipos | `COMUM` \| `CONTROLE_ESPECIAL` (mesmo enum da prescrição unitária) |
| Templates | Sugestões em `COMMON_MEDICATIONS` (`prescription-medications.ts`, client-safe) |

Campos obrigatórios por item: `medication`, `dosage`, `frequency`. Opcionais: `route`, `durationDays`, `quantity`, `notes`. Texto para impressão: `formatPrescriptionDocumentText()`.

## Equipe no atendimento (v3.0.13)

Profissionais auxiliares vinculados ao agendamento (`AppointmentParticipant`).

| Aspecto | Detalhe |
|---------|---------|
| UI | Aba **Equipe** · `AppointmentTeamPanel` |
| Papéis | `ANESTESISTA`, `TECNICO_ENFERMAGEM`, `ASSISTENTE`, `PARALEGAL`, `OUTRO` — rótulos por nicho em `team-roles.ts` |
| Requisitos | `Procedure.requiredTeamRoles` (JSON) — alerta na UI se faltar papel obrigatório |
| Cobrança PPU | `chargeFee: true` no POST cria `ProcedureUsage` com código de taxa do papel (`TEAM_ROLE_FEE_PROCEDURE_CODES`) |
| API | `.../appointments/{id}/participants` (GET/POST/DELETE) · `.../eligible?role=` |

Remover participante com taxa não faturada exclui o `ProcedureUsage` vinculado.

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
- `src/lib/prescription-document-service.ts` · `src/lib/appointment-team-service.ts` · `src/lib/clinical/team-roles.ts`
- `src/lib/exam-protocol-service.ts` · `src/lib/pep-templates.ts`
- `src/components/ExamProtocolTemplatesPanel.tsx` · `ProtocolTemplatesPanel.tsx`
- `src/components/clinical/ClinicalCarePanel.tsx` · `PrescriptionDocumentForm.tsx` · `AppointmentTeamPanel.tsx` · `AtendimentoView.tsx`

**Contrato HTTP:** [`plataforma/API_DOCS.md`](../plataforma/API_DOCS.md) §7 (protocolos de exames e prescrições).

## Validação rápida

1. Interno → Cadastros → Protocolos: criar/editar/desativar protocolo de exames
2. Prestador → Atendimento → Exames → Aplicar protocolo
3. Medicação → receita controle especial → Suspender → Reativar
4. Receita multi-item → adicionar 2+ medicamentos → salvar → listar no atendimento
5. Equipe → adicionar anestesista com taxa PPU → verificar `ProcedureUsage` na timeline
6. Prontuário → Atestado → preencher dias + CID com autorização → Gerar template
7. Reduzir viewport: abas com rótulos curtos e formulários sem overflow horizontal
