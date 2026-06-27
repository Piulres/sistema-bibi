"use client";

import { useEffect, useId, useState } from "react";
import Button from "@/components/ui/Button";
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const phraseOk =
    !requiredPhrase || phrase.trim().toUpperCase() === requiredPhrase.toUpperCase();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar diálogo"
        onClick={onCancel}
      />
      <div
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
              className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] px-3 py-2 text-sm"
              defaultValue=""
              onChange={(e) => setPhrase(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </label>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" autoFocus={!requiredPhrase} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant[tone]}
            className={tone === "danger" ? "bg-[var(--status-danger-text)] hover:opacity-90" : undefined}
            disabled={!phraseOk}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
