"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import TabBar from "@/components/ui/TabBar";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  STOCK_CATEGORY_LABELS,
  STOCK_MOVEMENT_LABELS,
  STOCK_MOVEMENT_TYPES,
  STOCK_PRODUCT_CATEGORIES,
} from "@/lib/stock-constants";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  categoryLabel: string;
  unit: string;
  minStock: number;
  totalStock: number;
  stockLabel: string;
  lowStock: boolean;
  active: boolean;
  anvisaCode: string | null;
};

type Lot = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  lotNumber: string;
  expiryDateLabel: string;
  quantity: number;
  unitCostLabel: string;
  status: string;
  statusLabel: string;
  expiringSoon: boolean;
  daysToExpiry: number;
};

type Movement = {
  id: string;
  typeLabel: string;
  productName: string;
  productSku: string;
  lotNumber: string | null;
  quantity: number;
  reason: string | null;
  createdAtLabel: string;
};

type AlertItem = {
  kind: string;
  productName: string;
  productSku: string;
  message: string;
  severity: "warning" | "danger" | "info";
  lotNumber?: string;
};

type Overview = {
  productCount: number;
  activeLotCount: number;
  movementsLast30Days: number;
  inventoryValueLabel: string;
  alertCount: number;
  criticalAlerts: number;
  alerts: AlertItem[];
};

type Procedure = { id: string; code: string; name: string };

const TABS = [
  { key: "resumo", label: "Resumo" },
  { key: "produtos", label: "Produtos" },
  { key: "lotes", label: "Lotes" },
  { key: "movimentos", label: "Movimentações" },
  { key: "kits", label: "Kits por procedimento" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const fieldClass =
  "w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]";

export default function StockView() {
  const { isBusy, run, showToast } = useAsyncAction();
  const [tab, setTab] = useState<TabKey>("resumo");
  const [lots, setLots] = useState<Lot[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [kitProcedureId, setKitProcedureId] = useState("");
  const [kitItems, setKitItems] = useState<
    { id: string; productName: string; productSku: string; quantity: number; unit: string }[]
  >([]);

  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    category: "MATERIAL",
    unit: "UN",
    minStock: "10",
    anvisaCode: "",
  });

  const [entryForm, setEntryForm] = useState({
    productId: "",
    lotNumber: "",
    expiryDate: "",
    quantity: "1",
    unitCost: "",
    supplierRef: "",
  });

  const [movementForm, setMovementForm] = useState({
    productId: "",
    type: "SAIDA",
    quantity: "1",
    reason: "",
  });

  const [kitForm, setKitForm] = useState({ productId: "", quantity: "1" });

  const loadCore = useCallback(async () => {
    const [stockRes, procRes] = await Promise.all([
      fetchJson<{ products?: Product[]; overview?: Overview | null }>(
        "/api/interno/stock/products",
        undefined,
        "Erro ao carregar estoque",
      ),
      fetchJson<{ procedures?: Procedure[] }>("/api/interno/procedures"),
    ]);
    if (!stockRes.ok) return stockRes;
    return {
      ok: true as const,
      data: {
        products: stockRes.data.products ?? [],
        overview: stockRes.data.overview ?? null,
        procedures: procRes.ok ? (procRes.data.procedures ?? []) : [],
      },
      status: stockRes.status,
    };
  }, []);

  const { data, loading, error, reload } = useAsyncData(loadCore, [], {
    forbiddenMessage: "Sem permissão para acessar estoque",
  });

  const products = data?.products ?? [];
  const overview = data?.overview ?? null;
  const procedures = data?.procedures ?? [];

  const loadLots = useCallback(async () => {
    const result = await fetchJson<{ lots?: Lot[] }>("/api/interno/stock/lots");
    setLots(result.ok ? (result.data.lots ?? []) : []);
  }, []);

  const loadMovements = useCallback(async () => {
    const result = await fetchJson<{ movements?: Movement[] }>(
      "/api/interno/stock/movements?limit=80",
    );
    setMovements(result.ok ? (result.data.movements ?? []) : []);
  }, []);

  const loadKit = useCallback(async (procedureId: string) => {
    if (!procedureId) {
      setKitItems([]);
      return;
    }
    const result = await fetchJson<{ items?: typeof kitItems }>(
      `/api/interno/stock/procedure-kits/${procedureId}`,
    );
    setKitItems(result.ok ? (result.data.items ?? []) : []);
  }, []);

  useEffect(() => {
    if (tab !== "lotes" && tab !== "movimentos") return;
    let active = true;
    (async () => {
      if (tab === "lotes") {
        const result = await fetchJson<{ lots?: Lot[] }>("/api/interno/stock/lots");
        if (active) setLots(result.ok ? (result.data.lots ?? []) : []);
      }
      if (tab === "movimentos") {
        const result = await fetchJson<{ movements?: Movement[] }>(
          "/api/interno/stock/movements?limit=80",
        );
        if (active) setMovements(result.ok ? (result.data.movements ?? []) : []);
      }
    })();
    return () => {
      active = false;
    };
  }, [tab]);

  useEffect(() => {
    if (!kitProcedureId) return;
    let active = true;
    (async () => {
      const result = await fetchJson<{ items?: typeof kitItems }>(
        `/api/interno/stock/procedure-kits/${kitProcedureId}`,
      );
      if (active) setKitItems(result.ok ? (result.data.items ?? []) : []);
    })();
    return () => {
      active = false;
    };
  }, [kitProcedureId]);

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    await run(
      "product",
      () =>
        fetch("/api/interno/stock/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: productForm.sku,
            name: productForm.name,
            category: productForm.category,
            unit: productForm.unit,
            minStock: Number(productForm.minStock),
            anvisaCode: productForm.anvisaCode || null,
          }),
        }),
      {
        silentSuccess: true,
        errorMessage: "Erro ao cadastrar produto",
        onSuccess: async (body) => {
          const product = body.product as { sku?: string } | undefined;
          showToast({
            message: `Produto ${product?.sku ?? productForm.sku} cadastrado`,
            tone: "success",
          });
          setProductForm({
            sku: "",
            name: "",
            category: "MATERIAL",
            unit: "UN",
            minStock: "10",
            anvisaCode: "",
          });
          await reload();
        },
      },
    );
  }

  async function receiveEntry(e: React.FormEvent) {
    e.preventDefault();
    await run(
      "entry",
      () =>
        fetch("/api/interno/stock/lots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: entryForm.productId,
            lotNumber: entryForm.lotNumber,
            expiryDate: entryForm.expiryDate,
            quantity: Number(entryForm.quantity),
            unitCost: entryForm.unitCost ? Number(entryForm.unitCost) : undefined,
            supplierRef: entryForm.supplierRef || null,
          }),
        }),
      {
        successMessage: "Entrada registrada com sucesso",
        onSuccess: async () => {
          setEntryForm({
            productId: "",
            lotNumber: "",
            expiryDate: "",
            quantity: "1",
            unitCost: "",
            supplierRef: "",
          });
          await reload();
          await loadLots();
        },
      },
    );
  }

  async function registerMovement(e: React.FormEvent) {
    e.preventDefault();
    await run(
      "movement",
      () =>
        fetch("/api/interno/stock/movements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: movementForm.productId,
            type: movementForm.type,
            quantity: Number(movementForm.quantity),
            reason: movementForm.reason || null,
          }),
        }),
      {
        successMessage: "Movimentação registrada",
        onSuccess: async () => {
          await reload();
          await loadMovements();
          await loadLots();
        },
      },
    );
  }

  async function addKitItem(e: React.FormEvent) {
    e.preventDefault();
    if (!kitProcedureId) return;
    await run(
      "kit",
      () =>
        fetch(`/api/interno/stock/procedure-kits/${kitProcedureId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: kitForm.productId,
            quantity: Number(kitForm.quantity),
          }),
        }),
      {
        successMessage: "Material vinculado ao procedimento",
        onSuccess: async () => {
          setKitForm({ productId: "", quantity: "1" });
          await loadKit(kitProcedureId);
        },
      },
    );
  }

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando estoque..."
      onRetry={() => void reload()}
    >
      <div className="space-y-6">
        <TabBar tabs={[...TABS]} active={tab} onSelect={(k) => setTab(k as TabKey)} aria-label="Abas do estoque médico" />

        {tab === "resumo" && overview && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <p className="text-sm text-[var(--text-muted)]">Produtos ativos</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{overview.productCount}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-[var(--text-muted)]">Lotes em estoque</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{overview.activeLotCount}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-[var(--text-muted)]">Movimentações (30 dias)</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{overview.movementsLast30Days}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-[var(--text-muted)]">Valor em estoque</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{overview.inventoryValueLabel}</p>
              </Card>
            </div>

            <Card className="p-4">
              <SectionHeader
                title="Alertas operacionais"
                description="Estoque mínimo, validade próxima e lotes bloqueados — padrão de mercado (RDC 304/2019)."
              />
              {overview.alerts.length === 0 ? (
                <EmptyState title="Nenhum alerta" message="Estoque dentro dos parâmetros configurados." />
              ) : (
                <ul className="mt-4 space-y-2">
                  {overview.alerts.map((alert, i) => (
                    <li
                      key={`${alert.productSku}-${alert.kind}-${i}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-card)] border border-[var(--border-muted)] px-3 py-2"
                    >
                      <div>
                        <span className="font-medium text-[var(--text-primary)]">{alert.productName}</span>
                        <span className="ml-2 text-sm text-[var(--text-muted)]">{alert.productSku}</span>
                        <p className="text-sm text-[var(--text-secondary)]">{alert.message}</p>
                      </div>
                      <StatusBadge
                        value={
                          alert.severity === "danger"
                            ? "CANCELADO"
                            : alert.severity === "warning"
                              ? "PENDENTE"
                              : "CONFIRMADO"
                        }
                        label={
                          alert.severity === "danger"
                            ? "Crítico"
                            : alert.severity === "warning"
                              ? "Atenção"
                              : "Info"
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}

        {tab === "produtos" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="p-4">
              <SectionHeader title="Catálogo de produtos" />
              {products.length === 0 ? (
                <EmptyState title="Sem produtos" message="Cadastre o primeiro item médico." />
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-muted)] text-left text-[var(--text-muted)]">
                        <th className="py-2 pr-3">SKU</th>
                        <th className="py-2 pr-3">Nome</th>
                        <th className="py-2 pr-3">Categoria</th>
                        <th className="py-2 pr-3">Saldo</th>
                        <th className="py-2">Mín.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-[var(--border-muted)]/60">
                          <td className="py-2 pr-3 font-mono text-xs">{p.sku}</td>
                          <td className="py-2 pr-3">
                            {p.name}
                            {p.lowStock && (
                              <span className="ml-2 text-xs text-amber-600">baixo</span>
                            )}
                          </td>
                          <td className="py-2 pr-3">{p.categoryLabel}</td>
                          <td className="py-2 pr-3">{p.stockLabel}</td>
                          <td className="py-2">{p.minStock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <SectionHeader title="Novo produto" />
              <form onSubmit={createProduct} className="mt-4 space-y-3">
                <input className={fieldClass} placeholder="SKU" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} required />
                <input className={fieldClass} placeholder="Nome" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                <select className={fieldClass} value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
                  {STOCK_PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{STOCK_CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
                <input className={fieldClass} placeholder="Estoque mínimo" type="number" min="0" value={productForm.minStock} onChange={(e) => setProductForm({ ...productForm, minStock: e.target.value })} />
                <input className={fieldClass} placeholder="Registro ANVISA (opcional)" value={productForm.anvisaCode} onChange={(e) => setProductForm({ ...productForm, anvisaCode: e.target.value })} />
                <Button type="submit" disabled={isBusy("product")}>Cadastrar</Button>
              </form>
            </Card>
          </div>
        )}

        {tab === "lotes" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="p-4">
              <SectionHeader title="Lotes e validade" description="Rastreabilidade por lote — FIFO na dispensação." />
              {lots.length === 0 ? (
                <EmptyState title="Sem lotes" message="Registre uma entrada de estoque." />
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-muted)] text-left text-[var(--text-muted)]">
                        <th className="py-2 pr-3">Produto</th>
                        <th className="py-2 pr-3">Lote</th>
                        <th className="py-2 pr-3">Validade</th>
                        <th className="py-2 pr-3">Qtd</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lots.map((lot) => (
                        <tr key={lot.id} className="border-b border-[var(--border-muted)]/60">
                          <td className="py-2 pr-3">{lot.productName}</td>
                          <td className="py-2 pr-3 font-mono text-xs">{lot.lotNumber}</td>
                          <td className="py-2 pr-3">
                            {lot.expiryDateLabel}
                            {lot.expiringSoon && lot.daysToExpiry >= 0 && (
                              <span className="ml-1 text-xs text-amber-600">({lot.daysToExpiry}d)</span>
                            )}
                          </td>
                          <td className="py-2 pr-3">{lot.quantity}</td>
                          <td className="py-2">{lot.statusLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <SectionHeader title="Entrada de estoque" />
              <form onSubmit={receiveEntry} className="mt-4 space-y-3">
                <select className={fieldClass} value={entryForm.productId} onChange={(e) => setEntryForm({ ...entryForm, productId: e.target.value })} required>
                  <option value="">Produto</option>
                  {products.filter((p) => p.active).map((p) => (
                    <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                  ))}
                </select>
                <input className={fieldClass} placeholder="Nº do lote" value={entryForm.lotNumber} onChange={(e) => setEntryForm({ ...entryForm, lotNumber: e.target.value })} required />
                <input className={fieldClass} type="date" value={entryForm.expiryDate} onChange={(e) => setEntryForm({ ...entryForm, expiryDate: e.target.value })} required />
                <input className={fieldClass} type="number" min="0.01" step="0.01" placeholder="Quantidade" value={entryForm.quantity} onChange={(e) => setEntryForm({ ...entryForm, quantity: e.target.value })} required />
                <input className={fieldClass} type="number" min="0" step="0.01" placeholder="Custo unitário (R$)" value={entryForm.unitCost} onChange={(e) => setEntryForm({ ...entryForm, unitCost: e.target.value })} />
                <Button type="submit" disabled={isBusy("entry")}>Registrar entrada</Button>
              </form>
            </Card>
          </div>
        )}

        {tab === "movimentos" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="p-4">
              <SectionHeader title="Histórico de movimentações" />
              {movements.length === 0 ? (
                <EmptyState title="Sem movimentações" message="Nenhuma movimentação registrada ainda." />
              ) : (
                <ul className="mt-4 space-y-2">
                  {movements.map((m) => (
                    <li key={m.id} className="rounded-[var(--radius-card)] border border-[var(--border-muted)] px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{m.typeLabel}</span>
                        <span className="text-[var(--text-muted)]">{m.createdAtLabel}</span>
                      </div>
                      <p>{m.productName} ({m.productSku}) — {m.quantity} un.</p>
                      {m.lotNumber && <p className="text-[var(--text-muted)]">Lote {m.lotNumber}</p>}
                      {m.reason && <p className="text-[var(--text-secondary)]">{m.reason}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <SectionHeader title="Nova movimentação" />
              <form onSubmit={registerMovement} className="mt-4 space-y-3">
                <select className={fieldClass} value={movementForm.productId} onChange={(e) => setMovementForm({ ...movementForm, productId: e.target.value })} required>
                  <option value="">Produto</option>
                  {products.filter((p) => p.active).map((p) => (
                    <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                  ))}
                </select>
                <select className={fieldClass} value={movementForm.type} onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })}>
                  {STOCK_MOVEMENT_TYPES.filter((t) => t !== "ENTRADA" && t !== "DISPENSACAO").map((t) => (
                    <option key={t} value={t}>{STOCK_MOVEMENT_LABELS[t]}</option>
                  ))}
                </select>
                <input className={fieldClass} type="number" min="0.01" step="0.01" value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} required />
                <input className={fieldClass} placeholder="Motivo" value={movementForm.reason} onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })} />
                <Button type="submit" disabled={isBusy("movement")}>Registrar</Button>
              </form>
            </Card>
          </div>
        )}

        {tab === "kits" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="p-4">
              <SectionHeader
                title="Kit de materiais por procedimento"
                description="Baixa automática ao registrar Pay Per Use no atendimento (padrão iClinic/Feegow)."
              />
              <select
                className={`${fieldClass} mt-4 max-w-md`}
                value={kitProcedureId}
                onChange={(e) => {
                  setKitProcedureId(e.target.value);
                  setKitItems([]);
                }}
              >
                <option value="">Selecione o procedimento</option>
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                ))}
              </select>
              {kitProcedureId && kitItems.length === 0 && (
                <EmptyState className="mt-4" title="Kit vazio" message="Vincule materiais consumidos neste procedimento." />
              )}
              {kitItems.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {kitItems.map((item) => (
                    <li key={item.id} className="rounded-[var(--radius-card)] border border-[var(--border-muted)] px-3 py-2 text-sm">
                      {item.productName} ({item.productSku}) — {item.quantity} {item.unit}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <SectionHeader title="Adicionar ao kit" />
              <form onSubmit={addKitItem} className="mt-4 space-y-3">
                <select className={fieldClass} value={kitForm.productId} onChange={(e) => setKitForm({ ...kitForm, productId: e.target.value })} required>
                  <option value="">Material</option>
                  {products.filter((p) => p.active).map((p) => (
                    <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                  ))}
                </select>
                <input className={fieldClass} type="number" min="0.01" step="0.01" value={kitForm.quantity} onChange={(e) => setKitForm({ ...kitForm, quantity: e.target.value })} required />
                <Button type="submit" disabled={isBusy("kit") || !kitProcedureId}>Vincular</Button>
              </form>
            </Card>
          </div>
        )}
      </div>
    </ViewStateBoundary>
  );
}
