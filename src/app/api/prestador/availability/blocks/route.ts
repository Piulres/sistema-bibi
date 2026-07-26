import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  createBlockedTime,
  listBlockedTimes,
} from "@/lib/availability/provider-availability-service";

/** Lista bloqueios pontuais do prestador. */
export async function GET(request: Request) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const url = new URL(request.url);
    const fromRaw = url.searchParams.get("from");
    const toRaw = url.searchParams.get("to");
    const blocks = await listBlockedTimes({
      tenantId: user.tenantId,
      providerId: user.id,
      from: fromRaw ? new Date(fromRaw) : undefined,
      to: toRaw ? new Date(toRaw) : undefined,
    });
    return NextResponse.json({ blocks });
  } catch (error) {
    return authErrorResponse(error);
  }
}

/** Cria bloqueio (almoço, folga, férias). */
export async function POST(request: Request) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const body = (await request.json()) as {
      startsAt?: string;
      endsAt?: string;
      reason?: string;
    };
    if (!body.startsAt || !body.endsAt) {
      return NextResponse.json({ error: "Informe startsAt e endsAt" }, { status: 400 });
    }
    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return NextResponse.json({ error: "Datas inválidas" }, { status: 400 });
    }
    const result = await createBlockedTime({
      tenantId: user.tenantId,
      providerId: user.id,
      startsAt,
      endsAt,
      reason: body.reason,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ block: result });
  } catch (error) {
    return authErrorResponse(error);
  }
}
