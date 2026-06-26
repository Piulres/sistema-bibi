/** Verifica se o pathname atual corresponde ao padrão de rota do passo. */
export function matchesRoute(pathname: string, route?: string): boolean {
  if (!route) return true;
  if (route.endsWith("*")) {
    return pathname.startsWith(route.slice(0, -1));
  }
  return pathname === route;
}

/** Filtra passos visíveis para a rota atual. */
export function filterStepsForRoute<T extends { route?: string }>(
  steps: T[],
  pathname: string,
): T[] {
  return steps.filter((step) => matchesRoute(pathname, step.route));
}
