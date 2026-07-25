import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  createClinicExpense,
  listClinicExpenses,
} from "@/lib/clinic-finance/service";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("gestao");
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year") || undefined);
    const month = Number(searchParams.get("month") || undefined);
    const expenses = await listClinicExpenses(
      user.tenantId,
      Number.isFinite(year) ? year : undefined,
      Number.isFinite(month) ? month : undefined,
    );
    return NextResponse.json({ expenses });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("gestao");
    const body = (await request.json()) as Record<string, unknown>;
    const result = await createClinicExpense(user.tenantId, {
      category: String(body.category ?? ""),
      description: String(body.description ?? ""),
      amount: Number(body.amount ?? 0),
      expenseDate: body.expenseDate ? String(body.expenseDate) : undefined,
      createdById: user.id,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
