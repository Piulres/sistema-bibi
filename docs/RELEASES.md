# Releases — Pacotes fechados do Sistema Bibi

Registro oficial do que está **em produção**, do que está **pendente na `dev`**
e do histórico de publicações. Use este arquivo como fonte única de verdade.

**Fluxo de branches:** features integram em `dev` → release merge `dev` → `main` → deploy.

**Produção:** https://sistema-bibi.netlify.app

---

## Status agora (22/06/2026)

| Item | Valor |
|------|-------|
| **Versão em produção** | **1.1.0** — Care Chart (`8c8cd01`) |
| **Deploy Netlify** | Auto-deploy da `main` (publicado `main@8c8cd01`) |
| `main` | `8c8cd01` — release / produção |
| `dev` | Integração — cadastros, auditoria, homepage + sync `main` |
| **Tag git em produção** | **`v1.1.0`** |
| Próximo pacote | Integração `dev` (auditoria #84, homepage #88, exports #85, cadastros) |
| Validação | `npm run pre-release` |

### Sincronização de ambientes

| Ambiente | Branch | Conteúdo |
|----------|--------|----------|
| **Integração** | `dev` | Produção **+** features em integração — **novas atividades aqui** |
| **Release / produção** | `main` | Pacote **v1.1.0** Care Chart |
| **Netlify** | `main` | Espelha produção |

> **Regra:** PRs de feature/bugfix → base **`dev`**. Merge `dev` → `main` só ao fechar pacote.

---

## Pacote em produção (fechado)

### `v1.1.0` — Care Chart (prontuário clínico estendido)

| Campo | Valor |
|-------|-------|
| **Tag git** | `v1.1.0` |
| **Commit** | `8c8cd01` |
| **PR** | [#86](https://github.com/Piulres/sistema-bibi/pull/86) |
| **Publicado em** | 22/06/2026 — deploy Netlify (build Git, `main`) |
| **Escopo** | Módulo clínico Care Chart — perfil, medicação, exames e protocolos |
| **Docs** | [`V1_1.md`](V1_1.md) |

**Inclui:**

- Schema clínico: `PatientClinicalProfile`, prescrições, pedidos de exame, protocolos de cuidado
- Portal **Prestador**: lista de pacientes (`/prestador/pacientes`), painel Care Chart no atendimento e histórico
- Portal **Interno**: visão clínica no Cliente 360°, templates de protocolo em cadastros
- Portal **Beneficiário**: resumo clínico (medicações, exames, protocolos)
- Massa demo Care Chart no seed (`clinical-demo.ts`)
- APIs REST completas para perfil, meds, exames e protocolos

**Não inclui (ainda só na `dev`):** cadastros v1.1 (#72), auditoria (#84), homepage (#88), exportações PDF/Excel (#85).

---

### `v1.0.2` — identidade plataforma vs clínicas *(substituído)*

| Campo | Valor |
|-------|-------|
| **Tag git** | `v1.0.2` |
| **Commit** | `e30b2b0` |
| **PR** | [#77](https://github.com/Piulres/sistema-bibi/pull/77) |
| **Publicado em** | 22/06/2026 ~15:08 |
| **Docs** | [`V1_0.md`](V1_0.md) |

---

### `v1.0.1` — agenda prestador + demo/operação *(substituído)*

| Campo | Valor |
|-------|-------|
| **Tag git** | `v1.0.1` |
| **Commit** | `e4d8a43` |
| **PR** | [#73](https://github.com/Piulres/sistema-bibi/pull/73) |

---

## Próximo pacote — integração `dev`

| Item | PR / branch | Estado |
|------|-------------|--------|
| Cadastros v1.1 (mercado, CPF/CNPJ) | #72 | Na `dev` |
| Portais a11y + RBAC | #83 | Na `dev` |
| Auditoria universal + precificação B2B | #84 | Na `dev` |
| Exportações PDF/Excel | #85 | Branch `cursor/exports-pdf-excel-0f4a` |
| Homepage moderna | #88 | Na `dev` |

**Checklist próximo release:** `pre-release` na `dev` → merge `dev`→`main` → deploy → tag → atualizar esta seção.

---

## Documentação por versão

| Versão | Doc | Estado |
|--------|-----|--------|
| **1.0.x** | [`V1_0.md`](V1_0.md) | ✅ Histórico (último `v1.0.2`) |
| **1.1.x** | [`V1_1.md`](V1_1.md) | ✅ **`v1.1.0` em produção** |

---

## Histórico de releases

| Versão / Pacote | Commit | Data (UTC) | Estado |
|-----------------|--------|------------|--------|
| **`v1.1.0`** | `8c8cd01` | 22/06/2026 | ✅ **Em produção** |
| `v1.0.2` | `e30b2b0` | 22/06/2026 | ✅ Substituído |
| `v1.0.1` | `e4d8a43` | 22/06/2026 | ✅ Substituído |
| `v1.0.0` | `685cc21` | 22/06/2026 | ✅ Substituído |

---

## Publicar um pacote

Fluxo manual — ver [`OPERACOES.md`](OPERACOES.md) §5.

```bash
git checkout dev && git pull && npm run pre-release
git checkout main && git pull && git merge dev && npm run pre-release
npx netlify deploy --prod --no-build --message "vX.Y.Z: descrição"
git tag -a vX.Y.Z -m "Release X.Y.Z"
git push origin main && git push origin vX.Y.Z
git checkout dev && git merge main && git push origin dev
```

---

## Links

- [`WORKFLOW_CURSOR.md`](WORKFLOW_CURSOR.md)
- [`OPERACOES.md`](OPERACOES.md)
- [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md)
