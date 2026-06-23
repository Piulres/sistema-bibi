# Prompt: Implementação ServiceOS v2.0 — Labels e Documentação

Use este prompt em **Cursor**, **Copilot** ou outro assistente ao evoluir o Sistema Bibi.

---

## Contexto

Atue como Engenheiro de Software Sênior. O Sistema Bibi evoluiu de POC HealthTech para **ServiceOS v2.0** — infraestrutura horizontal Pay Per Use multi-nicho (Saúde, Vet, Odonto, Jurídico, Bem-estar, Educação).

**ROI de referência:** 500 colaboradores — ~R$ 175k/mês (tradicional) vs ~R$ 14,5k/mês (Pay Per Use) = **~91% economia**.

---

## Regras obrigatórias — dicionário de labels

1. **Nunca** hardcodar "Paciente", "Beneficiário" ou "Procedimento" em componentes client dos portais.
2. **Sempre** usar `useLabels()` → `labels.patient`, `labels.procedures`, etc.
3. **Novos nichos** começam em `src/constants/niches.ts` (`NICHE_MASTER_LABELS`) com todas as chaves de `NICHE_LABEL_KEYS`.
4. **Seeds** usam `serializeTenantLabels(niche, overrides?)` para popular `Tenant.labels`.
5. Consultar `AGENTS.md` (glossário) e `docs/V2_0_ARCHITECTURE.md` antes de criar telas.

---

## Tarefas típicas

### Data layer
- `Tenant.niche` + `Tenant.labels` (JSON) no Prisma
- Seed com demos: Consulta Odontológica (R$ 350), Hora Técnica Jurídica (R$ 500), Banho e Tosa (R$ 150)

### UI
- `useLabels()` nos portais autenticados
- Navegação dinâmica: `buildPrestadorNavTabs`, `buildCadastrosTabs`, etc.
- Landing com `getNicheLandingContent(niche)` e `?niche=VET` para preview

### Documentação
- README: título ServiceOS, ROI 91%, faixa R$ 300–500
- `docs/ARQUITETURA.md`: Camada de Abstração de Linguagem
- `docs/pesquisa/`: matriz competitiva, roadmap Memed/WhatsApp/SBIS

---

## Diretriz

**Anti over-engineering:** reaproveitar motores de faturamento e agendamento; mudar apenas labels, branding e landing por nicho.

---

## Arquivos canônicos

| Arquivo | Papel |
|---------|-------|
| `src/constants/niches.ts` | Dicionário mestre tipado |
| `src/hooks/useLabels.tsx` | Hook de UI |
| `src/lib/niche/labels.ts` | Merge tenant + defaults |
| `prisma/seed-data/niche-tenants.ts` | Demos multi-nicho |
| `AGENTS.md` | Glossário + regra para IAs |
