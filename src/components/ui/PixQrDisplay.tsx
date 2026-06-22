"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type Props = {
  copyPaste: string;
  className?: string;
};

/** QR mock para PIX POC — padrão visual + copia-e-cola. */
export default function PixQrDisplay({ copyPaste, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row sm:items-start", className)}>
      <div
        className="grid shrink-0 grid-cols-7 gap-0.5 rounded-lg border border-[var(--border-default)] bg-white p-3"
        aria-hidden
      >
        {Array.from({ length: 49 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "size-3 rounded-sm",
              (i + copyPaste.length) % 3 === 0 ? "bg-[var(--text-primary)]" : "bg-transparent",
            )}
          />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[var(--text-secondary)]">PIX copia e cola</p>
        <p className="mt-1 break-all font-mono text-xs text-[var(--text-muted)]">{copyPaste}</p>
        <Button className="mt-2" variant="portal" size="sm" onClick={copy}>
          {copied ? "Copiado!" : "Copiar código"}
        </Button>
      </div>
    </div>
  );
}
