"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import SectionHeader from "@/components/ui/SectionHeader";
import {
  VOA_PLUGIN_EVENTS,
  type VoaEhrFillEvent,
  type VoaMountParams,
  type VoaPluginMessage,
  type VoaStructuredOutputEvent,
} from "@/lib/voa/constants";

type VoaSession = {
  enabled: boolean;
  configured: boolean;
  pluginScriptUrl: string;
  token: string | null;
  consentWarning: string | null;
  mount: VoaMountParams;
};

type Props = {
  appointmentId: string;
  patientId: string;
  onImported?: () => void;
};

export default function VoaAssistantPanel({ appointmentId, patientId, onImported }: Props) {
  const [session, setSession] = useState<VoaSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const structuredBuffer = useRef<Record<string, unknown> | null>(null);
  const pendingFill = useRef<VoaEhrFillEvent | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/prestador/appointments/${appointmentId}/voa`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao carregar sessão Voa");
        setSession(null);
      } else {
        setSession(data as VoaSession);
      }
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/prestador/appointments/${appointmentId}/voa`);
      const data = await res.json();
      if (!active) return;
      if (!res.ok) {
        setError(data.error ?? "Erro ao carregar sessão Voa");
      } else {
        setSession(data as VoaSession);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [appointmentId]);

  const importDocument = useCallback(
    async (fill: VoaEhrFillEvent, structured: Record<string, unknown> | null) => {
      setBusy(true);
      setMsg(null);
      try {
        const res = await fetch(`/api/prestador/appointments/${appointmentId}/voa/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId,
            document: fill.eventData.document,
            templateName: fill.eventData.template?.name ?? null,
            templateSlug: fill.eventData.template?.slug ?? null,
            structuredOutput: structured,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMsg(data.error ?? "Erro ao importar documento");
        } else {
          setMsg(`Documento importado no prontuário: ${data.record.title ?? "registro clínico"}`);
          onImported?.();
        }
      } finally {
        setBusy(false);
      }
    },
    [appointmentId, patientId, onImported],
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const payload = event.data as VoaPluginMessage | undefined;
      if (!payload || typeof payload !== "object" || !("eventName" in payload)) return;

      if (payload.eventName === VOA_PLUGIN_EVENTS.EHR_STRUCTURED_OUTPUT) {
        const structured = payload as VoaStructuredOutputEvent;
        structuredBuffer.current = structured.eventData.output ?? null;
        if (pendingFill.current) {
          void importDocument(pendingFill.current, structuredBuffer.current);
          pendingFill.current = null;
          structuredBuffer.current = null;
        }
        return;
      }

      if (payload.eventName === VOA_PLUGIN_EVENTS.EHR_FILL) {
        const fill = payload as VoaEhrFillEvent;
        pendingFill.current = fill;
        void importDocument(fill, structuredBuffer.current);
        pendingFill.current = null;
        structuredBuffer.current = null;
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [importDocument]);

  useEffect(() => {
    return () => {
      try {
        window.VoaPlugin?.instance.unmount();
      } catch {
        /* plugin pode não estar carregado */
      }
    };
  }, []);

  async function openVoa() {
    if (!session?.token || !window.VoaPlugin) {
      setMsg("Plugin Voa indisponível. Verifique VOA_ENABLED e VOA_INTEGRATION_TOKEN.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await window.VoaPlugin.instance.init({ token: session.token });
      await window.VoaPlugin.instance.mount({
        ...session.mount,
        options: {
          ...session.mount.options,
          renderElement: panelRef.current ?? undefined,
        },
      });
      setMounted(true);
      setMsg("Assistente Voa aberto. Ao finalizar, use Preencher prontuário na Voa.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao abrir Voa");
    } finally {
      setBusy(false);
    }
  }

  function closeVoa() {
    try {
      window.VoaPlugin?.instance.unmount();
    } finally {
      setMounted(false);
    }
  }

  if (loading) return <LoadingState message="Carregando assistente Voa..." />;

  if (error) return <Alert tone="danger">{error}</Alert>;

  if (!session?.enabled) {
    return (
      <Card className="p-4">
        <SectionHeader
          title="Assistente Voa Health"
          description="Integração desabilitada neste ambiente."
        />
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Para habilitar, defina <code className="text-xs">VOA_ENABLED=true</code> e{" "}
          <code className="text-xs">VOA_INTEGRATION_TOKEN</code> no <code className="text-xs">.env</code>.
          Solicite o token em integration@voahealth.com.
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Documentação: <code className="text-xs">docs/VOA_INTEGRATION.md</code>
        </p>
      </Card>
    );
  }

  if (!session.configured) {
    return (
      <Card className="p-4">
        <SectionHeader
          title="Assistente Voa Health"
          description="Integração habilitada, mas sem token configurado."
        />
        <Alert tone="warning" className="mt-3">
          Configure <code className="text-xs">VOA_INTEGRATION_TOKEN</code> no servidor.
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      {session.pluginScriptUrl && (
        <Script
          src={session.pluginScriptUrl}
          type="module"
          strategy="lazyOnload"
          onLoad={() => setScriptReady(true)}
        />
      )}

      <SectionHeader
        title="Assistente Voa Health"
        description="Transcrição e documentação clínica com IA. Use Preencher prontuário na Voa para importar no PEP."
      />

      {session.consentWarning && (
        <Alert tone="warning" className="mt-3">
          {session.consentWarning}
        </Alert>
      )}

      {msg && (
        <Alert tone={msg.includes("Erro") || msg.includes("Falha") ? "danger" : "success"} className="mt-3">
          {msg}
        </Alert>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={openVoa} disabled={busy || !scriptReady || mounted}>
          {mounted ? "Voa em execução" : scriptReady ? "Abrir assistente Voa" : "Carregando plugin..."}
        </Button>
        {mounted && (
          <Button variant="secondary" onClick={closeVoa} disabled={busy}>
            Fechar Voa
          </Button>
        )}
        <Button variant="ghost" onClick={() => void loadSession()} disabled={busy}>
          Atualizar
        </Button>
      </div>

      <div
        ref={panelRef}
        className="mt-4 min-h-[320px] rounded-[var(--radius-card)] border border-dashed border-[var(--border-muted)] bg-[var(--surface-muted)]/40"
        aria-label="Painel embed Voa Health"
      />

      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Consulta: {session.mount.consultationId.slice(0, 12)}… · Tipo:{" "}
        {session.mount.options?.consultationType === "TELEMEDICINE" ? "Telemedicina" : "Presencial"}
      </p>
    </Card>
  );
}
