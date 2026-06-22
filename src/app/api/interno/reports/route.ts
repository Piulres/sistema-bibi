import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { buildBillingReportCsv, buildCrmReportCsv } from "@/lib/reports/billing-report";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("relatorios");
    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "billing";

    const csv =
      type === "crm"
        ? await buildCrmReportCsv(user.tenantId)
        : await buildBillingReportCsv(user.tenantId);

    const filename = type === "crm" ? "crm-pipeline.csv" : "faturamento.csv";

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
