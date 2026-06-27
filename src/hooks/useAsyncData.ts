"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResult } from "@/lib/ui/api-feedback";

type UseAsyncDataOptions = {
  /** Não dispara fetch automático no mount. */
  manual?: boolean;
  /** Mensagem quando status 403. */
  forbiddenMessage?: string;
};

/**
 * Carga inicial padronizada: loading, erro e reload.
 */
export function useAsyncData<T extends Record<string, unknown>>(
  loader: () => Promise<ApiResult<T>>,
  deps: readonly unknown[] = [],
  options?: UseAsyncDataOptions,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options?.manual);
  const [error, setError] = useState<string | null>(null);

  const applyResult = useCallback((result: ApiResult<T>) => {
    if (result.ok) {
      setData(result.data);
      setLoading(false);
      setError(null);
      return result;
    }
    const message =
      result.status === 403
        ? (options?.forbiddenMessage ?? result.error)
        : result.error;
    setError(message);
    setLoading(false);
    return result;
  }, [options?.forbiddenMessage]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await loader();
    return applyResult(result);
  }, [loader, applyResult]);

  useEffect(() => {
    if (options?.manual) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await loader();
      if (!active) return;
      applyResult(result);
    })();
    return () => {
      active = false;
    };
  }, [loader, applyResult, options?.manual, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps -- deps dinâmicos do caller

  return { data, loading, error, reload, setData };
}
