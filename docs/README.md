# Documentação Sistema Bibi - ServiceOS v2.0

Índice canônico da documentação. O ServiceOS é uma **plataforma horizontal Pay Per Use** — a mesma infraestrutura serve múltiplos segmentos de serviços profissionais, alterando vocabulário (labels), branding e landing por tenant.

> **Não é mais só HealthTech.** Saúde (`MEDICAL`) é um segmento entre seis. Comece pelo segmento do seu tenant ou pela documentação de plataforma.

---

## Por onde começar

| Perfil | Documento |
|--------|-----------|
| Desenvolvedor / agente IA | [`AGENTS.md`](../AGENTS.md) · [`prompts/README.md`](prompts/README.md) |
| Operações e deploy | [`plataforma/OPERACOES.md`](plataforma/OPERACOES.md) |
| Escopo v2.0 | [`versoes/V2_0.md`](versoes/V2_0.md) |
| Fluxos de produto | [`produto/FLUXOS.md`](produto/FLUXOS.md) |
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

Senha demo universal: **`bibi123`**. Preview landing: `/?niche=VET`, `/?niche=LEGAL`, etc.

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
| [`plataforma/NOTEBOOKLM.md`](plataforma/NOTEBOOKLM.md) | Corpus RAG |
| [`plataforma/WORKFLOW_CURSOR.md`](plataforma/WORKFLOW_CURSOR.md) | Dev sem deploy automático |

---

## Produto

| Documento | Conteúdo |
|-----------|----------|
| [`produto/FLUXOS.md`](produto/FLUXOS.md) | Fluxos E2E nos quatro portais |
| [`produto/JORNADA_CLIENTE.md`](produto/JORNADA_CLIENTE.md) | Jornada UX por portal |
| [`produto/AUDITORIA_FLUXOS.md`](produto/AUDITORIA_FLUXOS.md) | Gaps mapeados |

---

## Versões e releases

| Documento | Conteúdo |
|-----------|----------|
| [`versoes/RELEASES.md`](versoes/RELEASES.md) | Pacotes fechados — produção vs pendente |
| [`versoes/V2_0.md`](versoes/V2_0.md) | Escopo ServiceOS v2.0 |
| [`versoes/V2_0_ARCHITECTURE.md`](versoes/V2_0_ARCHITECTURE.md) | Arquitetura multi-nicho |
| [`versoes/V1_2.md`](versoes/V1_2.md) | Release anterior em produção |

---

## Pesquisa de mercado

Transversal a todos os segmentos: [`pesquisa/README.md`](pesquisa/README.md)

---

## Verificação de consistência

```bash
npm run docs:verify
```

O script falha se encontrar caminhos de documentação obsoletos (`docs/OPERACOES.md` na raiz), arquivo `08-prompt-healthos-expansao.md` (renomeado) ou menções desatualizadas a **HealthOS** / **Sistema Bibi** fora do contexto histórico v1.x.
