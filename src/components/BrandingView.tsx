"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { BrandingTokens } from "@/lib/theme/tokens";
import { COLOR_SCHEMES, type ColorScheme } from "@/lib/theme/color-scheme";
import { BRANDING_PRESETS, SEGMENT_BRANDING_PRESETS, VARIETY_BRANDING_PRESETS } from "@/lib/theme/presets";
import { brandingToCssVars } from "@/lib/theme/css-vars";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import SectionHeader from "@/components/ui/SectionHeader";
import { customDomainSetupHint } from "@/lib/custom-domain-hint";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";

type ColorField = keyof Pick<
  BrandingTokens,
  "primaryColor" | "accentColor" | "heroFrom" | "heroTo"
>;

const colorFields: { key: ColorField; label: string }[] = [
  { key: "primaryColor", label: "Cor primária" },
  { key: "accentColor", label: "Cor de destaque" },
  { key: "heroFrom", label: "Hero (início)" },
  { key: "heroTo", label: "Hero (fim)" },
];

export default function BrandingView() {
  const router = useRouter();
  const { isBusy, run, showToast } = useAsyncAction();
  const [draft, setDraft] = useState<BrandingTokens | null>(null);

  const loadBranding = useCallback(
    () =>
      fetchJson<{ branding: BrandingTokens }>(
        "/api/interno/branding",
        undefined,
        "Erro ao carregar branding",
      ),
    [],
  );

  const { data, loading, error, reload } = useAsyncData(loadBranding, [], {
    forbiddenMessage: "Sem permissão para acessar identidade visual",
  });

  const form = draft ?? data?.branding ?? null;

  function updateField<K extends keyof BrandingTokens>(key: K, value: BrandingTokens[K]) {
    setDraft((prev) => {
      const base = prev ?? data?.branding;
      if (!base) return prev;
      return { ...base, [key]: value };
    });
  }

  function applyPreset(presetId: string) {
    const preset = BRANDING_PRESETS.find((p) => p.id === presetId);
    if (!preset || !form) return;
    setDraft({
      ...form,
      ...preset.tokens,
      displayName: form.displayName || preset.tokens.displayName,
    });
    showToast({
      message: `Preset "${preset.label}" aplicado — salve para persistir.`,
      tone: "info",
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    await run(
      "save",
      () =>
        fetch("/api/interno/branding", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }),
      {
        silentSuccess: true,
        errorMessage: "Erro ao salvar",
        onSuccess: async (body) => {
          setDraft(null);
          await reload();
          showToast({
            message: String(body.message ?? "Identidade visual atualizada"),
            tone: "success",
          });
          router.refresh();
        },
      },
    );
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await run(
      "upload",
      () => {
        const body = new FormData();
        body.append("file", file);
        return fetch("/api/interno/branding/logo", { method: "POST", body });
      },
      {
        silentSuccess: true,
        errorMessage: "Erro no upload",
        onSuccess: (body) => {
          updateField("logoUrl", body.logoUrl as string | null);
          showToast({
            message: String(body.message ?? "Logo atualizado — salve para confirmar outras alterações."),
            tone: "success",
          });
        },
      },
    );
    e.target.value = "";
  }

  async function verifyDomain() {
    if (!form) return;
    await run(
      "verify-domain",
      () =>
        fetch("/api/interno/branding", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, verifyCustomDomain: true }),
        }),
      {
        successMessage: "Domínio marcado como verificado (simulação POC)",
        onSuccess: async () => {
          setDraft(null);
          await reload();
          router.refresh();
        },
      },
    );
  }

  async function discardChanges() {
    setDraft(null);
    await reload();
  }

  const previewStyle = form ? (brandingToCssVars(form) as React.CSSProperties) : undefined;

  return (
    <ViewStateBoundary
      loading={loading}
      error={error && !form ? error : null}
      loadingMessage="Carregando identidade visual..."
      onRetry={() => void reload()}
    >
      {form && previewStyle && (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <form onSubmit={handleSave} className="order-2 space-y-6 lg:order-1">

        <Card>
          <SectionHeader
            title="Presets por segmento"
            description="Paletas nativas de cada vertical ServiceOS — aplicam cores completas do nicho."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {SEGMENT_BRANDING_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => applyPreset(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Variedades de esquema"
            description="Paletas adicionais para personalizar além do segmento padrão."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {VARIETY_BRANDING_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => applyPreset(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Identidade" description="Nome e mensagem exibidos aos usuários." />
          <div className="mt-4 space-y-4">
            <Input
              label="Nome de exibição"
              value={form.displayName}
              onChange={(e) => updateField("displayName", e.target.value)}
              required
            />
            <Input
              label="Tagline"
              value={form.tagline ?? ""}
              onChange={(e) => updateField("tagline", e.target.value || null)}
              hint="Subtítulo na landing e materiais de marca"
            />
            <Input
              label="Rótulo da plataforma"
              value={form.platformLabel}
              onChange={(e) => updateField("platformLabel", e.target.value)}
              hint='Ex.: "Powered by Sistema Bibi - ServiceOS"'
              required
            />
            <label className="block text-sm">
              <span className="font-medium text-[var(--text-secondary)]">Tema da interface</span>
              <select
                value={form.colorScheme}
                onChange={(e) => updateField("colorScheme", e.target.value as ColorScheme)}
                className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-[var(--text-primary)]"
              >
                {COLOR_SCHEMES.map((scheme) => (
                  <option key={scheme} value={scheme}>
                    {scheme === "light"
                      ? "Claro"
                      : scheme === "dark"
                        ? "Escuro"
                        : "Sistema (preferência do dispositivo)"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Logo"
            description="URL pública ou upload (PNG/JPG/WebP/SVG, máx. 200KB). Em produção Netlify usa Blobs; localmente grava em disco."
          />
          <div className="mt-4 space-y-4">
            <Input
              label="URL do logo"
              value={form.logoUrl ?? ""}
              onChange={(e) => updateField("logoUrl", e.target.value || null)}
              placeholder="https://..."
            />
            <label className="block text-sm">
              <span className="font-medium text-[var(--text-secondary)]">Upload</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                disabled={isBusy("upload")}
                onChange={handleLogoUpload}
                className="mt-1 block w-full text-sm text-[var(--text-muted)] file:mr-3 file:rounded-[var(--radius-button)] file:border-0 file:bg-[var(--surface-muted)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--text-secondary)]"
              />
            </label>
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Domínio customizado"
            description="White label com DNS próprio (CNAME para Netlify). Verificação manual na POC."
          />
          <div className="mt-4 space-y-4">
            <Input
              label="Domínio"
              value={form.customDomain ?? ""}
              onChange={(e) => updateField("customDomain", e.target.value || null)}
              placeholder="saude.suaempresa.com.br"
              hint={
                form.customDomain
                  ? customDomainSetupHint(form.customDomain)
                  : "Deixe vazio para usar apenas o host padrão"
              }
            />
            {form.customDomain && (
              <p className="text-sm text-[var(--text-muted)]">
                Status:{" "}
                {form.customDomainVerified ? (
                  <span className="font-medium text-emerald-600">Verificado</span>
                ) : (
                  <span className="font-medium text-amber-600">Aguardando verificação DNS</span>
                )}
              </p>
            )}
            {form.customDomain && !form.customDomainVerified && (
              <Button type="button" variant="secondary" size="sm" disabled={isBusy("verify-domain")} onClick={verifyDomain}>
                Marcar domínio como verificado
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Cores" description="Paleta aplicada em botões, hero e header." />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {colorFields.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  {label}
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={form[key]}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded border border-[var(--border-muted)]"
                    aria-label={`${label} picker`}
                  />
                  <input
                    type="text"
                    value={form[key]}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="flex-1 rounded-[var(--radius-button)] border border-[var(--border-muted)] px-3 py-2 font-mono text-sm"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isBusy("save")}>
            {isBusy("save") ? "Salvando..." : "Salvar identidade visual"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => void discardChanges()}>
            Descartar alterações
          </Button>
        </div>
      </form>

      <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-6 lg:self-start">
        <Card padding="sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Pré-visualização
          </p>
          <div
            className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)]"
            data-theme={form.colorScheme}
            style={previewStyle}
          >
            <div className="p-3 text-[var(--text-inverse)]">
              <div
                className="rounded-lg px-4 py-6"
                style={{
                  background: `linear-gradient(to bottom right, ${form.heroFrom}, ${form.heroTo})`,
                }}
              >
                <div className="flex items-center gap-2">
                  {form.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logoUrl} alt="" className="h-8 w-8 rounded object-contain" />
                  ) : (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded text-xs font-bold"
                      style={{ backgroundColor: form.primaryColor }}
                    >
                      {form.displayName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold">{form.displayName}</p>
                    <p className="text-xs text-white/70">{form.tagline ?? "Tagline do tenant"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2 bg-[var(--surface-card)] p-3">
              <button
                type="button"
                className="w-full rounded-[var(--radius-button)] px-3 py-2 text-sm font-semibold text-[var(--text-inverse)]"
                style={{ backgroundColor: form.primaryColor }}
              >
                Botão primário
              </button>
              <button
                type="button"
                className="w-full rounded-[var(--radius-button)] px-3 py-2 text-sm font-semibold text-[var(--text-inverse)]"
                style={{ backgroundColor: form.accentColor }}
              >
                Botão destaque
              </button>
              <p className="pt-1 text-center text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                {form.platformLabel}
              </p>
            </div>
          </div>
        </Card>
      </aside>
    </div>
      )}
    </ViewStateBoundary>
  );
}
