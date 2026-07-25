# Validação v2.3.0 — ambiente dev local

**Data:** 27/06/2026  
**Branch:** `dev` @ `05a63eb`  
**Servidor:** `npm run dev` → http://localhost:3000  
**Credenciais:** `bibi123`

---

## Testes automatizados

| Comando | Resultado |
|---------|-----------|
| `npm run docs:verify` | ✅ OK |
| `npm run lint` | ✅ OK |
| `npm run test -- tests/unit/onboarding.test.ts` | ✅ 21/21 |
| `npm run test -- tests/unit/project.test.ts` | ✅ |
| `npm run test -- tests/unit/openapi-contract.test.ts` | ✅ |
| **Lote v2.3** (onboarding + project + openapi) | ✅ **38/38** |

---

## Testes manuais (desktop)

| # | Fluxo | Resultado | Observações |
|---|-------|-----------|-------------|
| 1 | Tour principal interno (1º login) | ✅ PASS | ~5 passos; passo `nav-modules` com lista condensada |
| 2 | Micro-tour `/interno` (faturamento) | ✅ PASS | 3 passos: Cliente 360°, pendências PPU, faturas |
| 3 | Micro-tour `/interno/agenda` | ✅ PASS | 2 passos: walk-in + agenda |
| 4 | OpenAPI `/api/docs` | ✅ PASS | Swagger UI carrega; spec lista Auth, Prestador… |
| 5 | Segmento Build `/?tenant=build` | ✅ PASS | Landing Engenharia Civil |
| 6 | Obras `/interno/projetos` | ✅ PASS | Pipeline Orçamento→Em obra; micro-tour do módulo |

### Como reproduzir o tour

```javascript
localStorage.removeItem('bibi_onboarding');
location.reload();
```

Login: `faturamento@bibi.health` → tour principal. Depois navegue para `/interno` e `/interno/agenda` para micro-tours.

---

## Documentação criada/atualizada

| Arquivo | Conteúdo |
|---------|----------|
| [`versoes/V2_3.md`](../versoes/V2_3.md) | Changelog consolidado v2.3 |
| [`produto/ONBOARDING_TOUR.md`](../produto/ONBOARDING_TOUR.md) | Arquitetura tour v3, mapa, persistência |
| [`README.md`](../README.md) | Índice + segmento Construction |
| [`plataforma/TESTES.md`](../plataforma/TESTES.md) | Seção onboarding v3 |
| [`versoes/RELEASES.md`](../versoes/RELEASES.md) | Pacote em produção v2.3.0 |

---

## Pendências conhecidas

- OpenAPI UI exibe versão legada no título Swagger (metadado `openapi.yaml`) — não bloqueia funcionalidade

---

## Produção (25/07/2026)

Pacote **v2.3.0** publicado após `npm run pre-release` — deploy Netlify `6a6436ef` @ `374b13e` (`bibi-poc-2026-07-25a`).

| Smoke test | Resultado |
|------------|-----------|
| `GET /` | ✅ HTTP 200 — landing exibe **v2.3** em `#novidades` |
| `/_next/static/chunks/*.css` | ✅ HTTP 200 |
| `/interno/login`, `/login` | ✅ HTTP 200 |
| `/api/docs` | ✅ HTTP 200 — Swagger UI |

**Tags git:** `v2.2.0` e `v2.3.0` publicadas no remoto. **Stop builds:** ON (sem auto-deploy em push).

Registro oficial: [`versoes/RELEASES.md`](../versoes/RELEASES.md).
