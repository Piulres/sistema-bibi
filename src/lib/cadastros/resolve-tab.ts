import type { CadastrosTabKey } from "@/components/cadastros/types";

/**
 * Resolve a aba ativa da URL contra as abas disponíveis do nicho.
 * Evita renderizar chave inválida (ex.: pets fora de VET) e mantém fallback em patients.
 */
export function resolveCadastrosTab(
  tabFromUrl: string | null | undefined,
  availableKeys: readonly string[],
): CadastrosTabKey {
  if (tabFromUrl && availableKeys.includes(tabFromUrl)) {
    return tabFromUrl as CadastrosTabKey;
  }
  return "patients";
}
