import "server-only";
import PDFDocument from "pdfkit";
import { formatBRL } from "@/lib/pricing";
import type { BudgetView, ProjectDetail } from "@/lib/project/project-service";

export type BudgetPdfData = {
  tenantName: string;
  platformLabel: string;
  project: Pick<ProjectDetail, "code" | "name" | "companyName" | "addressCity" | "addressState">;
  budget: BudgetView;
};

function pdfBufferFromDoc(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

/** PDF de orçamento / proposta de obra. */
export async function buildBudgetPdfBuffer(data: BudgetPdfData): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const margin = 48;
  const w = doc.page.width - margin * 2;

  doc.fontSize(16).fillColor("#0f172a").text(data.tenantName);
  doc.fontSize(10).fillColor("#64748b").text(`Proposta comercial · Orçamento v${data.budget.version}`);
  doc.moveDown(0.8);

  doc.fontSize(12).fillColor("#0f172a").text(`Obra: ${data.project.code} — ${data.project.name}`);
  if (data.project.companyName) doc.text(`Cliente: ${data.project.companyName}`);
  if (data.project.addressCity) {
    doc.text(`Local: ${[data.project.addressCity, data.project.addressState].filter(Boolean).join(" / ")}`);
  }
  doc.text(`Status: ${data.budget.statusLabel}`);
  if (data.budget.validUntil) {
    doc.text(`Validade: ${new Date(data.budget.validUntil).toLocaleDateString("pt-BR")}`);
  }
  doc.moveDown(1);

  doc.font("Helvetica-Bold").fontSize(11).text("Itens do orçamento");
  doc.font("Helvetica").fontSize(9);
  doc.moveDown(0.4);

  for (const item of data.budget.lineItems) {
    doc.text(
      `• ${item.description} — ${item.quantity} ${item.unit} × ${formatBRL(item.unitPrice)} = ${formatBRL(item.total)}`,
      { width: w },
    );
  }

  doc.moveDown(1);
  doc.fontSize(10).text(`Subtotal: ${formatBRL(data.budget.subtotal)}`);
  doc.text(`BDI (${data.budget.bdiPercent}%): ${formatBRL(data.budget.total - data.budget.subtotal)}`);
  doc.font("Helvetica-Bold").fontSize(13).text(`Total: ${formatBRL(data.budget.total)}`);

  if (data.budget.notes) {
    doc.moveDown(1);
    doc.font("Helvetica").fontSize(9).fillColor("#475569").text(`Observações: ${data.budget.notes}`, { width: w });
  }

  doc.fontSize(8).fillColor("#94a3b8").text(
    `Gerado em ${new Date().toLocaleString("pt-BR")} · ${data.platformLabel}`,
    margin,
    doc.page.height - margin,
    { width: w, align: "center" },
  );

  return pdfBufferFromDoc(doc);
}
