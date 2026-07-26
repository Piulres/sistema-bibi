import "server-only";
import { getPrisma } from "@/lib/db";

/** Erro de validação da guia — fatura existe mas não gera guia válida. */
export class TissBuildError extends Error {
  code: "NO_ITEMS" | "NO_PATIENT_DOCUMENT";

  constructor(message: string, code: TissBuildError["code"]) {
    super(message);
    this.name = "TissBuildError";
    this.code = code;
  }
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Gera XML simplificado de guia TISS/ANS para fatura Pay Per Use (POC Tier 4).
 *
 * Validação estrutural (auditoria §8): guia sem procedimentos ou sem documento
 * do beneficiário lança `TissBuildError` em vez de servir XML semanticamente
 * inválido para a operadora. Validação XSD oficial ANS fica fora do POC.
 */
export async function buildTissGuideXml(tenantId: string, invoiceId: string): Promise<string | null> {
  const prisma = await getPrisma();
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    include: {
      patient: true,
      company: true,
      items: {
        include: {
          usage: {
            include: {
              procedure: true,
              appointment: { include: { provider: { select: { name: true } } } },
            },
          },
        },
      },
      tenant: { select: { name: true, cnpj: true } },
    },
  });

  if (!invoice) return null;

  if (invoice.items.length === 0) {
    throw new TissBuildError(
      "Fatura sem procedimentos — não é possível gerar guia TISS.",
      "NO_ITEMS",
    );
  }

  if (!invoice.patient.cpf.replace(/\D/g, "")) {
    throw new TissBuildError(
      "Beneficiário sem documento — número da carteira ficaria vazio na guia.",
      "NO_PATIENT_DOCUMENT",
    );
  }

  const guiaDate = invoice.createdAt.toISOString().slice(0, 10);
  const itemsXml = invoice.items
    .map((item, index) => {
      const proc = item.usage?.procedure;
      const tissCode = proc?.tissCode ?? proc?.code ?? "00000000";
      const performedAt =
        item.usage?.performedAt.toISOString().slice(0, 10) ?? guiaDate;
      const providerName =
        item.usage?.appointment.provider.name ?? invoice.tenant.name;
      return `    <procedimento sequencial="${index + 1}">
      <codigo_tuss>${escapeXml(tissCode)}</codigo_tuss>
      <descricao>${escapeXml(item.description)}</descricao>
      <valor>${item.amount.toFixed(2)}</valor>
      <data_realizacao>${performedAt}</data_realizacao>
      <prestador>${escapeXml(providerName)}</prestador>
    </procedimento>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
  <ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
      <ans:dataRegistroTransacao>${guiaDate}</ans:dataRegistroTransacao>
    </ans:identificacaoTransacao>
    <ans:origem>
      <ans:identificacaoPrestador>
        <ans:codigoPrestadorNaOperadora>${escapeXml(invoice.tenant.cnpj)}</ans:codigoPrestadorNaOperadora>
        <ans:nomeContratado>${escapeXml(invoice.tenant.name)}</ans:nomeContratado>
      </ans:identificacaoPrestador>
    </ans:origem>
  </ans:cabecalho>
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:guiaSP-SADT>
        <ans:numeroGuiaPrestador>${escapeXml(invoice.id)}</ans:numeroGuiaPrestador>
        <ans:dadosBeneficiario>
          <ans:numeroCarteira>${escapeXml(invoice.patient.cpf.replace(/\D/g, ""))}</ans:numeroCarteira>
          <ans:nomeBeneficiario>${escapeXml(invoice.patient.name)}</ans:nomeBeneficiario>
        </ans:dadosBeneficiario>
        <ans:dadosSolicitante>
          <ans:contratadoSolicitante>${escapeXml(invoice.company?.name ?? "Particular")}</ans:contratadoSolicitante>
        </ans:dadosSolicitante>
        <ans:procedimentosExecutados>
${itemsXml}
        </ans:procedimentosExecutados>
        <ans:valorTotal>
          <ans:valorTotalGeral>${invoice.total.toFixed(2)}</ans:valorTotalGeral>
        </ans:valorTotal>
      </ans:guiaSP-SADT>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>
</ans:mensagemTISS>`;
}
