import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { createMfaSetup, verifyTotp } from "@/lib/mfa";

export async function GET() {
  const prisma = await getPrisma();
  try {
    const session = await requireUser();
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { mfaEnabled: true },
    });
    return NextResponse.json({ mfaEnabled: user?.mfaEnabled ?? false });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const prisma = await getPrisma();
  try {
    await requireInternoModule("seguranca");
    const session = await requireUser(["INTERNO"]);
    const body = (await request.json()) as {
      action?: "setup" | "enable" | "disable";
      secret?: string;
      code?: string;
    };

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (body.action === "setup") {
      const setup = createMfaSetup(user.email);
      return NextResponse.json(setup);
    }

    if (body.action === "enable") {
      if (!body.secret || !body.code) {
        return NextResponse.json({ error: "Informe secret e código" }, { status: 400 });
      }
      if (!verifyTotp(body.secret, body.code)) {
        return NextResponse.json({ error: "Código inválido" }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { mfaSecret: body.secret, mfaEnabled: true },
      });
      return NextResponse.json({ message: "MFA ativado com sucesso", mfaEnabled: true });
    }

    if (body.action === "disable") {
      if (!user.mfaSecret || !body.code || !verifyTotp(user.mfaSecret, body.code)) {
        return NextResponse.json({ error: "Código inválido" }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { mfaSecret: null, mfaEnabled: false },
      });
      return NextResponse.json({ message: "MFA desativado", mfaEnabled: false });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
