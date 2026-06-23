# Prompts para pesquisa externa de benchmark

Use em **Perplexity**, **ChatGPT**, **Claude**, **NotebookLM** ou com consultores / entrevistas de mercado.

Complementa os documentos em [`README.md`](README.md). Após rodar a pesquisa, atualize [`01-matriz-competitiva.md`](01-matriz-competitiva.md) e [`06-catalogo-players.md`](06-catalogo-players.md).

---

## Prompt principal (pesquisa completa)

```markdown
# Contexto

Estou fazendo benchmark competitivo do **Sistema Bibi - ServiceOS v2.0**, infraestrutura SaaS **multi-segmento** brasileira com **Pay Per Use** (cobrança por serviços efetivamente usados, precificação dinâmica por empresa). Segmentos: saúde, veterinária, odontologia, jurídico, bem-estar, educação.

O produto tem **4 portais segregados por role**:
- Prestador (agenda, atendimento, PEP)
- Interno (faturamento, CRM, cadastros, integrações, segurança)
- Empresa/PJ (consumo por beneficiário, alertas, export)
- Beneficiário (agendar, ver consumo, pagar fatura PIX, ver prontuário)

Stack: Next.js, multi-tenant, white label, webhooks, OpenAPI, TISS simplificado (mock), PIX mock, MFA TOTP, RBAC interno.

**Posicionamento:** infraestrutura transacional **ServiceOS** — não ERP clínico solo nem operadora tradicional. Saúde (`MEDICAL`) é um segmento; o mesmo motor atende outros verticais.

Já mapeamos (análise inicial):
- Clínica SMB: iClinic, Feegow, HiDoctor, Clínica nas Nuvens, Prontmed, Amplimed, GestãoDS, Shosp, ProDoctor, Ninsaúde, Medsystem, Versatilis, ByDoctor, 4Medic
- Hospitalar/ERP: Salutem, Tasy/Bionexo, SOUL MV, Pixeon, SPDATA, Benner
- Prescrição/IA: Memed, Voa Health, Mevo, Noa Notes
- Marketplace: Doctoralia, AgendarConsulta
- B2B corporativo/telessaúde: ERPMed/Centtralmed, Conexa, Alice, MediQuo, Pipo Saúde, Vitta, Sami, QSaúde

# Objetivo da pesquisa

Expandir o benchmark com **empresas e sistemas adicionais** do ecossistema de saúde digital no Brasil e América Latina, validando informações com **fontes públicas** (sites oficiais, releases, imprensa, Crunchbase, LinkedIn, ANS, SBIS, relatórios de mercado 2024–2026).

# O que preciso que você entregue

## 1. Catálogo expandido (mínimo 20 empresas NOVAS, não repetir as já listadas)

Organize por camada:
- A) ERP hospitalar / ambulatorial enterprise
- B) Gestão de clínica e consultório (SMB)
- C) Prescrição digital e interoperabilidade
- D) IA clínica / documentação / CDS
- E) Saúde corporativa B2B / benefícios / Pay Per Use
- F) Operadoras e health plans digitais
- G) Telessaúde e primary care
- H) Marketplace / aquisição de pacientes
- I) Fintech/pagamentos em saúde
- J) Compliance (TISS, SBIS, LGPD, assinatura digital)

Para cada empresa, preencha:

| Campo | Conteúdo |
|-------|----------|
| Nome + URL | Site oficial |
| País / atuação | BR, LATAM, global |
| Segmento | Uma linha |
| Público-alvo | Quem compra |
| Funcionalidades principais | Bullet list (máx. 8) |
| Modelo de receita | SaaS, por médico, por vida, % transação, etc. |
| Preços públicos | Se houver; senão "sob consulta" |
| Escala | Usuários, clientes, funding (se público) |
| Diferencial competitivo | 1–2 frases |
| Usabilidade / UX | Trial grátis? onboarding? app? NPS? |
| Integrações | Memed, WhatsApp, TISS, APIs, etc. |
| Relação com Sistema Bibi - ServiceOS | Concorrente direto / indireto / parceiro / fora de escopo |
| Fontes | Links consultados |

## 2. Matriz comparativa

Compare **Sistema Bibi - ServiceOS** vs top 10 concorrentes mais relevantes nas dimensões:

- Pay Per Use / cobrança por uso
- Portal corporativo (RH/PJ)
- Portal beneficiário self-service
- Precificação dinâmica por empresa
- Operação clínica (agenda, PEP, tele)
- Faturamento TISS / convênio / glosa
- Prescrição digital regulada
- IA (transcrição, CDS)
- B2B (CRM, webhooks, API)
- White label / multi-tenant
- Mobile / PWA
- Certificações (SBIS, LGPD)
- Preço / modelo comercial

Use escala: ✅ forte | 🟡 parcial | ❌ ausente | ⭐ diferencial ServiceOS

## 3. Análise de mercado

- Tamanho e tendências do mercado de healthtech SaaS no Brasil (2025–2026)
- Consolidações recentes (M&A)
- O que virou **table stakes** vs **diferencial** em 2026
- Faixas de preço por segmento
- Players que fazem **Pay Per Use** ou modelo similar

## 4. Gaps e recomendações para o Sistema Bibi - ServiceOS

- Top 5 gaps vs mercado (priorizados)
- Top 5 diferenciais a comunicar comercialmente
- Integrações obrigatórias (ex.: Memed, WhatsApp Business API)
- Players que **não** devemos tentar competir (e por quê)
- Sugestão de posicionamento em 1 parágrafo + 3 bullets de valor

## 5. Formato e qualidade

- Responder em **português (Brasil)**
- Citar **URL de cada afirmação relevante**
- Separar **fato** de **inferência** (marcar inferências)
- Indicar quando dados estiverem desatualizados ou não confirmados
- Incluir tabela resumo executiva (1 página)
- Não inventar preços ou números sem fonte

# Restrições

- Foco: Brasil primeiro; LATAM e global só se relevante ao posicionamento B2B
- Ignorar hardware médico, PACS/RIS puro, laboratório LIS isolado (fora de escopo)
- Priorizar software/plataformas com modelo SaaS ou B2B
- Incluir startups recentes (2020+) e incumbentes tradicionais

# Perguntas específicas a responder

1. Quem são os **3 concorrentes mais próximos** do modelo Pay Per Use + portal corporativo do ServiceOS?
2. Existe algum player brasileiro com **4 portais** ou arquitetura similar?
3. Qual o **preço médio** de software de clínica por médico/mês em 2026?
4. Quais certificações (SBIS, etc.) são exigidas em RFPs de hospitais e operadoras?
5. Quais healthtechs receberam investimento relevante nos últimos 24 meses no Brasil?

Comece pela pesquisa e entregue o catálogo expandido.
```

---

## Prompt curto (pesquisa rápida)

```markdown
Benchmark competitivo do **Sistema Bibi - ServiceOS** (SaaS multi-segmento BR, Pay Per Use, 4 portais: colaborador/interno/PJ/cliente final).

Já mapeados: iClinic, Feegow, Salutem, Memed, Voa, Prontmed, ERPMed, Conexa, Tasy, HiDoctor, Clínica nas Nuvens, Amplimed, Shosp, ProDoctor, Pipo Saúde, Vitta, Alice, Sami, QSaúde.

Liste +20 empresas NOVAS do ecossistema saúde digital BR (clínica, hospitalar, B2B corporativo, prescrição, IA, telessaúde, fintech saúde) com: URL, funcionalidades, preços se públicos, modelo de receita, escala, e relação com ServiceOS (concorrente/parceiro/fora de escopo).

Monte matriz ServiceOS vs top 10, gaps prioritários e fontes. Português BR. Não inventar dados.
```

---

## Prompt para entrevistas (RH / operadora / clínica)

```markdown
Estou validando um benchmark de plataformas de saúde corporativa (modelo Pay Per Use).

Se você atua em [RH / operadora / clínica / hospital / healthtech], responda:

1. Qual sistema usa hoje para gestão de saúde corporativa ou clínica?
2. O que funciona bem e o que falta?
3. Você paga por mensalidade fixa ou por uso/procedimento?
4. Tem portal para empresa ver consumo dos colaboradores?
5. Tem portal para o beneficiário agendar e pagar?
6. Integra com TISS, PIX, WhatsApp, prescrição digital (Memed)?
7. O que faria você trocar de fornecedor?
8. Quanto paga por médico/mês ou por vida/ano (faixa)?
9. Conhece ERPMed, Centtralmed, Conexa, Alice, iClinic, Feegow, Vitta, Pipo? Como compara?
10. O que seria "ideal" numa plataforma Pay Per Use B2B?

Respostas anônimas. Uso apenas para benchmark interno.
```

---

## Onde usar cada prompt

| Ferramenta | Prompt recomendado |
|------------|-------------------|
| Perplexity | Principal (fontes + URLs) |
| ChatGPT / Claude | Principal, iterando por camada A–J |
| NotebookLM | Principal + upload de `docs/pesquisa/*.md` e `docs/plataforma/BENCHMARK.md` |
| Entrevistas | Formulário de entrevista |

---

## Após a pesquisa

1. Revisar números e preços com fonte primária.
2. Atualizar [`06-catalogo-players.md`](06-catalogo-players.md) com empresas novas.
3. Ajustar [`01-matriz-competitiva.md`](01-matriz-competitiva.md) se critérios mudarem.
4. Cruzar gaps com [`../BENCHMARK.md`](../BENCHMARK.md) (implementação na POC).
