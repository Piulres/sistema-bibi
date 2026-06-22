import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  createProcedure,
  isProcedureCategory,
  listProcedures,
} from "@/lib/procedure-service";

export async function GET() {
  try {
    const user = await requireInternoModule("cadastros");
    const procedures = await listProcedures(user.tenantId);
    return NextResponse.json({ procedures });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("cadastros");
    const body = (await request.json()) as {
      code?: string;
      name?: string;
      category?: string;
      basePrice?: number;
    };

    if (!body.code?.trim() || !body.name?.trim() || !body.category) {
      return NextResponse.json({ error: "Informe código, nome e categoria" }, { status: 400 });
    }
    if (!isProcedureCategory(body.category)) {
      return NextResponse.json({ error: "Categoria inválida" }, { status: 400 });
    }
    if (typeof body.basePrice !== "number" || body.basePrice <= 0) {
      return NextResponse.json({ error: "Preço base inválido" }, { status: 400 });
    }

    const result = await createProcedure({
      tenantId: user.tenantId,
      code: body.code,
      name: body.name,
      category: body.category,
      basePrice: body.basePrice,
      createdBy: user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
