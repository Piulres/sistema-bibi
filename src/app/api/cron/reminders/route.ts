import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueDueReminders } from "@/lib/reminder-service";

/**
 * Job agendado de lembretes — protegido por CRON_SECRET.
 * Pode ser chamado por Netlify Scheduled Functions ou cron externo.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret") ?? request.headers.get("authorization");
  const expected = process.env.CRON_SECRET?.trim();

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  const summaries = [];

  for (const tenant of tenants) {
    const result = await enqueueDueReminders({
      tenantId: tenant.id,
      createdBy: "system-cron",
      autoDispatch: true,
    });
    summaries.push({ tenantId: tenant.id, ...result });
  }

  return NextResponse.json({ ok: true, summaries });
}
