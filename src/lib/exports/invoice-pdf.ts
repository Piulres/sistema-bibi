import "server-only";
import PDFDocument from "pdfkit";
import { formatBRL } from "@/lib/pricing";

export type InvoiceExportData = {
  clinicName: string;
  platformLabel: string;
  invoice: {
    id: string;
    createdAtLabel: string;
    status: string;
    totalLabel: string;
    patientName: string;
    companyName: string | null;
    items: { description: string; amountLabel: string }[];
  };
  payment?: {
    method: string;
    pixCopyPaste: string | null;
    status: string;
  } | null;
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

/** PDF de fatura / boleto (com PIX quando pendente). */
export async function buildInvoicePdfBuffer(data: InvoiceExportData): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const margin = 48;
  const w = doc.page.width - margin * 2;

  doc.fontSize(16).fillColor("#0f172a").text(data.clinicName);
  doc.fontSize(10).fillColor("#64748b").text("Fatura / cobrança de serviços de saúde");
  doc.moveDown(1);

  doc.fontSize(12).fillColor("#0f172a").text(`Beneficiário: ${data.invoice.patientName}`);
  if (data.invoice.companyName) {
    doc.text(`Empresa: ${data.invoice.companyName}`);
  }
  doc.text(`Emissão: ${data.invoice.createdAtLabel}`);
  doc.text(`Status: ${data.invoice.status}`);
  doc.text(`Referência: ${data.invoice.id.slice(0, 12)}…`);
  doc.moveDown(1);

  doc.font("Helvetica-Bold").text("Itens");
  doc.font("Helvetica");
  for (const item of data.invoice.items) {
    doc.text(`• ${item.description} — ${item.amountLabel}`);
  }

  doc.moveDown(1);
  doc.font("Helvetica-Bold").fontSize(14).text(`Total: ${data.invoice.totalLabel}`);

  if (data.payment?.pixCopyPaste && data.payment.status === "PENDING") {
    doc.moveDown(1.2);
    doc.fontSize(11).fillColor("#0f766e").text("Pagamento via PIX", { underline: true });
    doc.fillColor("#0f172a").fontSize(9);
    doc.text("Copia e cola o código abaixo no app do seu banco:", { width: w });
    doc.moveDown(0.4);
    doc.font("Courier").fontSize(8).text(data.payment.pixCopyPaste, { width: w });
  }

  doc.fontSize(8).fillColor("#94a3b8").text(
    `Gerado em ${new Date().toLocaleString("pt-BR")} · ${data.platformLabel}`,
    margin,
    doc.page.height - margin,
    { width: w, align: "center" },
  );

  return pdfBufferFromDoc(doc);
}

export function invoiceStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ABERTA: "Aberta",
    FECHADA: "Aguardando pagamento",
    PAGA: "Paga",
  };
  return map[status] ?? status;
}

export { formatBRL };
