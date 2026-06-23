# Prompt — HealthOS Expansão 2026

Prompt para pesquisa externa e geração de conteúdo estratégico. Resultado canônico interno: [`07-healthos-expansao-2026.md`](07-healthos-expansao-2026.md).

---

## Prompt completo (copiar e colar)

```markdown
# Contexto

Atue como Consultor Sênior de Estratégia em HealthTech.

Estamos escalando o **Sistema Bibi** — plataforma SaaS multi-tenant no modelo **Pay Per Use** (saúde sob demanda), posicionada como **HealthOS para Saúde Corporativa**.

- **4 portais:** Prestador, Interno, Empresa PJ, Beneficiário
- **Stack:** Next.js 16, React 19, Prisma 6
- **Diferencial:** Price Snapshot — preço congelado no ato do atendimento (`priceCharged`), com precificação dinâmica por empresa (`PricingRule.multiplier`)

# Tarefa

Com base nesse posicionamento, entregue:

## 1. Análise de ROI comparativa

Compare:
- Plano digital tradicional **por vida:** R$ 350/mês/colaborador
- **Bibi Pay Per Use:** R$ 153/consulta, taxa de utilização **15%**
- Empresa de **500 colaboradores**

Inclua:
- Custo mensal e anual de cada modelo
- Economia absoluta e percentual
- Tabela de sensibilidade (5%, 10%, 15%, 25%, 40%, 60%, 100%)
- Ponto de equilíbrio (break-even)
- Custo efetivo por consulta no modelo fixo
- Cenário com fee de plataforma Bibi (R$ 3–8/vida)

Separe **FATO** (matemática, premissas declaradas) de **INFERÊNCIA** (mercado, adoção).

## 2. Gaps de interoperabilidade

### Memed (prescrição)
Etapas técnicas de integração (API, widget, webhook, prescritor), checklist LGPD, relação com TISS.

### WhatsApp Business API
Etapas Meta/BSP, templates, opt-in LGPD, arquitetura adapter.

### SBIS PEP
Impacto no roadmap 12 meses para vendas enterprise; prazos e custos típicos.

## 3. Scripts validação comercial (RH/CFO)

Roteiro "Validação Brutal" (45–60 min) para empresas 100–1.000 funcionários.

Foco: sair da "caixa preta" da sinistralidade → visibilidade Portal PJ Bibi.

Inclua: perguntas RH, perguntas CFO, objeções, critérios piloto 90 dias.

## 4. Inteligência competitiva Tier 1

Compare **Saúde Populacional** e **Analytics** do Bibi com:
- Pipo Saúde
- Vitta
- Conexa

Explique como **Precificação Dinâmica + Price Snapshot** supera tabelas fixas desses players.

# Output

- Tabelas comparativas
- Bullet points estratégicos
- Tags **FATO** e **INFERÊNCIA** em cada seção
- Português (Brasil)
- URLs para claims de mercado dos concorrentes
- Não inventar dados sem fonte
```

---

## Variante curta

```markdown
HealthOS Bibi: Pay Per Use, 4 portais, Price Snapshot. ROI 500 colaboradores: R$350/vida/mês vs R$153/consulta @15% uso. Gaps Memed + WhatsApp + SBIS. Script validação RH/CFO. Compare populacional/analytics vs Pipo, Vitta, Conexa. FATO vs INFERÊNCIA. PT-BR.
```

---

Ver também: [`05-prompt-pesquisa-externa.md`](05-prompt-pesquisa-externa.md)
