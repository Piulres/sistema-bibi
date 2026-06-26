# Inteligência operacional por segmento — ServiceOS v2.0

Pesquisa de mercado e rotina diária (jun/2026) para calibrar massas demo, fluxos de teste e posicionamento Pay Per Use. Fontes: blogs de gestão setorial, softwares especializados e documentação interna em `docs/segmentos/*/pesquisa.md`.

---

## Resumo executivo

| Segmento | Unidade de venda típica | KPI operacional #1 | Oportunidade PPU |
|----------|-------------------------|----------------------|------------------|
| MEDICAL | Consulta / exame / ASO | Ocupação agenda + glosa | Corporativo 15% uso vs plano fechado |
| VET | Consulta / banho-tosa / vacina | Taxa ocupação >75% | Benefício pet emergente (vale-pet) |
| DENTAL | Procedimento odontológico | Comparecimento + inadimplência | <2 proc/ano/funcionário |
| LEGAL | Hora técnica / parecer | Custo-hora real + prazos | Assessoria vs retainer fixo |
| SPA | Sessão / pacote wellness | Ocupação terapeutas + NPS | Pacote corporativo vs Gympass |
| EDUCATION | Aula / workshop / mentoria | Presença + conclusão trilha | L&D sob demanda vs assinatura Udemy |

---

## MEDICAL — Clínica / saúde ocupacional

### Rotina diária (operacional)
1. **Manhã:** confirmar agenda (WhatsApp 24h), checar estoque crítico, walk-in/particular
2. **Atendimento:** triagem → consulta → PPU (procedimento + preço) → prontuário/PEP
3. **Tarde:** faturamento corporativo, PIX, assinaturas recorrentes (telemedicina)
4. **Fechamento:** conciliação caixa, procedimentos pendentes de faturar, relatórios PCMSO

### KPIs de referência
- Taxa de ocupação agenda: 70–85%
- Ticket médio por empresa B2B
- Procedimentos pendentes de faturamento (PPU)
- Glosas / inadimplência PIX

### Massa demo ServiceOS
- Tenant: `horizonte` (+ `vitacare` white-label)
- Personas: João (PPU pendente), Maria (PIX), Pedro (particular pago)
- Extras: estoque médico, Care Chart, MFA, TISS, baseline 6–12 meses

---

## VET — PetCare

### Rotina diária (fontes: Agenda Pet, ZettaPET, Sults 2026)
1. **Agenda mista:** consultório (30–45 min) + banho/tosa (1h30–3h por porte) + vacinação em janelas
2. **Confirmação:** WhatsApp 24h e 2h antes — reduz faltas até ~70%
3. **Prontuário:** pet + tutor, vacinas por lote, retornos automáticos (CFMV 1.275/2019)
4. **Estoque:** vacinas, antiparasitários, insumos banho — controle por lote/validade
5. **RT CRMV** obrigatório para atos clínicos e vacinação

### KPIs de referência
- Taxa ocupação banho/tosa: meta >75%
- Ticket médio por tutor
- Vacinas vencidas / lembretes pendentes
- Mix consulta vs estética vs preventivo

### Preços mercado (alinhados ao seed)
| Serviço | Faixa mercado | Seed PetCare |
|---------|---------------|--------------|
| Consulta geral | R$ 150–220 | R$ 180 |
| Banho/tosa médio | R$ 120–180 | R$ 150 |
| Vacina V10 | R$ 100–140 | R$ 120 |

### Massa demo ServiceOS (rica)
- Label `appointment` → **Banho/Tosa**
- 3 tutores estrela + particular (`particular@petcare.demo`)
- Pets Thor/Luna/Bob/Mel + vacinas + perfil clínico
- Estoque VET (vacinas, antiparasitário, shampoo)
- RBAC: `operacao@`, `recepcao@`, `financeiro@petcare.demo`
- PJ 3–9 usuários (perfil `operation-1y`)
- Fluxos: PPU hoje, PIX pendente, fatura paga particular

---

## DENTAL — Odontologia

### Rotina diária (fontes: Amplimed, Dental Office, Clinicorp 2026)
1. **Captação → agendamento → check-in → consulta → plano tratamento → orçamento**
2. **Prontuário:** odontograma, radiografias, evolução por dente
3. **Financeiro:** conciliação diária, convênios (TUSS/guias), inadimplência
4. **Estoque:** resinas, brocas, anestésicos — ruptura = parada cadeira

### KPIs de referência
- Taxa comparecimento (no-show)
- Inadimplência
- Margem por procedimento (canal, limpeza, orto)
- Prazo recebimento convênio

### Massa demo ServiceOS (rica)
- Personas: `paciente@smile.demo`, `roberto.dental@`, `particular@smile.demo`
- Perfil clínico + odontograma + protocolo orto
- Estoque odontológico (resina, broca, anestésico)
- Descontos corporativos via `PricingRule`

---

## LEGAL — Advocacia

### Rotina diária (fontes: EasyJur, Voga, Advoup 2026)
1. **CRM:** prospecção → consulta inicial → contrato honorários
2. **Operação:** workflow por tipo de ação, prazos, publicações
3. **Precificação:** custo-hora real (fixos + pró-labore ÷ horas faturáveis)
4. **Modelos:** hora técnica, fixo, êxito, assessoria mensal (30–50% receita saudável)

### Faixas honorários (seed alinhado)
| Serviço | Mercado | Seed Lex |
|---------|---------|----------|
| Hora técnica | R$ 400–600 | R$ 500 |
| Consulta inicial | R$ 300–450 | R$ 350 |
| Parecer LGPD | R$ 600–1.200 | R$ 800 |

### Massa demo ServiceOS (rica)
- Dossiê jurídico + parecer LGPD + protocolo assessoria mensal
- Telemedicina ratio alto (55%) — atendimento remoto
- Webhook ERP parceiro B2B

---

## SPA — Wellness

### Rotina diária (fontes: Reservio, Graces, mymento 2026)
1. **Agenda:** terapeutas + salas + duração por serviço (60 min massagem)
2. **Pacotes:** créditos Day Spa, fidelidade (ex.: 8 sessões → upgrade)
3. **40%+ agendamentos** fora do horário comercial (online)
4. **Anamnese:** contraindicações, alergias a óleos — ficha wellness
5. **Comissionamento** por terapeuta/pacote

### Massa demo ServiceOS (rica)
- Ficha wellness + programa corporativo 8 semanas
- Estoque óleos, toalhas, máscaras
- Pacotes `SPA-PAC`, massagem corporativa B2B (`SPA-CORP`)

---

## EDUCATION — Educação corporativa

### Rotina diária (fontes: Ello, Revollu, Qulture.Rocks 2026)
1. **Matrícula** → turma/trilha → aulas com presença
2. **L&D:** workshops, certificações, mentoria, onboarding
3. **Financeiro:** mensalidade por matrícula, rateio por empresa
4. **KPIs:** taxa conclusão, NPS conteúdo, ROI trilha (lead time, certificações)

### Massa demo ServiceOS (rica)
- Plano pedagógico + trilha certificação 12 semanas
- Simulado diagnóstico (`ExamOrder`)
- Alta ratio tele (70%) — aulas remotas/webinar

---

## Matriz — o que cada tenant demo possui (pós enriquecimento)

| Recurso | Horizonte | VET | DENTAL | LEGAL | SPA | EDUCATION |
|---------|-----------|-----|--------|-------|-----|-----------|
| 3 personas estrela | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| RBAC interno (3+) | ✅ 5 | ✅ 3 | ✅ 3 | ✅ 3 | ✅ 3 | ✅ 3 |
| PJ multi-usuário* | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PricingRule B2B | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Estoque | ✅ | ✅ | ✅ | ✅† | ✅ | ✅ |
| Perfil clínico rico | ✅ PEP | ✅ pet | ✅ odonto | ✅ dossiê | ✅ wellness | ✅ pedagógico |
| Baseline faturamento | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Webhook B2B | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Star flows PIX/PPU | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

\* Perfil `SEED_PROFILE=operation-1y` — 3–9 PJ/parceiro  
† LEGAL: insumos digitais (certificado, créditos scan)

---

## Como usar na validação

```bash
# Massa rica em todos os segmentos
SEED_PROFILE=operation-1y npm run db:seed

# Validar por portal
npm run test -- tests/lib/seed-mass-portal.test.ts
```

Credenciais por segmento: `operacao@{slug}.demo` · `recepcao@{slug}.demo` · `financeiro@{slug}.demo` — senha `bibi123`.

---

## Referências externas

- [Agenda Pet — Guia gestão pet 2026](https://www.agendapetapp.com.br/guia-gestao-petshop)
- [ZettaPET — Prontuário digital](https://blog.zettapet.com.br/como-organizar-prontuario-digital-na-clinica-veterinaria/)
- [Amplimed — Gestão odontológica](https://www.amplimed.com.br/blog/sistema-de-gestao-para-clinica-odontologica/)
- [EasyJur — Gestão escritório advocacia](https://easyjur.com/blog/gestao-escritorio-advocacia-guia-definitivo/)
- [Reservio — Software spa](https://www.reservio.com/pt-br/software-de-reservas-para-spas-e-centros-de-bem-estar)
- [Qulture.Rocks — Universidade corporativa](https://www.qulture.rocks/blog/universidade-corporativa)

Pesquisas internas: `docs/segmentos/{medical,vet,dental,legal,spa,education}/pesquisa.md`
