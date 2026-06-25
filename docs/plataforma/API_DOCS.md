# Documentação da API — Swagger UI

Guia para explorar, testar e validar o contrato **OpenAPI 3.0** do **Sistema Bibi - ServiceOS**.

| Recurso | URL (dev) | URL (produção) |
|---------|-----------|----------------|
| **Swagger UI (interativo)** | http://localhost:3000/api/docs | https://sistema-bibi.netlify.app/api/docs |
| **Spec YAML** | http://localhost:3000/openapi.yaml | https://sistema-bibi.netlify.app/openapi.yaml |
| Legado (redirect) | `/api-docs.html` → `/api/docs` | idem |

Fonte da spec: [`public/openapi.yaml`](../../public/openapi.yaml) · Fluxos de negócio: [`produto/FLUXOS.md`](../produto/FLUXOS.md) §11.

---

## 1. Plano de execução (para você rodar)

### Pré-requisitos

```bash
cp .env.example .env          # se ainda não existir
npm install                     # postinstall gera Prisma + copia Swagger UI
npm run db:push && npm run db:seed   # VM nova sem banco
```

### Passo 1 — Subir o servidor

```bash
npm run dev
```

Aguarde `Ready` em http://localhost:3000.

### Passo 2 — Abrir o Swagger

No navegador: **http://localhost:3000/api/docs**

Você deve ver o cabeçalho do ServiceOS e a árvore de tags (Auth, Prestador, Interno, PJ, Beneficiário, …).

### Passo 3 — Autenticar (cookie de sessão)

1. No Swagger, expanda **Auth** → `POST /api/auth/login`
2. **Try it out** com um corpo de exemplo:

```json
{
  "email": "dra.helena@bibi.health",
  "password": "bibi123",
  "portal": "prestador"
}
```

3. Execute — resposta `200` define o cookie `bibi_session` (o Swagger usa `withCredentials: true`)
4. Teste `GET /api/auth/me` ou `GET /api/prestador/agenda`

**Outros portais (mesma senha `bibi123`):**

| Portal | `portal` no body | E-mail demo |
|--------|------------------|-------------|
| Prestador | `prestador` | `dra.helena@bibi.health` |
| Interno | `interno` | `faturamento@bibi.health` |
| PJ | `pj` | `rh@techcorp.com` |
| Beneficiário | `beneficiario` | `joao.pereira@email.com` |

### Passo 4 — Validar contrato e testes automatizados

```bash
# Valida YAML, paths e cobertura vs Route Handlers
npm run openapi:verify

# Testes unitários do contrato + assets Swagger
npm run test -- tests/unit/openapi-contract.test.ts

# E2E: página /api/docs, redirect legado, assets self-hosted
npm run test:e2e -- e2e/api-docs.spec.ts

# Pacote completo (lint + docs + openapi + test + build)
npm run pre-release
```

### Passo 5 — Produção (quando publicar)

Após deploy manual (`npx netlify deploy --prod`):

- Swagger: https://sistema-bibi.netlify.app/api/docs
- YAML: https://sistema-bibi.netlify.app/openapi.yaml

> Se o site retornar **503 `usage_exceeded`**, é cota Netlify — não é falha do Swagger. Use dev local.

---

## 2. Arquitetura da documentação

```
public/openapi.yaml          ← contrato (73 paths, v2.1)
public/swagger-ui/           ← assets gerados (postinstall, gitignored)
src/app/api/docs/page.tsx    ← URL canônica /api/docs
src/components/api-docs/     ← cliente Swagger UI (CSP-safe)
scripts/verify-openapi.mjs   ← validação CI/pre-release
scripts/copy-swagger-ui.mjs  ← cópia de node_modules/swagger-ui-dist
```

**Por que self-hosted?** O CSP do projeto (`script-src 'self'`) bloqueia CDN externo. Os assets ficam em `/swagger-ui/*` e funcionam em dev e Netlify.

**Redirect legado:** `/api-docs.html` redireciona permanentemente para `/api/docs` (Next.js + HTML estático).

---

## 3. Mapa de testes

| Camada | Arquivo | O que valida |
|--------|---------|--------------|
| Script | `npm run openapi:verify` | YAML válido, ≥70 paths, sem paths órfãos |
| Vitest | `tests/unit/openapi-contract.test.ts` | Metadados, cookie auth, servidores, assets |
| Playwright | `e2e/api-docs.spec.ts` | UI carrega, YAML 200, redirect legado |
| Pre-release | `scripts/pre-release.mjs` | Inclui `openapi:verify` no pipeline |

Credenciais e env de teste: [`TESTES.md`](TESTES.md) · [`VARIAVEIS_AMBIENTE.md`](VARIAVEIS_AMBIENTE.md).

---

## 4. Exemplo com curl (sem Swagger)

```bash
# Login
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dra.helena@bibi.health","password":"bibi123","portal":"prestador"}'

# Agenda
curl -b cookies.txt http://localhost:3000/api/prestador/agenda
```

---

## 5. Manutenção do contrato

Ao criar ou alterar Route Handlers em `src/app/api/**/route.ts`:

1. Atualize `public/openapi.yaml` com path, método, schemas e segurança
2. Rode `npm run openapi:verify` — paths documentados sem handler correspondente **falham**
3. Handlers ainda não documentados geram **aviso** (hoje ~49 rotas secundárias fora do escopo público)

Roadmap: testes de contrato de resposta (P1 em [`TESTES.md`](TESTES.md)).

---

## 6. Referências

- [`ARQUITETURA.md`](ARQUITETURA.md) §20 — visão geral da API
- [`FLUXOS.md`](../produto/FLUXOS.md) §11 — mapa de APIs por portal
- [`RELEASES.md`](../versoes/RELEASES.md) — versão em produção
- Landing: botão **Ver API (Swagger)** → `/api/docs`
