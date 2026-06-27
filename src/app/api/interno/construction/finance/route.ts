import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  getCompanyFinancialReport,
  listIndirectExpenses,
  upsertIndirectExpense,
} from "@/lib/project/financial-report-service";

export async function GET() {
  try {
    const user = await requireInternoModule("projetos");
    const [report, indirectExpenses] = await Promise.all([
      getCompanyFinancialReport(user.tenantId),
      listIndirectExpenses(user.tenantId),
    ]);
    return NextResponse.json({ report, indirectExpenses });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("projetos");
    const body = (await request.json()) as Record<string, unknown>;
    const result = await upsertIndirectExpense(user.tenantId, {
      id: body.id ? String(body.id) : undefined,
      category: String(body.category ?? "OUTRO"),
      description: String(body.description ?? ""),
      amount: Number(body.amount ?? 0),
      isPlanned: Boolean(body.isPlanned),
      expenseDate: String(body.expenseDate ?? new Date().toISOString()),
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
