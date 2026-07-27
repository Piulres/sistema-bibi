import "server-only";
import { formatDateTimeBR } from "@/lib/timezone";
import PDFDocument from "pdfkit";

export type ClinicalGuideClinic = {
  displayName: string;
  tagline: string | null;
  platformLabel: string;
  /** Cor primária do tenant (cabeçalho tipográfico). */
  primaryColor?: string | null;
};

export type ClinicalGuidePatient = {
  name: string;
  cpf: string;
  birthDateLabel: string;
  phone: string | null;
  companyName: string | null;
  /** Label de nicho (Paciente / Tutor / Aluno…) — evita hardcode. */
  roleLabel?: string | null;
};

export type ClinicalGuideProvider = {
  name: string;
  councilType: string | null;
  councilNumber: string | null;
  councilUf: string | null;
  specialty: string | null;
};

export type ClinicalGuideSection = {
  heading?: string;
  body: string;
};

export type ClinicalGuidePage = {
  docTypeLabel: string;
  title: string;
  subtitle?: string | null;
  issuedAtLabel: string;
  appointmentDateLabel?: string | null;
  sections: ClinicalGuideSection[];
  footerNote?: string | null;
  /** Segunda via (controle especial) — imprime página duplicada com rótulo. */
  duplicateViaLabel?: string | null;
};

export type ClinicalGuideContext = {
  clinic: ClinicalGuideClinic;
  patient: ClinicalGuidePatient;
  provider: ClinicalGuideProvider;
  page: ClinicalGuidePage;
};

const DEFAULT_PRIMARY = "#0f766e";
const PAGE_BOTTOM_RESERVE = 140;

function councilLabel(provider: ClinicalGuideProvider): string | null {
  if (!provider.councilType || !provider.councilNumber) return null;
  const uf = provider.councilUf ? `/${provider.councilUf}` : "";
  return `${provider.councilType} ${provider.councilNumber}${uf}`;
}

function resolvePrimary(clinic: ClinicalGuideClinic): string {
  const raw = clinic.primaryColor?.trim();
  if (raw && /^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  return DEFAULT_PRIMARY;
}

function pdfBufferFromDoc(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

function drawHeaderBand(
  doc: PDFKit.PDFDocument,
  clinic: ClinicalGuideClinic,
  primary: string,
  margin: number,
  contentWidth: number,
): number {
  doc.rect(0, 0, doc.page.width, 88).fill(primary);
  doc.fillColor("#ffffff").fontSize(18).font("Helvetica-Bold");
  doc.text(clinic.displayName, margin, 28, { width: contentWidth });
  if (clinic.tagline) {
    doc.fontSize(10).font("Helvetica").fillColor("#e2e8f0");
    doc.text(clinic.tagline, margin, 50, { width: contentWidth });
  }
  doc.fontSize(8).fillColor("#cbd5e1");
  doc.text(`Documento clínico · ${clinic.platformLabel}`, margin, 68, {
    width: contentWidth,
  });
  return 108;
}

function drawSignatureBlock(
  doc: PDFKit.PDFDocument,
  provider: ClinicalGuideProvider,
  margin: number,
  contentWidth: number,
  y: number,
): number {
  const council = councilLabel(provider);
  const blockTop = Math.max(y + 20, doc.page.height - PAGE_BOTTOM_RESERVE + 8);

  doc
    .strokeColor("#cbd5e1")
    .lineWidth(0.5)
    .moveTo(margin, blockTop)
    .lineTo(margin + contentWidth * 0.55, blockTop)
    .stroke();

  let cursor = blockTop + 10;
  doc.font("Helvetica").fontSize(9).fillColor("#334155");
  doc.text("Assinatura e carimbo do profissional", margin, cursor, {
    width: contentWidth * 0.55,
  });
  cursor += 14;
  doc.fillColor("#64748b").fontSize(8);
  doc.text(provider.name, margin, cursor, { width: contentWidth * 0.55 });
  cursor += 12;
  if (council) {
    doc.text(council, margin, cursor, { width: contentWidth * 0.55 });
    cursor += 12;
  }
  doc.text("Data: ____ / ____ / ________", margin, cursor, {
    width: contentWidth * 0.55,
  });
  return cursor + 16;
}

function ensureSpace(
  doc: PDFKit.PDFDocument,
  ctx: ClinicalGuideContext,
  primary: string,
  margin: number,
  contentWidth: number,
  y: number,
  needed: number,
): number {
  if (y + needed <= doc.page.height - PAGE_BOTTOM_RESERVE) return y;
  drawPageFooter(doc, margin, contentWidth);
  doc.addPage();
  return drawHeaderBand(doc, ctx.clinic, primary, margin, contentWidth);
}

function drawPageFooter(
  doc: PDFKit.PDFDocument,
  margin: number,
  contentWidth: number,
): void {
  const footerY = doc.page.height - margin;
  doc.fontSize(8).fillColor("#94a3b8");
  doc.text(
    `Documento gerado em ${formatDateTimeBR(new Date())}. Uso exclusivo assistencial — não substitui assinatura digital ICP-Brasil.`,
    margin,
    footerY,
    { width: contentWidth, align: "center" },
  );
}

function drawGuidePage(
  doc: PDFKit.PDFDocument,
  ctx: ClinicalGuideContext,
  viaLabel?: string | null,
): void {
  const { clinic, patient, provider, page } = ctx;
  const margin = 48;
  const contentWidth = doc.page.width - margin * 2;
  const primary = resolvePrimary(clinic);
  const roleLabel = patient.roleLabel?.trim() || "Paciente";

  let y = drawHeaderBand(doc, clinic, primary, margin, contentWidth);

  doc.fillColor(primary).font("Helvetica-Bold").fontSize(14);
  doc.text(page.docTypeLabel.toUpperCase(), margin, y, { width: contentWidth });
  y += 20;

  if (viaLabel) {
    doc.fillColor("#b45309").fontSize(10).font("Helvetica-Bold");
    doc.text(viaLabel, margin, y, { width: contentWidth });
    y += 16;
  }

  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(12);
  doc.text(page.title, margin, y, { width: contentWidth });
  y += 16;

  if (page.subtitle) {
    doc.font("Helvetica").fontSize(9).fillColor("#64748b");
    doc.text(page.subtitle, margin, y, { width: contentWidth });
    y += 14;
  }

  doc.font("Helvetica").fontSize(9).fillColor("#64748b");
  doc.text(`Emitido em ${page.issuedAtLabel}`, margin, y);
  y += 12;
  if (page.appointmentDateLabel) {
    doc.text(`Atendimento: ${page.appointmentDateLabel}`, margin, y);
    y += 12;
  }

  y += 8;
  y = ensureSpace(doc, ctx, primary, margin, contentWidth, y, 80);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Identificação", margin, y);
  y += 16;
  doc.font("Helvetica").fontSize(10);
  doc.text(`${roleLabel}: ${patient.name}`, margin, y);
  y += 14;
  doc.text(`CPF: ${patient.cpf} · Nascimento: ${patient.birthDateLabel}`, margin, y);
  y += 14;
  if (patient.phone) {
    doc.text(`Telefone: ${patient.phone}`, margin, y);
    y += 14;
  }
  if (patient.companyName) {
    doc.text(`Plano / empresa: ${patient.companyName}`, margin, y);
    y += 14;
  }

  y += 6;
  y = ensureSpace(doc, ctx, primary, margin, contentWidth, y, 60);
  doc.font("Helvetica-Bold").fontSize(11).text("Profissional solicitante", margin, y);
  y += 16;
  doc.font("Helvetica").fontSize(10);
  doc.text(provider.name, margin, y);
  y += 14;
  const council = councilLabel(provider);
  if (council) {
    doc.text(council, margin, y);
    y += 14;
  }
  if (provider.specialty) {
    doc.text(`Especialidade: ${provider.specialty}`, margin, y);
    y += 14;
  }

  for (const section of page.sections) {
    y += 10;
    y = ensureSpace(doc, ctx, primary, margin, contentWidth, y, 48);
    if (section.heading) {
      doc.font("Helvetica-Bold").fontSize(11).fillColor(primary);
      doc.text(section.heading, margin, y, { width: contentWidth });
      y = doc.y + 8;
    }
    doc.font("Helvetica").fontSize(10).fillColor("#0f172a");
    doc.text(section.body, margin, y, { width: contentWidth, align: "left" });
    y = doc.y + 4;
  }

  if (page.footerNote) {
    y = ensureSpace(doc, ctx, primary, margin, contentWidth, y, 36);
    y += 12;
    doc.fontSize(8).fillColor("#64748b");
    doc.text(page.footerNote, margin, y, { width: contentWidth, align: "left" });
    y = doc.y + 4;
  }

  drawSignatureBlock(doc, provider, margin, contentWidth, y);
  drawPageFooter(doc, margin, contentWidth);
}

/** PDF A4 de guias clínicas (receita, pedido de exame, encaminhamento, atestado). */
export async function buildClinicalGuidePdfBuffer(
  contexts: ClinicalGuideContext[],
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  let pageIndex = 0;

  for (const ctx of contexts) {
    if (pageIndex > 0) doc.addPage();
    drawGuidePage(doc, ctx, null);
    pageIndex += 1;

    if (ctx.page.duplicateViaLabel) {
      doc.addPage();
      drawGuidePage(doc, ctx, ctx.page.duplicateViaLabel);
      pageIndex += 1;
    }
  }

  return pdfBufferFromDoc(doc);
}
