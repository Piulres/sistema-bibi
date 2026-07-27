import { describe, expect, it, vi } from "vitest";
import {
  isInsideSqliteTransaction,
  runWithSqliteTransactionTracking,
  shouldFlushSqliteWriteAfterOperation,
} from "@/lib/sqlite-transaction-flush";
import { isSqliteWriteAction } from "@/lib/sqlite-blob-persistence";

describe("sqlite-transaction-flush", () => {
  it("não faz flush de write no meio da transação", async () => {
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

  it("fora de transação, write deve flushar imediatamente", () => {
    expect(isInsideSqliteTransaction()).toBe(false);
    expect(shouldFlushSqliteWriteAfterOperation("create", true)).toBe(true);
    expect(shouldFlushSqliteWriteAfterOperation("findMany", false)).toBe(false);
  });

  it("settle roda mesmo quando a transação falha (rollback local)", async () => {
    const onSettle = vi.fn();
    await expect(
      runWithSqliteTransactionTracking(async () => {
        throw new Error("boom");
      }, onSettle),
    ).rejects.toThrow("boom");
    expect(onSettle).toHaveBeenCalledOnce();
  });

  it("nested tracking só faz settle no outermost", async () => {
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

  it("isSqliteWriteAction cobre mutações Prisma usadas no faturamento", () => {
    expect(isSqliteWriteAction("create")).toBe(true);
    expect(isSqliteWriteAction("update")).toBe(true);
    expect(isSqliteWriteAction("findFirst")).toBe(false);
  });
});
