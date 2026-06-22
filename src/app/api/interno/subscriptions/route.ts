import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  createSubscription,
  listSubscriptions,
  listTenantPatientsForSubscription,
} from "@/lib/subscription-service";
import { isBillingCycle, isSubscriptionStatus } from "@/lib/subscription";

export async function GET() {
  try {
    const user = await requireInternoModule("subscriptions");
    const subscriptions = await listSubscriptions(user.tenantId);
    const patients = await listTenantPatientsForSubscription(user.tenantId);
    return NextResponse.json({ subscriptions, patients });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("subscriptions");
    const body = (await request.json()) as {
      patientId?: string;
      companyId?: string | null;
      status?: string;
      billingCycle?: string;
      startDate?: string;
      endDate?: string | null;
      amount?: number;
      description?: string | null;
    };

    if (!body.patientId || !body.billingCycle || !body.startDate || body.amount == null) {
      return NextResponse.json(
        { error: "Informe paciente, ciclo, data de início e valor" },
        { status: 400 },
      );
    }

    const status = body.status ?? "ATIVA";
    if (!isSubscriptionStatus(status) || !isBillingCycle(body.billingCycle)) {
      return NextResponse.json({ error: "Status ou ciclo inválido" }, { status: 400 });
    }

    if (body.amount <= 0) {
      return NextResponse.json({ error: "Valor deve ser maior que zero" }, { status: 400 });
    }

    const subscription = await createSubscription({
      tenantId: user.tenantId,
      patientId: body.patientId,
      companyId: body.companyId,
      status,
      billingCycle: body.billingCycle,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      amount: body.amount,
      description: body.description,
      createdBy: user.id,
    });

    if (!subscription) {
      return NextResponse.json({ error: "Beneficiário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    return authErrorResponse(error);
  }
}
