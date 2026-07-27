import "server-only";
import { formatDateTimeBR } from "@/lib/timezone";
import PDFDocument from "pdfkit";

export type ClinicalGuideClinic = {
  displayName: string;
  tagline: string | null;
  platformLabel: string;
};

export type ClinicalGuidePatient = {
  name: string;
  cpf: string;
  birthDateLabel: string;
  phone: string | null;
  companyName: string | null;
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

function councilLabel(provider: ClinicalGuideProvider): string | null {
  if (!provider.councilType || !provider.councilNumber) return null;
  const uf = provider.councilUf ? `/${provider.councilUf}` : "";
  return `${provider.councilType} ${provider.councilNumber}${uf}`;
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

function drawGuidePage(
  doc: PDFKit.PDFDocument,
  ctx: ClinicalGuideContext,
  viaLabel?: string | null,
): void {
  const { clinic, patient, provider, page } = ctx;
  const margin = 48;
  const contentWidth = doc.page.width - margin * 2;

  doc.rect(0, 0, doc.page.width, 88).fill("#0f766e");
  doc.fillColor("#ffffff").fontSize(18).font("Helvetica-Bold");
  doc.text(clinic.displayName, margin, 28, { width: contentWidth });
  if (clinic.tagline) {
    doc.fontSize(10).font("Helvetica").fillColor("#ccfbf1");
    doc.text(clinic.tagline, margin, 50, { width: contentWidth });
  }
  doc.fontSize(8).fillColor("#99f6e4");
  doc.text(`Documento clínico · ${clinic.platformLabel}`, margin, 68, {
    width: contentWidth,
  });

  let y = 108;
  doc.fillColor("#0f766e").font("Helvetica-Bold").fontSize(14);
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
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Identificação", margin, y);
  y += 16;
  doc.font("Helvetica").fontSize(10);
  doc.text(`Nome: ${patient.name}`, margin, y);
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
    if (y > doc.page.height - 120) {
      doc.addPage();
      y = margin;
    }
    if (section.heading) {
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f766e");
      doc.text(section.heading, margin, y, { width: contentWidth });
      y = doc.y + 8;
    }
    doc.font("Helvetica").fontSize(10).fillColor("#0f172a");
    doc.text(section.body, margin, y, { width: contentWidth, align: "left" });
    y = doc.y + 4;
  }

  if (page.footerNote) {
    y = Math.max(y + 16, doc.page.height - 90);
    doc.fontSize(8).fillColor("#64748b");
    doc.text(page.footerNote, margin, y, { width: contentWidth, align: "left" });
  }

  const footerY = doc.page.height - margin;
  doc.fontSize(8).fillColor("#94a3b8");
  doc.text(
    `Documento gerado em ${formatDateTimeBR(new Date())}. Uso exclusivo assistencial — não substitui assinatura digital ICP-Brasil.`,
    margin,
    footerY,
    { width: contentWidth, align: "center" },
  );
}

/** PDF A4 de guias clínicas (receita, pedido de exame, encaminhamento). */
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
