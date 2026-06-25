import "server-only";
import { VOA_PLUGIN_SCRIPT_DEFAULT } from "@/lib/voa/constants";

export type VoaConfig = {
  enabled: boolean;
  hasToken: boolean;
  pluginScriptUrl: string;
  integrationToken: string | null;
};

export function getVoaConfig(): VoaConfig {
  const enabled = process.env.VOA_ENABLED === "true";
  const token = process.env.VOA_INTEGRATION_TOKEN?.trim() || null;
  const pluginScriptUrl =
    process.env.VOA_PLUGIN_SCRIPT_URL?.trim() || VOA_PLUGIN_SCRIPT_DEFAULT;

  return {
    enabled,
    hasToken: Boolean(token),
    pluginScriptUrl,
    integrationToken: token,
  };
}

export function assertVoaOperational(): { ok: true; token: string } | { ok: false; error: string } {
  const config = getVoaConfig();
  if (!config.enabled) {
    return { ok: false, error: "Integração Voa desabilitada (VOA_ENABLED)" };
  }
  if (!config.integrationToken) {
    return { ok: false, error: "Token Voa não configurado (VOA_INTEGRATION_TOKEN)" };
  }
  return { ok: true, token: config.integrationToken };
}
