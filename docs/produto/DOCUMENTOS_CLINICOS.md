# Documentos clínicos — saída do atendimento

Referência para prestadores e agentes. Escopo: o que o paciente leva após a consulta
(receita, pedido de exames, encaminhamento, atestado), templates e impressão de guias.

Padrão de mercado (DocVox, Prescreve, Doctor's Office, Colmeia): emitir no consultório →
imprimir A4 → entregar em mãos **e** disponibilizar no painel do paciente.

## O que a plataforma faz hoje

| Documento | Onde emitir | Impressão PDF | Painel do beneficiário |
|-----------|-------------|---------------|------------------------|
| Receita multi-item | Atendimento → Medicação | Guia tipográfica (+ 2 vias se controle especial) | **Documentos** |
| Pedido de exames | Atendimento → Exames (avulso ou protocolo) | Guia agregada do atendimento | **Documentos** |
| Encaminhamento | Atendimento → **Documentos** (templates) | Guia A4 | **Documentos** |
| Atestado | Atendimento → Prontuário (tipo Atestado) | PDF PEP | **Documentos** + Prontuário |
| Protocolo de exames | Interno → Cadastros + aplicar no atendimento | Via pedido de exames | (status em Exames) |

**Fluxo otimizado no prestador**

1. Emitir receita / exames / encaminhamento durante o atendimento  
2. Aba **Documentos** → revisar guias → **PDF** individual ou **pacote do atendimento**  
3. Entregar impresso em mãos  
4. Paciente baixa de novo em `/beneficiario/documentos` se perder o papel  

## Encaminhamento

Modelo `ClinicalReferral` — especialidade/serviço, urgência (rotina/breve/urgente),
motivo clínico, histórico e condutas pedidas ao destino.

Templates prontos: Cardiologia, Ortopedia, Gastroenterologia, Endocrinologia,
Dermatologia, Psiquiatria, Retorno, Fisioterapia.

## Receita comum e de controle especial (Anvisa)

Base: **Portaria SVS/MS 344/1998**, atualizações **RDC 1000/2025**.

| Tipo na UI | Uso |
|------------|-----|
| `COMUM` | Medicamentos sem controle especial |
| `CONTROLE_ESPECIAL` | Duas vias no PDF (1ª farmácia / 2ª paciente) |

**Não coberto:** Notificações A/B, numeração SNCR, retenção eletrônica Anvisa,
assinatura ICP-Brasil / QRCode.

## Pedidos de exame

- Avulso ou **Aplicar protocolo** (`ExamProtocolTemplate`)  
- Guia PDF agrupa os exames do atendimento (padrão de mercado = um pedido com N itens)  

## Atestado (CFM)

Base: **Resolução CFM nº 2.381/2024** e **2.382/2024** (Atesta CFM).  
Formulário estruturado no PEP; PDF via exportação de registro. Integração Atesta CFM fora do POC.

## Código canônico

- `src/lib/clinical/encaminhamento.ts` · `receita.ts` · `atestado.ts`
- `src/lib/clinical-referral-service.ts` · `clinical-discharge-service.ts`
- `src/lib/exports/clinical-guide-pdf.ts` · `clinical-guide-service.ts`
- `src/components/clinical/ClinicalDischargePanel.tsx`
- Prestador: `/api/prestador/clinical-guides/export` · `.../discharge-documents` · `.../referrals`
- Beneficiário: `/beneficiario/documentos` · `/api/beneficiario/documents` · `.../clinical-guides/export`

## Validação rápida

1. Prestador → Atendimento → Medicação → emitir receita multi-item → PDF  
2. Exames → aplicar protocolo → PDF do pedido  
3. Documentos → template Cardiologia → emitir → PDF → pacote do atendimento  
4. Beneficiário (`joao.pereira@email.com`) → Documentos → baixar PDF (seed já inclui receita, exame, encaminhamento Endocrinologia e atestado)  
5. Viewport estreito: abas com `shortLabel` e botões sem overflow  
