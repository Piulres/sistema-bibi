# Prompt de sessão — Sistema Bibi - ServiceOS (Cursor)

Copie este bloco ao **iniciar uma sessão** no Cursor para alinhar contexto e evitar regressão para v1.x / HealthOS.

---

```markdown
# Contexto — Sistema Bibi - ServiceOS v3.0.7

Você trabalha no **Sistema Bibi - ServiceOS v3.0.7** — infraestrutura SaaS **multi-segmento** Pay Per Use (PWA `/instalar` em produção).
Não é HealthOS: saúde é o segmento `MEDICAL`; há também VET, DENTAL, LEGAL, SPA, EDUCATION, CONSTRUCTION.

## Antes de codificar

1. Ler `AGENTS.md` e `docs/prompts/SERVICEOS_V2_IMPLEMENTATION.md`
2. Seguir o skill **`/serviceos-dev-quality`** — router em `.cursor/rules/router.mdc`
3. Confirmar segmento/tenant: `docs/segmentos/README.md` e `?tenant=` (ex. `petcare`, `cedig`)
4. Branch `cursor/*` → PR para **`dev`** (nunca `main` direto)

## Invariantes de produto

- **Labels:** `useLabels()` nos portais — nunca "Paciente"/"Beneficiário" fixos
- **Segmento:** `Tenant.niche` + `Tenant.slug` + cookie `bibi_segment`
- **Login:** colaborador deve pertencer ao tenant do site (`?tenant=` ou domínio)
- **Motor único:** faturamento Pay Per Use, agenda, portais — só muda vocabulário e branding

## Invariantes técnicos

- Next.js 16, React 19, Prisma **6**, proxy em `src/proxy.ts`
- `await params`, `await searchParams`, `await cookies()`
- Escopo mínimo; não deploy sem pedido explícito

## Documentação

- Índice: `docs/README.md`
- Produção: `docs/versoes/RELEASES.md` · multi-nicho: `docs/versoes/V2_0.md` · PWA: `docs/versoes/V3_0.md`
- Prompts: `docs/prompts/README.md`

## Não fazer

- Posicionar como "HealthOS" ou "só saúde" em UI/docs novos
- Hardcodar strings de nicho em componentes autenticados
- `npm run db:reset` (bloqueado para agentes)
- `netlify deploy --prod` sem pedido explícito
```

---

## Handoff ao encerrar sessão

Registrar no PR ou commit:

- Segmentos/tenants afetados
- Arquivos de labels/navegação tocados
- Se docs/prompts precisam atualização
- Comando de validação: `npm run lint` + `npm run docs:verify`
