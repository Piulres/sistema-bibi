# Feedback UX — loading, erros, toasts e confirmações

Padrão unificado de feedback nos **quatro portais autenticados**, introduzido no pacote v2.3 ([#151](https://github.com/Piulres/sistema-bibi/pull/151)).

**Objetivo:** toda mutação ou carga inicial expõe estado visível (loading, erro com retry, sucesso/erro via toast, confirmação antes de ações destrutivas).

---

## Arquitetura

```
PortalShell (layout)
  └── FeedbackProvider
        ├── ToastProvider      → useToast() / aria-live
        └── ConfirmProvider    → useConfirm() → ConfirmDialog
```

| Camada | Quando | Primitivo |
|--------|--------|-----------|
| **Navegação** | Troca de rota | `NavigationProgress` + `loading.tsx` |
| **Carga de dados** | GET inicial / reload | `useAsyncData` + `ViewStateBoundary` |
| **Mutação** | POST/PATCH/DELETE | `useAsyncAction` + toast |
| **Parcial** | Sub-recursos (ex.: sidebar clínica) | `LoadingState` local + `isBusy(key)` |

Catálogo por view: `src/lib/ui/feedback-map.ts` (`VIEW_FEEDBACK_MAP`).

---

## Hooks e utilitários

### `useAsyncData` — carga inicial

```tsx
const { data, loading, error, reload } = useAsyncData(
  () => fetchJson<CadastrosPayload>("/api/interno/cadastros"),
  [],
);

return (
  <ViewStateBoundary loading={loading} error={error} onRetry={reload} loadingMessage="Carregando cadastros...">
    {/* conteúdo quando data !== null */}
  </ViewStateBoundary>
);
```

- `fetchJson` / `parseApiResponse` em `src/lib/ui/api-feedback.ts` mapeiam HTTP → mensagem amigável (401, 403, 404, 409, 5xx).
- Opção `forbiddenMessage` customiza texto em 403.
- Opção `manual: true` adia o fetch até `reload()`.

### `useAsyncAction` — mutações

```tsx
const { run, isBusy } = useAsyncAction();

await run(
  "deleteProcedure",
  () => fetch(`/api/interno/procedures/${id}`, { method: "DELETE" }),
  {
    confirm: confirmPresets.delete(procedure.name),
    successMessage: "Procedimento excluído.",
    errorMessage: "Não foi possível excluir o procedimento.",
    onSuccess: () => reload(),
  },
);
```

- `busy` / `isBusy(key)` — desabilita botões durante a requisição.
- `confirm` opcional — abre `ConfirmDialog` antes de executar.
- `undo` — toast com `actionLabel` + callback (ex.: desfazer cadastro).
- Falha de rede → toast danger genérico.

### `useConfirm` — diálogo modal

Provider em `FeedbackProvider`; hook em `src/hooks/useConfirm.tsx`.

```tsx
const { confirm } = useConfirm();
const ok = await confirm({
  title: "Confirmar exclusão",
  message: "Esta ação não pode ser desfeita.",
  confirmLabel: "Excluir",
  tone: "danger",
  requiredPhrase: "RESTAURAR", // opcional — exige digitação exata
});
```

Presets reutilizáveis: `src/lib/ui/confirm-presets.ts` (`delete`, `cancelAppointment`, `markPaid`, `confirmPix`, `demoReset`, …).

### `ViewStateBoundary` — guard de tela

Substitui padrões ad hoc de `if (loading) return <LoadingState />`. Renderiza:

1. `LoadingState` quando `loading`
2. `Alert` danger + botão "Tentar novamente" quando `error`
3. `children` quando pronto

---

## Componentes UI

| Arquivo | Papel |
|---------|-------|
| `FeedbackProvider.tsx` | Agrupa Toast + Confirm nos shells |
| `ConfirmDialog.tsx` | `role="alertdialog"` — acessível para E2E |
| `Toast.tsx` | `aria-live="polite"` — sucesso/erro/info |
| `LoadingState.tsx` | Spinner + mensagem |
| `ViewStateBoundary.tsx` | Guard loading/erro/retry |

Shells que montam `FeedbackProvider`: `InternoPortalShell`, `PrestadorPortalShell`, `PjPortalShell`, `BeneficiarioPortalShell`.

---

## Views migradas (v2.3)

Todas as `*View.tsx` principais dos quatro portais usam o padrão. Exemplos:

| Portal | Views |
|--------|-------|
| Interno | `CadastrosView`, `BillingView`, `AppointmentsView`, `StockView`, `SecurityView`, … |
| Prestador | `AtendimentoView`, `PrestadorDashboardView`, … |
| PJ | `PjView` |
| Beneficiário | `BeneficiarioView` |

Mapa completo: `VIEW_FEEDBACK_MAP` em `feedback-map.ts`.

---

## Checklist para novas telas

1. **Carga:** `useAsyncData` + `fetchJson` — nunca `fetch` cru sem tratamento de erro.
2. **Guard:** envolver conteúdo em `ViewStateBoundary` com `loadingMessage` descritivo.
3. **Mutação:** `useAsyncAction.run(key, …)` — uma `key` por botão/ação.
4. **Destrutivo:** `confirm: confirmPresets.*` ou `useConfirm()` direto.
5. **Labels:** `useLabels()` para copy — não strings fixas de paciente/procedimento.
6. **Mapa:** adicionar entrada em `VIEW_FEEDBACK_MAP` ao criar view nova.

### Anti-padrões

| Evitar | Preferir |
|--------|----------|
| `window.confirm()` | `useConfirm` / `confirmPresets` |
| `alert()` / `console.error` só | `showToast` via `useAsyncAction` |
| `setState` síncrono em `useEffect` para load | IIFE assíncrona ou `useAsyncData` |
| Ignorar `!res.ok` em `fetch` | `parseApiResponse` |
| Listas vazias em 403 | `ViewStateBoundary` com mensagem de permissão |

---

## Testes

| Camada | Arquivo | O que valida |
|--------|---------|--------------|
| Unitário | `tests/unit/api-feedback.test.ts` | `apiErrorMessage`, fallbacks HTTP |
| E2E helper | `e2e/helpers/feedback.ts` | `expectFeedbackMessage`, `confirmDialog` |
| E2E CRUD | `e2e/cadastros-crud.spec.ts` | Toast + diálogo de exclusão |
| E2E walk-in | `e2e/walkin-particular.spec.ts` | Feedback pós-mutação |

### E2E — interagir com confirmação

```ts
import { confirmDialog, expectFeedbackMessage } from "./helpers/feedback";

await confirmDialog(page, { title: /Confirmar exclusão/i, action: /Excluir/i });
await expectFeedbackMessage(page, /excluído/i);
```

`confirmDialog` usa `getByRole("alertdialog")` — alinhado ao `ConfirmDialog`.

---

## Referências

- Design system (primitivos): [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) § Feedback UX
- Auditoria de gaps: [`AUDITORIA_FLUXOS.md`](../produto/AUDITORIA_FLUXOS.md)
- Changelog: [`V2_3.md`](../versoes/V2_3.md) § Feedback UX
- ESLint `set-state-in-effect`: ver `BillingView`, `AtendimentoView` como referência
