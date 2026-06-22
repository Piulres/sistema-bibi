import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  buildPrestadorAppointmentsCsv,
  buildPrestadorProceduresCsv,
} from "@/lib/reports/prestador-report";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "procedures";
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;

    const csv =
      type === "appointments"
        ? await buildPrestadorAppointmentsCsv(user.tenantId, user.id, from, to)
        : await buildPrestadorProceduresCsv(user.tenantId, user.id, from, to);

    const filename =
      type === "appointments" ? "prestador-atendimentos.csv" : "prestador-procedimentos.csv";

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
