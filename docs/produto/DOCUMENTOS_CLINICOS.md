# Documentos clínicos — atestado, receita e protocolos

Referência para prestadores (médicos) e agentes. Escopo: feedback operacional sobre
protocolos de exames, atestado, receita comum/especial e usabilidade mobile/desktop.

## O que a plataforma faz hoje

| Documento | Onde | Status |
|-----------|------|--------|
| Protocolo de cuidado | `/interno/cadastros?tab=protocols` + aba Protocolos no atendimento | Editável + ativar/desativar |
| Protocolo de exames | mesma aba Cadastros + aba Exames (aplicar em lote) | Editável + ativar/desativar |
| Receita comum / controle especial | Care Chart (Medicação) + template PEP | Estruturada + reativar |
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

## Protocolos de exames

Modelo `ExamProtocolTemplate` — lista de nomes de exames + indicação clínica padrão.
No atendimento, **Aplicar protocolo** gera um `ExamOrder` por item.

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

**Contrato HTTP:** [`plataforma/API_DOCS.md`](../plataforma/API_DOCS.md) §7 (protocolos de exames e prescrições).

## Validação rápida

1. Interno → Cadastros → Protocolos: criar/editar/desativar protocolo de exames
2. Prestador → Atendimento → Exames → Aplicar protocolo
3. Medicação → receita controle especial → Suspender → Reativar
4. Prontuário → Atestado → preencher dias + CID com autorização → Gerar template
5. Reduzir viewport: abas com rótulos curtos e formulários sem overflow horizontal
