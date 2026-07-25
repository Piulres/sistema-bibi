# Prompt-template — nova skill / funcionalidade no ServiceOS

Use com o skill Cursor [`.cursor/skills/serviceos-dev-quality/SKILL.md`](../../.cursor/skills/serviceos-dev-quality/SKILL.md) (`/serviceos-dev-quality`).

Baseado nos prompts essenciais de implementação (padrões, algoritmos, integração, testes, docs) adaptados a este repositório.

---

## Template (copiar e preencher)

```markdown
Atue como desenvolvedor especialista em TypeScript / Next.js 16 no **Sistema Bibi - ServiceOS**.

Preciso criar a skill/funcionalidade: **[descreva o comportamento, portais afetados, tenant/segmento]**.

Siga `.cursor/skills/serviceos-dev-quality/SKILL.md`:

1. **Estrutura:** use o padrão já do repo (service em `src/lib/…` + route `src/app/api/…` + view). Só introduza Strategy/Factory se houver variação real (ex.: gateway de pagamento).
2. **Lógica:** algoritmo eficiente para **[busca | agregação | precificação | …]**; evite N+1 Prisma.
3. **Integração:** se houver API, trate auth (`requireInternoModule` / role) e erros HTTP; adapters em `src/lib/payments` ou similar — sem secrets no código.
4. **UI:** `useLabels()` nos portais autenticados; sem strings “Paciente/Consulta” fixas.
5. **Qualidade:** JSDoc da API pública + testes Vitest em `tests/unit/`; lint; PR → **dev**.
6. Se for bugfix: explique causa raiz antes do patch.
```

---

## Por que esta estrutura

| Elemento das fontes | Como aplicamos no ServiceOS |
|---------------------|-----------------------------|
| Design patterns | Reutilizar service/route/view e adapters existentes |
| Algoritmos eficientes | Funções puras + queries Prisma em batch |
| Integração API | Rotas App Router + `api-auth` + mocks de gateway |
| Testes unitários | Vitest (não Jest) |
| Documentação | JSDoc + `docs/` do domínio + handoff no PR |
| Automação | Scripts npm (`lint`, `docs:verify`, e2e) — sem deploy autônomo |
