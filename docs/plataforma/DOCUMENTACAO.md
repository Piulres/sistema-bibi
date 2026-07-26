# Documentação viva — regras para agentes e humanos

A documentação do ServiceOS é **viva**: status atual + timeline append-only.  
Evite arquivos com nome de fase, data ou número de entrega (`FASE_2`, `GO_LIVE_2026`, `HISTORICO_2026-07-25`).

---

## Onde está a verdade

| Tema | Doc canônico |
|------|----------------|
| Versão em produção / pacotes | [`../versoes/RELEASES.md`](../versoes/RELEASES.md) |
| Operações (dev, PR → `dev`, deploy) | [`OPERACOES.md`](OPERACOES.md) |
| Piloto CEDIG (status + timeline) | [`../clientes/cedig/STATUS.md`](../clientes/cedig/STATUS.md) |
| Escopo da versão atual | [`../versoes/V3_0.md`](../versoes/V3_0.md) (+ histórico `V2_*` / `V1_*`) |
| Fluxos de produto | [`../produto/FLUXOS.md`](../produto/FLUXOS.md) |
| Índice | [`../README.md`](../README.md) |

---

## Modelo por domínio de cliente

```text
docs/clientes/<slug>/
  README.md     ← quem é o cliente, preços, credenciais
  STATUS.md     ← status agora + timeline (APPEND)
  OPERACAO.md   ← playbook diário
  HOMOLOGACAO.md← checklist de aceite (se houver)
```

Ao fechar trabalho no domínio: **atualize `STATUS.md`** (tabela Status + linha na Timeline).

---

## Proibido / preferir

| Evitar | Preferir |
|--------|----------|
| `FASE_N.md`, `GO_LIVE_*.md` | Seção em `STATUS.md` |
| `HISTORICO_YYYY-MM-DD.md` | Linha na timeline |
| `STATUS.md` paralelo | Item resolvido na timeline + status |
| Snapshot `VALIDACAO_TESTES` one-shot | `TESTES.md` + `RELEASES.md` |
| Duplicar versão “em produção” em 10 arquivos | Um ponteiro a `RELEASES.md` |

---

## Checklist do agente (antes do PR)

1. `RELEASES.md` / `STATUS.md` do domínio refletem a realidade?
2. Links apontam para docs vivos (não arquivos removidos)?
3. `npm run docs:verify`
4. `npm run cursor:verify` (se tocou `.cursor/` ou `AGENTS.md`)
5. PR base **`dev`** (nunca `main` direto)

Ver também: skill `.cursor/skills/serviceos-dev-quality/SKILL.md`.
