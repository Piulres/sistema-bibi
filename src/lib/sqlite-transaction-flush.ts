import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Controla flush do operation.db → Netlify Blobs em torno de `$transaction`.
 *
 * Flush no meio da transação (via query extension) gravava o Blob antes do
 * COMMIT — "Marcar paga" e outras mutações em `$transaction` pareciam funcionar
 * na instância quente e sumiam após sync/cold start.
 */

type TxStore = { depth: number };

const txStore = new AsyncLocalStorage<TxStore>();

/** true enquanto uma `$transaction` Prisma (interactive ou batch) está aberta. */
export function isInsideSqliteTransaction(): boolean {
  return (txStore.getStore()?.depth ?? 0) > 0;
}

/**
 * Executa `fn` com depth de transação. No outermost, chama `onSettle` no
 * `finally` (sucesso ou rollback) — ponto seguro para flush do arquivo SQLite.
 */
export async function runWithSqliteTransactionTracking<T>(
  fn: () => Promise<T>,
  onSettle?: () => void | Promise<void>,
): Promise<T> {
  const parent = txStore.getStore();
  const depth = (parent?.depth ?? 0) + 1;

  return txStore.run({ depth }, async () => {
    try {
      return await fn();
    } finally {
      if (depth === 1 && onSettle) {
        await onSettle();
      }
    }
  });
}

/** Deve fazer flush após um write fora de transação (ou no settle da tx). */
export function shouldFlushSqliteWriteAfterOperation(operation: string, isWrite: boolean): boolean {
  if (!isWrite) return false;
  return !isInsideSqliteTransaction();
}
