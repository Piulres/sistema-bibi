# Fechar pacote / release

## Só quando o humano pedir deploy ou fechar pacote

```bash
npm run pre-release    # lint + build local — obrigatório antes de publicar
npm run docs:verify    # após editar versão/changelog
```

## Arquivos (pós-deploy confirmado)

| Arquivo | Conteúdo |
|---------|----------|
| `docs/versoes/RELEASES.md` | Pacote publicado |
| `src/lib/landing/changelog-content.ts` | Bloco `#novidades` na home |
| `src/lib/platform.ts` | `PLATFORM.release` |
| `docs/plataforma/LANDING_CHANGELOG.md` | Guia de manutenção |

## Proibido (agente)

- `npx netlify deploy --prod` sem pedido explícito
- Marcar `RELEASES.md` como publicado sem confirmação
- Usar `--no-build` no deploy Netlify

## Fluxo Git

`dev` integra → merge `dev` → `main` (humano) → deploy manual → docs
