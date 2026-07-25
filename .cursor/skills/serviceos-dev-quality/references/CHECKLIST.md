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
npm run lint
npx vitest run tests/unit/<arquivo>.test.ts
npm run docs:verify
npx playwright test e2e/<spec>.spec.ts --project=chromium
```
