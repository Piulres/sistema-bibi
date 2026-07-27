import { describe, expect, it, vi } from "vitest";
import {
  isInsideSqliteTransaction,
  runWithSqliteTransactionTracking,
  shouldFlushSqliteWriteAfterOperation,
} from "@/lib/sqlite-transaction-flush";
import { isSqliteWriteAction } from "@/lib/sqlite-blob-persistence";

describe("Flush operation.db — evita perda de Marcar paga após COMMIT no Blob", () => {
  it("não faz flush mid-transaction (gravação prematura no Blob reverte FECHADA→PAGA)", async () => {
    const flushes: string[] = [];

    await runWithSqliteTransactionTracking(
      async () => {
        expect(isInsideSqliteTransaction()).toBe(true);
        expect(
          shouldFlushSqliteWriteAfterOperation("create", isSqliteWriteAction("create")),
        ).toBe(false);
        expect(
          shouldFlushSqliteWriteAfterOperation("update", isSqliteWriteAction("update")),
        ).toBe(false);
        // simula writes internos de markInvoicePaid
        flushes.push("mid-tx-skipped");
        return { payment: { status: "CONFIRMED" } };
      },
      async () => {
        flushes.push("after-commit");
      },
    );

    expect(flushes).toEqual(["mid-tx-skipped", "after-commit"]);
    expect(isInsideSqliteTransaction()).toBe(false);
  });

  it("fora de transação, write faz flush imediato (Lambda pode encerrar antes do debounce)", () => {
    expect(isInsideSqliteTransaction()).toBe(false);
    expect(shouldFlushSqliteWriteAfterOperation("create", true)).toBe(true);
    expect(shouldFlushSqliteWriteAfterOperation("findMany", false)).toBe(false);
  });

  it("settle roda no finally mesmo com erro (Blob reflete rollback local)", async () => {
    const onSettle = vi.fn();
    await expect(
      runWithSqliteTransactionTracking(async () => {
        throw new Error("boom");
      }, onSettle),
    ).rejects.toThrow("boom");
    expect(onSettle).toHaveBeenCalledOnce();
  });

  it("transação aninhada só faz settle no outermost (um flush por COMMIT real)", async () => {
    const settles: number[] = [];

    await runWithSqliteTransactionTracking(
      async () => {
        await runWithSqliteTransactionTracking(
          async () => "inner",
          async () => {
            settles.push(2);
          },
        );
        return "outer";
      },
      async () => {
        settles.push(1);
      },
    );

    expect(settles).toEqual([1]);
  });

  it("isSqliteWriteAction reconhece create/update usados em Payment e Invoice", () => {
    expect(isSqliteWriteAction("create")).toBe(true);
    expect(isSqliteWriteAction("update")).toBe(true);
    expect(isSqliteWriteAction("findFirst")).toBe(false);
  });
});
