# Features comuns — todos os módulos e segmentos

Mapa das capacidades **compartilhadas** pelo ServiceOS em qualquer `niche` (`MEDICAL`, `VET`, `DENTAL`, `LEGAL`, `SPA`, `EDUCATION`). O vocabulário muda via `useLabels()`; o motor transacional é o mesmo.

> **Features individuais por nicho:** [`ESTRATEGIA_SEGMENTOS.md`](ESTRATEGIA_SEGMENTOS.md) e `docs/segmentos/{niche}/COMERCIAL.md`  
> **Validação técnica:** [`../plataforma/BENCHMARK.md`](../plataforma/BENCHMARK.md) · [`../produto/FLUXOS.md`](../produto/FLUXOS.md)

---

## 1. Motor transacional (core)

| Feature | Descrição | Onde validar |
|---------|-----------|--------------|
| **Pay Per Use** | Cobrança por serviço efetivamente utilizado | `ProcedureUsage`, portal PJ consumo |
| **Price Snapshot** | Preço congelado no ato (`priceCharged`) | Atendimento → faturamento |
| **Precificação dinâmica B2B** | Multiplicador por empresa (`PricingRule`) | Cadastros → Precificação |
| **Catálogo de procedimentos** | `CONSULTA`, `SERVICO`, `SESSAO` por tenant | Cadastros → Procedimentos |
| **Assinaturas + bridge fatura** | MRR recorrente ligado a fatura | `/interno/assinaturas` |
| **Faturas e inadimplência** | Emissão, status, alertas | `/interno` Faturamento |
| **PIX (mock)** | Adapter Strategy configurável | Faturamento, portal beneficiário |
| **Cliente 360°** | Visão única por beneficiário | `/interno/beneficiarios/[id]` |
| **Timeline de auditoria** | Eventos universais por entidade | Cliente 360°, `/interno/auditoria` |

---

## 2. Portal Interno (administração)

| Módulo | Feature comum | Notas |
|--------|---------------|-------|
| **Dashboard** | KPIs executivos (consumo, inadimplência) | Todos os nichos |
| **Faturamento** | Ciclo completo Pay Per Use | Marcar pago, exportar |
| **Agenda** | CRUD administrativo, walk-in, status | Labels por nicho |
| **Cadastros** | Beneficiários, empresas, procedimentos, usuários, precificação | Aba Pets só VET |
| **Estoque** | Controle de insumos/produtos | Rótulo da aba varia por nicho |
| **CRM** | Pipeline lead → ativo | Corporativo B2B |
| **Recorrência** | Assinaturas e planos | |
| **Comunicação** | Fila de mensagens (mock/console) | Strategy para WhatsApp futuro |
| **Relatórios** | Export e visões operacionais | |
| **Auditoria** | Trilha LGPD e eventos | |
| **White Label** | Logo, cores, domínio, display name | Netlify Blobs |
| **Integrações** | Webhooks outbound + retry | Cron de reenvio |
| **Segurança** | RBAC (`ADMIN`, `FATURAMENTO`, `RECEPCAO`, `READONLY`), MFA TOTP | Demo reset (modo demo) |

**RBAC:** nav e APIs filtradas por `internoProfile` — comum a todos os segmentos.

---

## 3. Portal Prestador

| Feature | Descrição |
|---------|-----------|
| **Agenda do dia** | Consultas/atendimentos/aulas do profissional |
| **Lista de clientes** | Pacientes, pets (VET), alunos etc. via labels |
| **Atendimento** | Registro de serviço → gera uso faturável |
| **Prontuário/dossiê** | PEP ou equivalente com templates |
| **Extrato** | Histórico financeiro do prestador |
| **Relatórios** | Visão operacional do profissional |

---

## 4. Portal Empresa (PJ)

| Feature | Descrição |
|---------|-----------|
| **Resumo executivo** | Consumo agregado da empresa |
| **Beneficiários** | Lista elegíveis + consumo individual |
| **Assinaturas** | Contratos corporativos ativos |
| **Faturas** | Histórico e status de pagamento |
| **Alertas inadimplência** | Negociação e visibilidade |
| **Export CSV** | Relatórios para RH/Financeiro |
| **Precificação corporativa** | Desconto via multiplier (visível no consumo) |

**Argumento comercial transversal:** destruir a caixa preta — RH audita cada uso em tempo real.

---

## 5. Portal Beneficiário (cliente final)

| Feature | Descrição |
|---------|-----------|
| **Agendamento self-service** | Slots disponíveis em tempo real |
| **Consumo e valores** | Transparência Pay Per Use |
| **Faturas e pagamento** | PIX + histórico |
| **Assinatura/plano** | Visão do plano ativo |
| **Prontuário/dossiê** | Read-only do histórico |
| **Medicações e exames** | Visão de cuidado (labels clínicos) |
| **Histórico** | Timeline de atendimentos |

---

## 6. Plataforma e infraestrutura

| Feature | Descrição |
|---------|-----------|
| **Multi-tenant** | Isolamento por `Tenant` |
| **Multi-nicho** | `niche` + `labels` JSON por tenant |
| **White label** | Branding, tema, domínio customizado |
| **Segment routing** | `?tenant=`, cookie `bibi_segment`, domínio |
| **API REST** | OpenAPI em `/openapi.yaml` |
| **Webhooks** | Entrega assíncrona com log e retry |
| **LGPD** | Consentimento, exportação, exclusão |
| **Dual-store** | Modo demo vs. operação (Blobs) |
| **Importação** | JSON/CSV para cadastros |
| **Change management** | Cancelamento/reversão de agendamentos |
| **Assistente IA** | Nos 4 portais (cenários por role/nicho) |
| **Landing segmentada** | `/segmentos/{slug}` + `/?niche=` |

---

## 7. Landing e captação (comum)

| Elemento | Comportamento |
|----------|---------------|
| **Hero + features** | Parametrizado por nicho (`landing-content.ts`) |
| **4 portais demo** | Links com `?tenant=` do segmento |
| **FAQ** | Pay Per Use, B2B, white label, LGPD, multi-nicho |
| **CTA demonstração** | Portais + WhatsApp (UTM) + OpenAPI |
| **Trust badges** | Multi-tenant, API, white label, MFA |
| **Página `/venda`** | Propósitos, para quem, missão, valor |

---

## 8. O que NÃO é comum (resumo)

Capacidades **específicas ou prioritárias** de um nicho — detalhes em cada `COMERCIAL.md`:

| Nicho | Exemplos de diferenciação |
|-------|---------------------------|
| `MEDICAL` | TISS XML, telemedicina, templates PEP médicos, ROI 87% documentado |
| `VET` | Entidade `Pet`, carteira vacinal, agenda com `petId` |
| `DENTAL` | Vocabulário odontológico, estoque clínico |
| `LEGAL` | Hora técnica, dossiê, catálogo jurídico |
| `SPA` | Sessões wellness, pacotes day spa |
| `EDUCATION` | Aulas/sessões, histórico pedagógico, L&D corporativo |

---

## 9. Gaps comuns (roadmap transversal)

Estado na POC — qualificar em vendas enterprise:

| Capability | Status |
|------------|--------|
| PIX produção | Mock |
| WhatsApp Business API | Mock/console |
| App mobile nativo | Web mobile-first |
| Prescrição digital regulada (Memed) | Roadmap |
| Certificação SBIS | Roadmap |
| TISS XSD validado | Roadmap (saúde) |

Ver [`../pesquisa/03-estrategia-produto-posicionamento.md`](../pesquisa/03-estrategia-produto-posicionamento.md).
