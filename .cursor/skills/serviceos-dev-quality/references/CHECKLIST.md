# Checklist rápido — skill `serviceos-dev-quality`

Use antes do commit / PR.

## Produto

- [ ] Nome **Sistema Bibi - ServiceOS** (nunca HealthOS em código/docs novos)
- [ ] UI autenticada usa `useLabels()` / labels do tenant
- [ ] Segmento: `?tenant=` + cookie respeitados se a feature toca login/acesso

## Código

- [ ] Escopo mínimo — só arquivos da feature/bug
- [ ] Padrão alinhado ao repo (service + API + view)
- [ ] Sem `setState` síncrono em `useEffect` (ESLint)
- [ ] Prisma 6 — sem upgrade ad hoc
- [ ] Auth/RBAC nas rotas novas (`requireInternoModule` / write guard)

## Qualidade

- [ ] Causa raiz explicada (bugs)
- [ ] Teste Vitest para lógica pura / serviço crítico
- [ ] Títulos WHAT+WHY (`describe`/`it`/`test`) — legíveis no CI Summary
- [ ] Nomes de massa/fixture realistas (sem `Demo`/`E2E`/`Teste` no display)
- [ ] `npm run lint` OK nos arquivos tocados
- [ ] `npm run docs:verify` se mexeu em versão/changelog/docs estruturados
- [ ] `npm run cursor:verify` se mexeu em `.cursor/` ou `AGENTS.md`

## Entrega

- [ ] Branch `cursor/*` → PR base **`dev`**
- [ ] Sem `netlify deploy` / `db:reset` sem pedido explícito
- [ ] Handoff: validação + riscos

## Comandos úteis

```bash
npm run setup
npm run lint
npx vitest run tests/unit/<arquivo>.test.ts
npm run docs:verify
npm run cursor:verify
npx playwright test e2e/<spec>.spec.ts --project=chromium
```

## Gotchas

- **E2E:** pare `npm run dev` antes de `npm run test:e2e`
- **500 pós-teste:** `npm run setup` ou remova `prisma/.data-store-mode`
- Detalhe: `.cursor/rules/tests.mdc` · `docs/plataforma/TESTES.md`
