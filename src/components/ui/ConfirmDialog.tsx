"use client";

import { useId, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { ConfirmTone } from "@/hooks/useConfirm";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  requiredPhrase?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const confirmVariant = {
  default: "portal" as const,
  warning: "portal" as const,
  danger: "primary" as const,
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  requiredPhrase,
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const [phrase, setPhrase] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap({
    enabled: open,
    containerRef: panelRef,
    onEscape: () => {
      setPhrase("");
      onCancel();
    },
    initialFocusSelector: requiredPhrase
      ? "input"
      : 'button[data-confirm-cancel="true"]',
  });

  if (!open) return null;

  const phraseOk =
    !requiredPhrase || phrase.trim().toUpperCase() === requiredPhrase.toUpperCase();

  function handleCancel() {
    setPhrase("");
    onCancel();
  }

  function handleConfirm() {
    setPhrase("");
    onConfirm();
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={handleCancel}
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 w-full max-w-md rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-xl"
      >
        <h2 id={titleId} className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        <p id={descId} className="mt-2 text-sm text-[var(--text-secondary)]">
          {message}
        </p>

        {requiredPhrase && (
          <label className="mt-4 block text-sm">
            <span className="text-[var(--text-secondary)]">
              Digite <strong>{requiredPhrase}</strong> para confirmar
            </span>
            <input
              key={title}
              className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              autoComplete="off"
              data-autofocus
            />
          </label>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            data-confirm-cancel="true"
            onClick={handleCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant[tone]}
            className={tone === "danger" ? "bg-[var(--status-danger-text)] hover:opacity-90" : undefined}
            disabled={!phraseOk}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
