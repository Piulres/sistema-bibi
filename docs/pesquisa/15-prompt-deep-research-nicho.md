# Prompt — Deep Research por Nicho (ServiceOS)

Use em **Cursor**, **Perplexity**, **NotebookLM** ou consultor externo para replicar pesquisas de mercado por vertical.

---

## Prompt mestre

```text
Atue como analista de mercado sênior especializado em [NICHO: Veterinário | Jurídico | Odontológico | Educação | Spa/Bem-estar] no Brasil.

Contexto: O Sistema Bibi - ServiceOS é uma infraestrutura SaaS multi-tenant Pay Per Use (cobrança por uso real com preço congelado no ato — Price Snapshot). Precisamos de pesquisa para alimentar dicionário de labels, preços do seed e benchmark competitivo.

Entregáveis obrigatórios (markdown):

1. TAM / SAM / SOM 2026 — com fontes e separação FATO vs INFERÊNCIA
2. Tabela de preços (mínimo, médio, máximo) para 5–8 procedimentos/serviços típicos do nicho
3. Glossário: mapear termos genéricos (paciente, consulta, prontuário) → nomenclatura do setor
4. Top 5–10 concorrentes (SaaS, marketplace, operadoras) — modelo de cobrança e gap Pay Per Use
5. Benefício corporativo B2B — como empresas compram hoje (plano, voucher, auxílio, assinatura)
6. Cenário ROI Pay Per Use vs modelo tradicional (exemplo numérico 100–500 usuários)
7. Implicações para produto: seed, labels, landing keywords

Formato: seguir estrutura de docs/pesquisa/TEMPLATE_PESQUISA_NICHO.md
Idioma: português (BR)
Citar URLs de fontes com data de acesso.
Não inventar dados — marcar INFERÊNCIA quando projetar.
```

---

## Prompts por nicho (atalho)

### VET — PetOS

```text
Pesquise mercado pet Brasil 2026: TAM Abempet, preços banho/tosa por porte, consulta veterinária, auxílio pet corporativo (Guapeco, planos pet), concorrentes ERP vet. Glossário: Pet, Tutor, Ficha clínica. Template: docs/pesquisa/TEMPLATE_PESQUISA_NICHO.md
```

### LEGAL — LawOS

```text
Pesquise LegalTech Brasil 2026: hora técnica advogado (faixa OAB), modelos honorários (êxito, retainer), ADVBox/Astrea/Projuris, 1,3mi advogados. Glossário: Cliente, Dossiê, Hora técnica. Pay Per Use vs retainer mensal. Template: docs/pesquisa/TEMPLATE_PESQUISA_NICHO.md
```

### DENTAL

```text
Pesquise odontologia Brasil 2026: preços limpeza, canal, consulta; custo assistencial planos ANS (Milliman); Pay Per Use vs plano odontológico corporativo. Glossário: Consulta odontológica, Odontograma. Template: docs/pesquisa/TEMPLATE_PESQUISA_NICHO.md
```

### EDUCATION — EduOS

```text
Pesquise mentorias e aulas particulares Brasil 2026: Hotmart, Superprof, tickets low/mid/high, educação corporativa L&D. Glossário: Aluno, Instrutor, Histórico pedagógico. Pay Per Use vs assinatura Udemy/Alura. Template: docs/pesquisa/TEMPLATE_PESQUISA_NICHO.md
```

### SPA — WellnessOS

```text
Pesquise bem-estar corporativo Brasil 2026: IMARC US$1,6bi, Buddha Spa corporativo, preços quick massage e yoga, Wellhub/Gympass. Glossário: Sessão, Cliente, Ficha de atendimento. Pay Per Use vs assinatura wellness. Template: docs/pesquisa/TEMPLATE_PESQUISA_NICHO.md
```

---

## Integração no repositório

Após a pesquisa:

1. Salvar em `docs/segmentos/{segmento}/pesquisa.md`
2. Atualizar `docs/segmentos/README.md`
3. Revisar `src/constants/niches.ts` se glossário mudar
4. Atualizar `prisma/seed-data/niche-tenants.ts` com preços = mediana
5. Registrar em `docs/pesquisa/README.md`

---

## Relatórios já publicados

| Nicho | Arquivo |
|-------|---------|
| VET | [`nichos/10-nicho-vet.md`](nichos/10-nicho-vet.md) |
| LEGAL | [`nichos/11-nicho-legal.md`](nichos/11-nicho-legal.md) |
| DENTAL | [`nichos/12-nicho-dental.md`](nichos/12-nicho-dental.md) |
| EDUCATION | [`nichos/13-nicho-education.md`](nichos/13-nicho-education.md) |
| SPA | [`nichos/14-nicho-spa.md`](nichos/14-nicho-spa.md) |
