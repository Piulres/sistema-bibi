# Prompt — ServiceOS segmento saúde (expansão 2026)

Prompt para pesquisa externa e conteúdo estratégico do **segmento `MEDICAL`** do ServiceOS.

> **Nota histórica:** na v1.x o codinome interno era *HealthOS*. Em v2.0+ use **ServiceOS** como marca; *HealthOS* só em arquivo histórico.

Resultado canônico: [`../segmentos/medical/pesquisa-expansao-2026.md`](../segmentos/medical/pesquisa-expansao-2026.md)

---

## Prompt completo (copiar e colar)

```markdown
# Contexto

Atue como Consultor Sênior de Estratégia em plataformas de serviços profissionais.

Estamos escalando o **Sistema Bibi - ServiceOS v2.0** — infraestrutura SaaS multi-tenant **Pay Per Use**, com foco inicial no segmento **saúde corporativa** (`MEDICAL`).

- **4 portais:** Prestador, Interno, Empresa PJ, Beneficiário (vocabulário adaptável por segmento)
- **Stack:** Next.js 16, React 19, Prisma 6
- **Diferencial:** Price Snapshot — preço congelado no ato (`priceCharged`), precificação dinâmica B2B (`PricingRule.multiplier`)
- **Multi-segmento:** mesmo motor para vet, odonto, jurídico, etc. — este prompt é só para **saúde**

# Tarefa

## 1. Análise de ROI comparativa (500 colaboradores)

- Plano tradicional: R$ 350/mês/vida
- ServiceOS Pay Per Use: R$ 153/consulta @ 15% utilização
- Tabela de sensibilidade, break-even, fee plataforma R$ 3–8/vida
- Marcar FATO vs INFERÊNCIA

## 2. Scripts comercial RH/CFO

Pitch 60s, objeções, piloto 90 dias.

## 3. Roadmap segmento saúde

Memed, WhatsApp, SBIS — priorização Tier 1.

## 4. Posicionamento

ServiceOS como infraestrutura transacional Pay Per Use — **não** ERP clínico genérico.

Entregue em PT-BR, tabelas markdown, sem inventar URLs.
```

---

## Uso no Cursor

1. Colar o bloco acima em pesquisa externa ou NotebookLM
2. Salvar resultado em `docs/segmentos/medical/` se atualizar pesquisa
3. Cruzar com `docs/plataforma/BENCHMARK.md` e `docs/versoes/V2_0.md`
