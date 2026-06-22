import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getPrestadorExtrato } from "@/lib/prestador-extrato";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const url = new URL(request.url);
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;
    const extrato = await getPrestadorExtrato(user.tenantId, user.id, from, to);
    return NextResponse.json({ extrato });
  } catch (error) {
    return authErrorResponse(error);
  }
}
