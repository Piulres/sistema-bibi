"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/hooks/useConfirm";
import type { ConfirmOptions } from "@/hooks/useConfirm";
import { parseApiResponse } from "@/lib/ui/api-feedback";

export type ActionFeedback = {
  successMessage?: string;
  errorMessage?: string;
  /** Toast com ação (ex.: desfazer). */
  undo?: {
    label?: string;
    onUndo: () => void | Promise<void>;
  };
};

export type RunActionOptions<T> = ActionFeedback & {
  confirm?: ConfirmOptions;
  onSuccess?: (data: T) => void | Promise<void>;
  /** Se true, não exibe toast de sucesso (útil quando o caller customiza). */
  silentSuccess?: boolean;
};

/**
 * Mutações com busy id, toasts e confirmação opcional.
 */
export function useAsyncAction() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [busy, setBusy] = useState<string | null>(null);

  const isBusy = useCallback((key: string) => busy === key, [busy]);

  const run = useCallback(
    async <T extends Record<string, unknown>>(
      key: string,
      action: () => Promise<Response>,
      options?: RunActionOptions<T>,
    ): Promise<boolean> => {
      if (options?.confirm) {
        const ok = await confirm(options.confirm);
        if (!ok) return false;
      }

      setBusy(key);
      try {
        const res = await action();
        const parsed = await parseApiResponse<T>(res, options?.errorMessage);

        if (!parsed.ok) {
          showToast({
            message: parsed.error,
            tone: "danger",
          });
          return false;
        }

        if (!options?.silentSuccess && options?.successMessage) {
          if (options.undo) {
            showToast({
              message: options.successMessage,
              tone: "success",
              actionLabel: options.undo.label ?? "Desfazer",
              onAction: options.undo.onUndo,
            });
          } else {
            showToast({ message: options.successMessage, tone: "success" });
          }
        }

        await options?.onSuccess?.(parsed.data);
        return true;
      } catch {
        showToast({
          message: "Falha de rede. Verifique sua conexão e tente novamente.",
          tone: "danger",
        });
        return false;
      } finally {
        setBusy(null);
      }
    },
    [confirm, showToast],
  );

  return { busy, isBusy, run, showToast, confirm };
}
