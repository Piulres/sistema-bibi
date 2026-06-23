import "server-only";
import PDFDocument from "pdfkit";

export type PepExportContext = {
  clinic: {
    displayName: string;
    tagline: string | null;
    platformLabel: string;
  };
  patient: {
    name: string;
    cpf: string;
    birthDateLabel: string;
    phone: string | null;
    companyName: string | null;
  };
  provider: {
    name: string;
    councilType: string | null;
    councilNumber: string | null;
    councilUf: string | null;
    specialty: string | null;
    phone: string | null;
  };
  record: {
    recordType: string;
    title: string | null;
    content: string;
    createdAtLabel: string;
    appointmentDateLabel: string | null;
  };
};

const RECORD_TYPE_LABELS: Record<string, string> = {
  EVOLUCAO: "Evolução clínica",
  ANAMNESE: "Anamnese",
  RECEITA: "Receituário",
  ATESTADO: "Atestado médico",
};

function councilLabel(provider: PepExportContext["provider"]): string | null {
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

function drawPepPage(doc: PDFKit.PDFDocument, ctx: PepExportContext): void {
  const { clinic, patient, provider, record } = ctx;
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
  doc.text(`Prontuário Eletrônico do Paciente (PEP) · ${clinic.platformLabel}`, margin, 68, {
    width: contentWidth,
  });

  doc.fillColor("#0f172a");
  let y = 108;

  doc.font("Helvetica-Bold").fontSize(11).text("Paciente", margin, y);
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
    doc.text(`Plano: ${patient.companyName}`, margin, y);
    y += 14;
  }

  y += 8;
  doc.font("Helvetica-Bold").fontSize(11).text("Profissional responsável", margin, y);
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

  y += 8;
  const typeLabel = RECORD_TYPE_LABELS[record.recordType] ?? record.recordType;
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f766e");
  doc.text(record.title?.trim() || typeLabel, margin, y);
  y += 18;
  doc.font("Helvetica").fontSize(9).fillColor("#64748b");
  doc.text(`Registrado em ${record.createdAtLabel}`, margin, y);
  if (record.appointmentDateLabel) {
    y += 12;
    doc.text(`Atendimento: ${record.appointmentDateLabel}`, margin, y);
  }

  y += 20;
  doc.fillColor("#0f172a").fontSize(10).font("Helvetica");
  doc.text(record.content, margin, y, { width: contentWidth, align: "justify" });

  const footerY = doc.page.height - margin;
  doc.fontSize(8).fillColor("#94a3b8");
  doc.text(
    `Documento gerado em ${new Date().toLocaleString("pt-BR")}. Uso exclusivo assistencial.`,
    margin,
    footerY,
    { width: contentWidth, align: "center" },
  );
}

/** PDF customizado de PEP com cabeçalho da clínica e dados do médico. */
export async function buildPepPdfBuffer(contexts: PepExportContext[]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  contexts.forEach((ctx, index) => {
    if (index > 0) doc.addPage();
    drawPepPage(doc, ctx);
  });
  return pdfBufferFromDoc(doc);
}
