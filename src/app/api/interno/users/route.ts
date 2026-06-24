import { NextResponse } from "next/server";
import { requireInternoAdmin, requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { createUser, listUsers } from "@/lib/user-service";

export async function GET() {
  try {
    const user = await requireInternoModule("cadastros");
    const users = await listUsers(user.tenantId);
    return NextResponse.json({ users });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoAdmin();
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
      role?: string;
      companyId?: string | null;
      patientId?: string | null;
      internoProfile?: string | null;
      phone?: string | null;
      councilType?: string | null;
      councilNumber?: string | null;
      councilUf?: string | null;
      specialty?: string | null;
    };

    if (!body.email?.trim() || !body.password?.trim() || !body.name?.trim() || !body.role) {
      return NextResponse.json({ error: "Informe e-mail, senha, nome e perfil" }, { status: 400 });
    }

    const result = await createUser({
      tenantId: user.tenantId,
      email: body.email,
      password: body.password,
      name: body.name,
      role: body.role,
      companyId: body.companyId,
      patientId: body.patientId,
      internoProfile: body.internoProfile,
      phone: body.phone,
      councilType: body.councilType,
      councilNumber: body.councilNumber,
      councilUf: body.councilUf,
      specialty: body.specialty,
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
