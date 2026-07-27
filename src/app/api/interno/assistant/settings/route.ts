import { NextResponse } from "next/server";
import { requireInternoModuleWrite, authErrorResponse } from "@/lib/api-auth";
import { isGatewayConfigured } from "@/lib/assistant/config";
import { resolveAssistantMode, assistantModeLabel } from "@/lib/assistant/mode";
import { scenarioCount } from "@/lib/assistant/scenarios";
import { ASSISTANT_TOOL_INVENTORY } from "@/lib/assistant/inventory";
import { buildRuleEngineStats, buildRulesPreview } from "@/lib/assistant/rules/engine";
import { parseTenantRuleOverrides } from "@/lib/assistant/rules/tenant-overrides";
import type { TenantRuleOverride } from "@/lib/assistant/rules/types";
import {
  getTenantSettings,
  updateTenantSettings,
} from "@/lib/tenant/settings";

function settingsPayload(
  settings: Awaited<ReturnType<typeof getTenantSettings>>,
  niche: Parameters<typeof buildRuleEngineStats>[0],
) {
  const overrides = settings.assistant.ruleOverrides ?? [];
  const mode = resolveAssistantMode(settings);
  return {
    settings: settings.assistant,
    mode,
    modeLabel: assistantModeLabel(mode),
    gatewayConfigured: isGatewayConfigured(),
    inventory: {
      tools: ASSISTANT_TOOL_INVENTORY.length,
      scenarios: scenarioCount(),
    },
    rules: buildRuleEngineStats(niche, overrides),
    ruleOverrides: overrides,
    previewRules: buildRulesPreview({ niche, tenantOverrides: overrides }),
  };
}

/** Configurações do assistente do realm (ADMIN · módulo assistente). */
export async function GET() {
  try {
    const user = await requireInternoModuleWrite("assistente");
    const settings = await getTenantSettings(user.tenantId);
    return NextResponse.json(settingsPayload(settings, user.niche));
  } catch (error) {
    return authErrorResponse(error);
  }
}

type PatchBody = {
  aiEnabled?: boolean;
  rulesEnabled?: boolean;
  ruleOverrides?: TenantRuleOverride[];
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

    const patch: {
      aiEnabled?: boolean;
      rulesEnabled?: boolean;
      ruleOverrides?: TenantRuleOverride[];
    } = {};
    if (typeof body.aiEnabled === "boolean") patch.aiEnabled = body.aiEnabled;
    if (typeof body.rulesEnabled === "boolean") patch.rulesEnabled = body.rulesEnabled;
    if ("ruleOverrides" in body) {
      if (body.ruleOverrides !== undefined && !Array.isArray(body.ruleOverrides)) {
        return NextResponse.json(
          { error: "ruleOverrides deve ser uma lista." },
          { status: 400 },
        );
      }
      patch.ruleOverrides = parseTenantRuleOverrides(body.ruleOverrides ?? []);
    }

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
    return NextResponse.json(settingsPayload(updated, user.niche));
  } catch (error) {
    return authErrorResponse(error);
  }
}
