# CEDIG — contexto para agentes

Piloto clínico no tenant `cedig`. **Docs vivas** — não criar `FASE_N` / `GO_LIVE_*`.

## Docs vivas

- `STATUS.md` — estado atual do piloto
- `OPERACAO.md` — playbook diário + setup local (`./scripts/cedig-mapear.sh`)
- `OPERACAO.md` §Limpar fluxos — reset transacional em produção (`reset-cedig-transactional.mjs` → `cedig-ensure-commercial.ts` → `publish-operation-blob.mjs`)
- `docs/plataforma/OPERACAO_DADOS.md` — dual-store, schema-sync e limpeza do Blob

## Código

- `src/lib/clinic-finance/bridge.ts`
- `/interno/gestao` · `/?tenant=cedig`

Skill reference: `.cursor/skills/serviceos-dev-quality/references/cedig-clinic.md`
