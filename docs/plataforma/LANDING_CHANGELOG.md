# Changelog na landing — manutenção obrigatória

A home (`/`) exibe a seção **Novidades** (`#novidades`) com o changelog curado das versões em demonstração. O bloco é alimentado por código TypeScript — **não** lê `RELEASES.md` em runtime.

**Objetivo:** apresentar o que há de novo na demonstração para prospects, onboarding e apresentações comerciais.

---

## Arquivos envolvidos

| Arquivo | Papel |
|---------|-------|
| `src/lib/landing/changelog-content.ts` | **Fonte da UI** — releases, highlights, datas, testes |
| `src/components/landing/LandingChangelog.tsx` | Componente visual (acordeão + destaque) |
| `src/lib/platform.ts` | `PLATFORM.version` e `PLATFORM.versionLabel` (badge do hero e changelog) |
| `package.json` | Campo `version` (semver do pacote) |
| `docs/versoes/RELEASES.md` | Registro oficial do que está em produção |
| `docs/versoes/VX_Y.md` | Changelog detalhado da versão (ex.: `V2_1.md`) |

---

## Quando atualizar

| Momento | Ação |
|---------|------|
| **Fechar pacote** (merge `dev` → `main` + deploy) | Atualizar changelog da landing **junto** com `RELEASES.md` |
| **Feature visível na demo** que entra no pacote | Incluir bullet no grupo temático correto da release `current` |
| **Nova versão major/minor** | Nova entrada `current`; versão anterior vira `previous` |
| **Durante desenvolvimento em `dev`** | Opcional — só obrigatório ao fechar pacote ou ao abrir PR de release |

> **Regra:** se `RELEASES.md` marca uma versão como **em produção**, a landing deve mostrar a mesma versão em `#novidades`. `npm run docs:verify` valida o alinhamento.

---

## Checklist — fechar pacote (changelog)

Execute **na mesma sessão** que atualiza `RELEASES.md` e `src/lib/platform.ts`:

- [ ] `package.json` → `"version": "X.Y.Z"`
- [ ] `src/lib/platform.ts` → `version: "X.Y"` e `versionLabel: "Sistema Bibi - ServiceOS vX.Y"`
- [ ] `src/lib/landing/changelog-content.ts`:
  - [ ] Nova release no topo de `CHANGELOG_RELEASES` com `status: "current"`
  - [ ] Release anterior com `status: "previous"` (manter no máximo **2–3** releases na home)
  - [ ] `summary` em linguagem de produto (não jargão de PR/deploy)
  - [ ] `highlights` agrupados por tema (Segurança, Assistente, VET, Operação, Landing…)
  - [ ] `date` da publicação (DD/MM/AAAA)
  - [ ] `testStats` com contagem real (`npm run test` / `pre-release`)
  - [ ] `label` da release atual usa `PLATFORM.versionLabel` (não hardcodar)
- [ ] `docs/versoes/VX_Y.md` — changelog técnico completo
- [ ] `docs/versoes/RELEASES.md` — pacote em produção
- [ ] Smoke test local: `npm run dev` → `/#novidades` → acordeão vX.Y.Z expandido
- [ ] `npm run docs:verify` e `npm run lint`

---

## O que colocar na UI (e o que não)

### Incluir

- Funcionalidades demonstráveis nos 4 portais
- Melhorias de landing, segmentos e white label
- Números de credibilidade (testes, cobertura E2E)
- CTAs já presentes: “Explorar nos portais”, “Ver segmentos”

### Não incluir

- IDs de deploy Netlify, hashes de commit, matriz de branches
- Detalhes de rollback, cota `usage_exceeded`, secrets
- Números de PR (opcional só em docs técnicos)
- Parsing automático de markdown em build — manter curadoria em TS

---

## Modelo de dados (`changelog-content.ts`)

```ts
export type ChangelogRelease = {
  version: string;           // "2.1.0" — alinhar com package.json
  label: string;             // PLATFORM.versionLabel na release current
  date: string;              // "24/06/2026"
  status: "current" | "previous";
  summary: string;
  highlights: { title: string; items: string[] }[];
  testStats?: string;
};
```

**Ordem:** a primeira entrada de `CHANGELOG_RELEASES` deve ser a versão `current`.

---

## Exemplo — promover v2.1.0 → v2.2.0

```ts
// 1. Adicionar nova release no topo
{
  version: "2.2.0",
  label: PLATFORM.versionLabel,
  date: "DD/MM/AAAA",
  status: "current",
  summary: "Resumo em uma frase para prospects.",
  highlights: [
    { title: "Tema A", items: ["Bullet 1", "Bullet 2"] },
  ],
  testStats: "NNN testes Vitest · NNN E2E · pre-release OK",
},
// 2. Rebaixar a anterior
{
  version: "2.1.0",
  label: "Sistema Bibi - ServiceOS v2.1",
  status: "previous",
  // ...
},
```

Remover releases muito antigas da home (manter 2–3). Histórico completo permanece em `RELEASES.md`.

---

## Validação automática

`npm run docs:verify` verifica:

- `package.json#version` = primeira release `current` em `changelog-content.ts`
- `PLATFORM.version` é prefixo da versão current (ex.: `"2.1"` ↔ `"2.1.0"`)

---

## Referências

- Checklist de release: [`OPERACOES.md`](OPERACOES.md) §5.2
- Workflow Cursor: [`WORKFLOW_CURSOR.md`](WORKFLOW_CURSOR.md)
- Pacotes fechados: [`../versoes/RELEASES.md`](../versoes/RELEASES.md)
- Design system (landing): [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) § Landing pública
