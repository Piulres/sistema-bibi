export const COLOR_SCHEMES = ["light", "dark", "system"] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

export function normalizeColorScheme(value: string | undefined | null): ColorScheme {
  if (value === "dark" || value === "system") return value;
  return "light";
}
