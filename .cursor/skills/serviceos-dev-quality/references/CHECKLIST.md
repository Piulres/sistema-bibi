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
- [ ] `npm run lint` OK nos arquivos tocados
- [ ] `npm run docs:verify` se mexeu em versão/changelog/docs estruturados

## Entrega

- [ ] Branch `cursor/*-5f67`
- [ ] PR base **`dev`**
- [ ] Sem `netlify deploy` / `db:reset` sem pedido explícito
- [ ] Handoff: validação + riscos

## Comandos úteis

```bash
npm run setup   # VM nova: .env + db:push + seed (idempotente, não destrutivo)
npm run lint
npx vitest run tests/unit/<arquivo>.test.ts
npm run docs:verify
npx playwright test e2e/<spec>.spec.ts --project=chromium
```

## Gotchas de teste (VM/dev)

- **E2E:** pare o `npm run dev` antes de `npm run test:e2e` (Next 16 = um dev server por projeto; Playwright sobe o próprio na porta 3100) e rode `npx playwright install chromium` uma vez.
- **500 `table main.User does not exist`** após `npm run test`: resíduo do dual-store — `rm -f prisma/.data-store-mode prisma/operation.db` ou `npm run setup`.
- Detalhe: `docs/plataforma/TESTES.md` §Setup e gotchas.
