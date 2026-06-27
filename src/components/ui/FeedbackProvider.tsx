"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/hooks/useConfirm";

/** Provider unificado: toasts + diálogos de confirmação nos portais autenticados. */
export default function FeedbackProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
