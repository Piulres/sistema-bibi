"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { downloadExportFile } from "@/lib/ui/download-export";

type Props = {
  href: string;
  label: string;
  filename?: string;
  size?: "sm" | "md";
  variant?: "portal" | "secondary" | "ghost";
  className?: string;
  onError?: (message: string) => void;
};

/** Link de download autenticado (TISS XML, LGPD JSON, etc.). */
export default function DownloadLink({
  href,
  label,
  filename,
  size = "sm",
  variant = "secondary",
  className,
  onError,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const result = await downloadExportFile(href, filename ?? label.toLowerCase());
      if (!result.ok) onError?.(result.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={busy}
      onClick={() => void handleClick()}
    >
      {busy ? "..." : label}
    </Button>
  );
}
