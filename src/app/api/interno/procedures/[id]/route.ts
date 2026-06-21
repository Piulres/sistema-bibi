import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  deleteProcedure,
  isProcedureCategory,
  updateProcedure,
} from "@/lib/procedure-service";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await requireUser(["INTERNO"]);
    const { id } = await params;
    const body = (await request.json()) as {
      code?: string;
      name?: string;
      category?: string;
      basePrice?: number;
    };

    if (body.category && !isProcedureCategory(body.category)) {
      return NextResponse.json({ error: "Categoria inválida" }, { status: 400 });
    }

    const result = await updateProcedure({
      tenantId: user.tenantId,
      procedureId: id,
      ...body,
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Procedimento não encontrado" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser(["INTERNO"]);
    const { id } = await params;

    const result = await deleteProcedure({
      tenantId: user.tenantId,
      procedureId: id,
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Procedimento não encontrado" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
