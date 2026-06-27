"use client";

import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/hooks/useConfirm";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useAsyncData } from "@/hooks/useAsyncData";

/** Atalho: toast + confirm + ações assíncronas + carga de dados. */
export function useFeedback() {
  const toast = useToast();
  const confirm = useConfirm();
  const action = useAsyncAction();

  return {
    showToast: toast.showToast,
    dismissToast: toast.dismissToast,
    confirm,
    action,
    useAsyncData,
  };
}

export { useAsyncData, useAsyncAction, useToast, useConfirm };
