# Prompt de sessão — ServiceOS v2.0 (Cursor)

Copie este bloco ao **iniciar uma sessão** no Cursor para alinhar contexto e evitar regressão para v1.x / HealthOS.

---

```markdown
# Contexto — ServiceOS Bibi v2.0

Você trabalha no **ServiceOS Bibi v2.0** — infraestrutura SaaS **multi-segmento** Pay Per Use.
Não é mais uma POC HealthTech única: saúde é o segmento `MEDICAL`; há também VET, DENTAL, LEGAL, SPA, EDUCATION.

## Antes de codificar

1. Ler `AGENTS.md` e `docs/prompts/SERVICEOS_V2_IMPLEMENTATION.md`
2. Confirmar segmento/tenant: `docs/segmentos/README.md` e `?tenant=` (ex. `petcare`, `horizonte`)
3. Branch `cursor/*` → PR para **`dev`** (nunca `main` direto)

## Invariantes de produto (v2.0)

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
- Escopo v2: `docs/versoes/V2_0.md`
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
