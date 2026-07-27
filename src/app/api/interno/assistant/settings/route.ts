import { NextResponse } from "next/server";
import { requireInternoModuleWrite, authErrorResponse } from "@/lib/api-auth";
import { isGatewayConfigured } from "@/lib/assistant/config";
import { resolveAssistantMode, assistantModeLabel } from "@/lib/assistant/mode";
import { scenarioCount } from "@/lib/assistant/scenarios";
import { ASSISTANT_TOOL_INVENTORY } from "@/lib/assistant/inventory";
import {
  getTenantSettings,
  updateTenantSettings,
} from "@/lib/tenant/settings";

/** Configurações do assistente do realm (ADMIN · módulo assistente). */
export async function GET() {
  try {
    const user = await requireInternoModuleWrite("assistente");
    const settings = await getTenantSettings(user.tenantId);
    const mode = resolveAssistantMode(settings);

    return NextResponse.json({
      settings: settings.assistant,
      mode,
      modeLabel: assistantModeLabel(mode),
      gatewayConfigured: isGatewayConfigured(),
      inventory: {
        tools: ASSISTANT_TOOL_INVENTORY.length,
        scenarios: scenarioCount(),
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

type PatchBody = {
  aiEnabled?: boolean;
  rulesEnabled?: boolean;
};

export async function PATCH(request: Request) {
  try {
    const user = await requireInternoModuleWrite("assistente");
    let body: PatchBody;
    try {
      body = (await request.json()) as PatchBody;
    } catch {
      return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
    }

    const patch: PatchBody = {};
    if (typeof body.aiEnabled === "boolean") patch.aiEnabled = body.aiEnabled;
    if (typeof body.rulesEnabled === "boolean") patch.rulesEnabled = body.rulesEnabled;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 400 });
    }

    if (patch.aiEnabled === true && !isGatewayConfigured()) {
      return NextResponse.json(
        { error: "Gateway de IA não configurado neste ambiente." },
        { status: 422 },
      );
    }

    const updated = await updateTenantSettings(user.tenantId, { assistant: patch });
    const mode = resolveAssistantMode(updated);

    return NextResponse.json({
      settings: updated.assistant,
      mode,
      modeLabel: assistantModeLabel(mode),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
