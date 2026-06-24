"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Button from "@/components/ui/Button";

export type ToastItem = {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  tone?: "info" | "success" | "danger";
};

type ToastContextValue = {
  showToast: (item: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID();
      setItems((prev) => [...prev, { ...item, id }]);
      window.setTimeout(() => dismissToast(id), 12_000);
      return id;
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {items.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-lg"
          >
            <p className="text-sm text-[var(--text-secondary)]">{toast.message}</p>
            <div className="mt-2 flex gap-2">
              {toast.actionLabel && toast.onAction && (
                <Button
                  type="button"
                  size="sm"
                  variant="portal"
                  onClick={async () => {
                    await toast.onAction?.();
                    dismissToast(toast.id);
                  }}
                >
                  {toast.actionLabel}
                </Button>
              )}
              <Button type="button" size="sm" variant="secondary" onClick={() => dismissToast(toast.id)}>
                Fechar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  }
  return ctx;
}
