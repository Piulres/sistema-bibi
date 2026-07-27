"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { useMenuKeyboard } from "@/hooks/useMenuKeyboard";
import { fetchJson } from "@/lib/ui/api-feedback";
import { downloadExportFile } from "@/lib/ui/download-export";

type CalendarPayload = {
  links?: {
    googleUrl: string;
    outlookUrl: string;
    office365Url: string;
  };
  filename?: string;
};

type Props = {
  /** Endpoint autenticado que devolve links + ICS (sem ?format=). */
  apiPath: string;
  /** Download direto do .ics. */
  icsPath: string;
  className?: string;
};

/**
 * Menu “Adicionar ao calendário” (Google / Outlook / Office 365 / .ics).
 * Usado na agenda do prestador e na recepção.
 */
export default function AddToCalendarMenu({ apiPath, icsPath, className }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [icsBusy, setIcsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<CalendarPayload["links"] | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useMenuKeyboard({
    open,
    menuRef,
    triggerRef,
    onClose: () => setOpen(false),
  });

  async function ensureLinks() {
    if (links) return links;
    setLoading(true);
    setError(null);
    const res = await fetchJson<CalendarPayload>(
      apiPath,
      undefined,
      "Não foi possível montar o evento de calendário",
    );
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return null;
    }
    setLinks(res.data.links ?? null);
    return res.data.links ?? null;
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) await ensureLinks();
  }

  async function openExternal(
    pick: (l: NonNullable<CalendarPayload["links"]>) => string,
  ) {
    const current = await ensureLinks();
    if (!current) return;
    window.open(pick(current), "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  async function downloadIcs() {
    setIcsBusy(true);
    setError(null);
    try {
      const result = await downloadExportFile(icsPath, "evento.ics");
      if (!result.ok) setError(result.error);
      else setOpen(false);
    } finally {
      setIcsBusy(false);
    }
  }

  return (
    <div className={className ? `relative ${className}` : "relative"}>
      <Button
        ref={triggerRef}
        type="button"
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void toggle();
        }}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Calendário
      </Button>
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Adicionar ao calendário"
          className="absolute right-0 z-20 mt-1 w-56 rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] p-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <p className="px-3 py-2 text-xs text-[var(--text-muted)]">Carregando…</p>
          ) : error ? (
            <p className="px-3 py-2 text-xs text-[var(--status-danger-text)]" role="alert">
              {error}
            </p>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                className="block w-full rounded px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                onClick={() => void openExternal((l) => l.googleUrl)}
              >
                Google Agenda
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full rounded px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                onClick={() => void openExternal((l) => l.outlookUrl)}
              >
                Outlook (pessoal)
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full rounded px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                onClick={() => void openExternal((l) => l.office365Url)}
              >
                Microsoft 365
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={icsBusy}
                className="block w-full rounded px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] disabled:opacity-50"
                onClick={() => void downloadIcs()}
              >
                {icsBusy ? "Baixando…" : "Baixar .ics (Apple e outros)"}
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
