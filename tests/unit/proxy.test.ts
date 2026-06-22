import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";
import { nextRequest } from "../helpers/request";

describe("proxy (checagem otimista de sessão)", () => {
  it("redireciona /interno sem cookie para login", () => {
    const res = proxy(nextRequest("/interno/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/interno/login");
  });

  it("permite /interno/login sem cookie", () => {
    const res = proxy(nextRequest("/interno/login"));
    expect(res.status).toBe(200);
  });

  it("permite /prestador com cookie presente (sem validar assinatura)", () => {
    const res = proxy(
      nextRequest("/prestador", { cookies: { bibi_session: "fake-token" } }),
    );
    expect(res.status).toBe(200);
  });

  it("redireciona todos os portais protegidos", () => {
    for (const path of ["/pj", "/beneficiario", "/prestador"]) {
      const res = proxy(nextRequest(path));
      expect(res.status).toBe(307);
    }
  });
});
