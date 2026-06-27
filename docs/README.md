# Documentação Sistema Bibi - ServiceOS v2.0

Índice canônico da documentação. O ServiceOS é uma **plataforma horizontal Pay Per Use** — a mesma infraestrutura serve múltiplos segmentos de serviços profissionais, alterando vocabulário (labels), branding e landing por tenant.

> **Última revisão factual:** junho/2026 — fluxos em [`produto/FLUXOS.md`](produto/FLUXOS.md); veracidade de pesquisa em [`pesquisa/README.md`](pesquisa/README.md#política-de-veracidade).

> **Não é mais só HealthTech.** Saúde (`MEDICAL`) é um segmento entre seis. Comece pelo segmento do seu tenant ou pela documentação de plataforma.

---

## Por onde começar

| Perfil | Documento |
|--------|-----------|
| Desenvolvedor / agente IA | [`AGENTS.md`](../AGENTS.md) · [`prompts/README.md`](prompts/README.md) |
| Operações e deploy | [`plataforma/OPERACOES.md`](plataforma/OPERACOES.md) |
| API (Swagger / OpenAPI) | [`plataforma/API_DOCS.md`](plataforma/API_DOCS.md) |
| Escopo v2.0 | [`versoes/V2_0.md`](versoes/V2_0.md) |
| Fluxos de produto | [`produto/FLUXOS.md`](produto/FLUXOS.md) |
| Tour guiado (onboarding) | [`produto/ONBOARDING_TOUR.md`](produto/ONBOARDING_TOUR.md) |
| Demo multi-nicho | [`segmentos/README.md`](segmentos/README.md) |

---

## Estrutura de pastas

```
docs/
├── README.md                 ← você está aqui
├── segmentos/                ← documentação por vertical (VET, LEGAL, …)
├── plataforma/               ← operação, arquitetura, deploy, design system
├── produto/                  ← fluxos, jornada UX, auditoria
├── versoes/                  ← V1_x, V2_0, RELEASES
├── pesquisa/                 ← benchmark de mercado (transversal)
├── prompts/                  ← prompts ServiceOS v2.0 (implementação e sessão Cursor)
└── evidencias/               ← capturas e vídeos de validação
```

---

## Segmentos (ServiceOS v2.0)

| Segmento | Pasta | Tenant demo | Login interno |
|----------|-------|-------------|---------------|
| Saúde | [`segmentos/medical/`](segmentos/medical/) | Clínica Horizonte | `faturamento@bibi.health` |
| Veterinária | [`segmentos/vet/`](segmentos/vet/) | PetCare | `operacao@petcare.demo` |
| Odontologia | [`segmentos/dental/`](segmentos/dental/) | Smile Odonto | `operacao@smile.demo` |
| Jurídico | [`segmentos/legal/`](segmentos/legal/) | Lex & Partners | `operacao@lex.demo` |
| Bem-estar | [`segmentos/spa/`](segmentos/spa/) | Zen Studio | `operacao@zen.demo` |
| Educação | [`segmentos/education/`](segmentos/education/) | EduPrime | `operacao@eduprime.demo` |
| Engenharia | [`segmentos/construction/`](segmentos/construction/) | Build Corp | `operacao@build.demo` |

Senha demo universal: **`bibi123`**. Preview landing: `/?niche=VET`, `/?tenant=build`, etc.

---

## Plataforma

| Documento | Conteúdo |
|-----------|----------|
| [`plataforma/OPERACOES.md`](plataforma/OPERACOES.md) | Mapa de operações e regras para agentes |
| [`plataforma/ARQUITETURA.md`](plataforma/ARQUITETURA.md) | Diagramas, épicos, stack |
| [`plataforma/DEPLOY_NETLIFY.md`](plataforma/DEPLOY_NETLIFY.md) | Deploy e troubleshooting |
| [`plataforma/OPERACAO_DADOS.md`](plataforma/OPERACAO_DADOS.md) | Dual-store demo/operação |
| [`plataforma/VARIAVEIS_AMBIENTE.md`](plataforma/VARIAVEIS_AMBIENTE.md) | Env vars (local, CI, Netlify) |
| [`plataforma/TESTES.md`](plataforma/TESTES.md) | Estratégia e mapa de testes |
| [`plataforma/DESIGN_SYSTEM.md`](plataforma/DESIGN_SYSTEM.md) | Tokens, white label |
| [`plataforma/PAYMENTS.md`](plataforma/PAYMENTS.md) | Motor PIX / Strategy |
| [`plataforma/COMMUNICATIONS.md`](plataforma/COMMUNICATIONS.md) | Motor de comunicação |
| [`plataforma/BENCHMARK.md`](plataforma/BENCHMARK.md) | Matriz POC × mercado |
| [`plataforma/ROI_REFERENCIA.md`](plataforma/ROI_REFERENCIA.md) | ROI Pay Per Use — fórmulas e sensibilidade (saúde) |
| [`plataforma/NOTEBOOKLM.md`](plataforma/NOTEBOOKLM.md) | Corpus RAG |
| [`plataforma/WORKFLOW_CURSOR.md`](plataforma/WORKFLOW_CURSOR.md) | Dev sem deploy automático |
| [`plataforma/LANDING_CHANGELOG.md`](plataforma/LANDING_CHANGELOG.md) | Manutenção do bloco Novidades na home |

---

## Produto

| Documento | Conteúdo |
|-----------|----------|
| [`produto/FLUXOS.md`](produto/FLUXOS.md) | Fluxos E2E nos quatro portais |
| [`produto/ONBOARDING_TOUR.md`](produto/ONBOARDING_TOUR.md) | Tour guiado v3 (duas fases, micro-tours) |
| [`produto/JORNADA_CLIENTE.md`](produto/JORNADA_CLIENTE.md) | Jornada UX por portal |
| [`produto/AUDITORIA_FLUXOS.md`](produto/AUDITORIA_FLUXOS.md) | Gaps mapeados |

---

## Comercial e captação

| Documento | Conteúdo |
|-----------|----------|
| [`comercial/README.md`](comercial/README.md) | Índice — vendas e marketing por segmento |
| [`comercial/MODULOS_COMUNS.md`](comercial/MODULOS_COMUNS.md) | Features compartilhadas (4 portais + plataforma) |
| [`comercial/BENCHMARKS_POR_NICHO.md`](comercial/BENCHMARKS_POR_NICHO.md) | Concorrentes e matriz por vertical |
| [`comercial/CALCULADORA_ROI.md`](comercial/CALCULADORA_ROI.md) | Calculadora ROI da homepage |
| [`comercial/PLANO_HOMEPAGE.md`](comercial/PLANO_HOMEPAGE.md) | Plano de captação na homepage |
| [`comercial/ESTRATEGIA_SEGMENTOS.md`](comercial/ESTRATEGIA_SEGMENTOS.md) | Técnicas de captação por nicho |
| [`comercial/CAMPANHAS_Q3_2026.md`](comercial/CAMPANHAS_Q3_2026.md) | Índice campanhas por nicho |
| [`comercial/ANALISE_DIARIA.md`](comercial/ANALISE_DIARIA.md) | Ritual GA4 + CRM + planilha diária |
| [`comercial/PROXIMOS_PASSOS.md`](comercial/PROXIMOS_PASSOS.md) | Checklist release e execução |
| [`segmentos/README.md`](segmentos/README.md) | Playbook `COMERCIAL.md` em cada vertical |

---

## Versões e releases

| Documento | Conteúdo |
|-----------|----------|
| [`versoes/RELEASES.md`](versoes/RELEASES.md) | Pacotes fechados — **v2.3.0 na main** (produção v2.2.0) |
| [`versoes/V2_3.md`](versoes/V2_3.md) | Changelog v2.3 — onboarding fase 2, construction, OpenAPI |
| [`versoes/V2_1.md`](versoes/V2_1.md) | Changelog v2.1 — assistente, VET, change-mgmt, import |
| [`versoes/V2_0.md`](versoes/V2_0.md) | Escopo ServiceOS v2.0 |
| [`versoes/V2_0_ARCHITECTURE.md`](versoes/V2_0_ARCHITECTURE.md) | Arquitetura multi-nicho |
| [`versoes/V1_2.md`](versoes/V1_2.md) | Histórico (substituído por v2.0) |

---

## Pesquisa de mercado

Transversal a todos os segmentos: [`pesquisa/README.md`](pesquisa/README.md)

---

## Verificação de consistência

```bash
npm run docs:verify
```

O script falha se encontrar caminhos obsoletos na raiz de `docs/` (ex.: `docs/OPERACOES.md`), stubs em `docs/pesquisa/nichos/`, menções a **ServiceOS Bibi** ou links quebrados para `OPERACOES.md` / `FLUXOS.md` sem `plataforma/` ou `produto/`.
