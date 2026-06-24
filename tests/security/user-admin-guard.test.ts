import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as listUsersGet } from "@/app/api/interno/users/route";
import { POST as createUserPost } from "@/app/api/interno/users/route";
import {
  clearSessionMock,
  sessionMockState,
  setSessionForEmail,
} from "../helpers/session-mock";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "bibi_session" && sessionMockState.token
        ? { value: sessionMockState.token }
        : undefined,
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe("Segurança — gestão de usuários (somente ADMIN)", () => {
  afterEach(() => {
    clearSessionMock();
  });

  describe("RECEPCAO", () => {
    beforeEach(async () => {
      await setSessionForEmail("recepcao@bibi.health");
    });

    it("RECEPCAO pode listar usuários mas não criar ADMIN", async () => {
      const list = await listUsersGet();
      expect(list.status).toBe(200);

      const res = await createUserPost(
        new Request("http://localhost/api/interno/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "novo.admin@test.local",
            password: "bibi123",
            name: "Novo Admin",
            role: "INTERNO",
            internoProfile: "ADMIN",
          }),
        }),
      );
      expect(res.status).toBe(403);
    });
  });

  describe("ADMIN", () => {
    beforeEach(async () => {
      await setSessionForEmail("faturamento@bibi.health");
    });

    it("lista usuários com sucesso", async () => {
      const res = await listUsersGet();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.users)).toBe(true);
    });
  });
});
