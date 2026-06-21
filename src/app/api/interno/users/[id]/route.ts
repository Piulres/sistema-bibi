import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { updateUser } from "@/lib/user-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser(["INTERNO"]);
    const { id } = await params;
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
      role?: string;
      companyId?: string | null;
      patientId?: string | null;
    };

    const result = await updateUser({
      tenantId: user.tenantId,
      userId: id,
      ...body,
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
