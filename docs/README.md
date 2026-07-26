# Documentação Sistema Bibi - ServiceOS v3.0

Índice canônico da documentação. O ServiceOS é uma **plataforma horizontal Pay Per Use** — a mesma infraestrutura serve múltiplos segmentos de serviços profissionais, alterando vocabulário (labels), branding e landing por tenant.

> **Produção:** **v3.0.5** @ https://sistema-bibi.netlify.app · deploy `bibi-poc-2026-07-26e` · [`versoes/RELEASES.md`](versoes/RELEASES.md) · changelog [`versoes/V3_0.md`](versoes/V3_0.md) · PWA [`/instalar`](https://sistema-bibi.netlify.app/instalar).

> **Última revisão factual:** 26/07/2026 — produção **v3.0.5** (`bibi-poc-2026-07-26e` @ `cf0eb26`): jornada faturada no prestador (`care-journey.ts`), documentos clínicos ([`produto/DOCUMENTOS_CLINICOS.md`](produto/DOCUMENTOS_CLINICOS.md)), landing nav 6 itens e header limpo — ver [`produto/FLUXOS.md`](produto/FLUXOS.md) §8.9 · [`plataforma/DESIGN_SYSTEM.md`](plataforma/DESIGN_SYSTEM.md) · TISS 422 §4.1 · OpenAPI **123 paths / 160 handlers** · **587 Vitest** · `pre-release` e `cursor:verify` em [`plataforma/WORKFLOW_CURSOR.md`](plataforma/WORKFLOW_CURSOR.md).

> **Não é mais só HealthTech.** Saúde (`MEDICAL`) é um segmento entre vários (inclui Engenharia/`CONSTRUCTION`). Comece pelo segmento do seu tenant ou pela documentação de plataforma.

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

## Documentação viva

Regras e checklist para agentes: [`plataforma/DOCUMENTACAO.md`](plataforma/DOCUMENTACAO.md).

- **Versão em produção** → [`versoes/RELEASES.md`](versoes/RELEASES.md) (única fonte)
- **Piloto CEDIG** → [`clientes/cedig/STATUS.md`](clientes/cedig/STATUS.md) (status + timeline)
- **Não criar** `FASE_N.md` / `GO_LIVE_*.md` / `HISTORICO_YYYY-MM-DD.md` — atualize o status vivo

## Estrutura de pastas

```
docs/
├── README.md                 ← você está aqui
├── clientes/                 ← pilotos (STATUS + OPERACAO + HOMOLOGACAO)
├── segmentos/                ← documentação por vertical
├── plataforma/               ← operação, arquitetura, deploy, design system
├── produto/                  ← fluxos, jornada UX, auditoria
├── versoes/                  ← RELEASES + changelogs V1/V2/V3
├── pesquisa/                 ← benchmark de mercado
├── prompts/                  ← prompts para agentes
└── evidencias/               ← capturas e vídeos
```

---

## Clientes (piloto)

| Cliente | Docs vivos |
|---------|------------|
| CEDIG Cruzeiro | [`STATUS.md`](clientes/cedig/STATUS.md) · [`OPERACAO.md`](clientes/cedig/OPERACAO.md) · [`README.md`](clientes/cedig/README.md) |

---

## Segmentos (base multi-nicho desde v2.0)

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
| [`plataforma/DOCUMENTACAO.md`](plataforma/DOCUMENTACAO.md) | Regras de documentação viva (agentes) |
| [`plataforma/OPERACOES.md`](plataforma/OPERACOES.md) | Mapa de operações e regras para agentes |
| [`plataforma/VOA_INTEGRATION.md`](plataforma/VOA_INTEGRATION.md) | Integração Voa Health (assistente) |
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
| [`produto/DOCUMENTOS_CLINICOS.md`](produto/DOCUMENTOS_CLINICOS.md) | Atestado, receita comum/especial, protocolos de exames |
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
| [`versoes/RELEASES.md`](versoes/RELEASES.md) | Pacotes fechados — **v3.0.5 em produção** |
| [`versoes/V3_0.md`](versoes/V3_0.md) | Changelog v3.0 — PWA / app shell mobile |
| [`versoes/V2_6.md`](versoes/V2_6.md) | Changelog v2.6 — CEDIG pontes PPU + export |
| [`versoes/V2_5.md`](versoes/V2_5.md) | Changelog v2.5 — login tenant/portal |
| [`versoes/V2_4.md`](versoes/V2_4.md) | Changelog v2.4 — CEDIG gestão clínica |
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
