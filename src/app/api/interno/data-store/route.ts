import { NextResponse } from "next/server";
import { getPrisma, invalidatePrismaCache } from "@/lib/db";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  getDataStoreStatus,
  parseDataStoreMode,
  setDataStoreMode,
} from "@/lib/data-store-mode";
import { persistOperationDatabaseNow } from "@/lib/sqlite-blob-persistence";
import { isInternoAdmin } from "@/lib/interno-permissions";

/** Status do modo de dados ativo (demo / operação). */
export async function GET() {
  try {
    const user = await requireInternoModule("seguranca");
    if (!isInternoAdmin(user.role, user.internoProfile)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const status = await getDataStoreStatus();
    return NextResponse.json({
      ...status,
      canSwitch: status.dualStoreEnabled,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

/**
 * Alterna entre demo e operação (site-wide).
 * Body: { "mode": "demo" | "operation", "confirm": "OPERAR" | "DEMO" }
 */
export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("seguranca");
    if (!isInternoAdmin(user.role, user.internoProfile)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const status = await getDataStoreStatus();
    if (!status.dualStoreEnabled) {
      return NextResponse.json(
        { error: "Seletor demo/operação não habilitado neste ambiente" },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      mode?: string;
      confirm?: string;
    };

    const mode = parseDataStoreMode(body.mode);
    if (!mode) {
      return NextResponse.json(
        { error: 'Informe mode: "demo" ou "operation"' },
        { status: 400 },
      );
    }

    const expectedConfirm = mode === "operation" ? "OPERAR" : "DEMO";
    if (body.confirm?.trim().toUpperCase() !== expectedConfirm) {
      return NextResponse.json(
        { error: `Digite "${expectedConfirm}" para confirmar` },
        { status: 400 },
      );
    }

    if (status.mode === mode) {
      return NextResponse.json({
        message: `O site já está em modo ${mode === "demo" ? "demo" : "operação"}.`,
        mode,
      });
    }

    if (status.mode === "operation") {
      await persistOperationDatabaseNow();
    }

    await invalidatePrismaCache({ persistOperation: false });
    await setDataStoreMode(mode);
    await invalidatePrismaCache();

    const prisma = await getPrisma();
    const [users, patients, companies] = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.company.count(),
    ]);

    return NextResponse.json({
      message:
        mode === "operation"
          ? "Modo operação ativado — dados reais persistidos em Netlify Blobs."
          : "Modo demo ativado — massa de teste restaurada do build.",
      mode,
      stats: { users, patients, companies },
      logoutRecommended: true,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
