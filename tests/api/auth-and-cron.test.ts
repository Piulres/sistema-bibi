import { describe, expect, it, vi } from "vitest";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as cronRemindersPost } from "@/app/api/cron/reminders/route";
import { jsonRequest } from "../helpers/request";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe("API — auth/login", () => {
  it("rejeita corpo inválido", async () => {
    const res = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: "not-json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejeita credenciais incorretas", async () => {
    const res = await loginPost(
      jsonRequest("http://localhost/api/auth/login", {
        method: "POST",
        body: { email: "x@y.com", password: "wrong", portal: "interno" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("rejeita portal errado para o role", async () => {
    const res = await loginPost(
      jsonRequest("http://localhost/api/auth/login", {
        method: "POST",
        body: {
          email: "dra.helena@bibi.health",
          password: "bibi123",
          portal: "interno",
        },
      }),
    );
    expect(res.status).toBe(403);
  });

  it("autentica prestador com credenciais do seed", async () => {
    const res = await loginPost(
      jsonRequest("http://localhost/api/auth/login", {
        method: "POST",
        body: {
          email: "dra.helena@bibi.health",
          password: "bibi123",
          portal: "prestador",
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirectTo).toBe("/prestador/dashboard");
    expect(body.user.role).toBe("PRESTADOR");
  });
});

describe("API — cron/reminders (CRON_SECRET)", () => {
  it("rejeita sem secret", async () => {
    const res = await cronRemindersPost(
      new Request("http://localhost/api/cron/reminders", { method: "POST" }),
    );
    expect(res.status).toBe(401);
  });

  it("rejeita secret incorreto", async () => {
    const res = await cronRemindersPost(
      new Request("http://localhost/api/cron/reminders", {
        method: "POST",
        headers: { "x-cron-secret": "wrong" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("aceita secret válido", async () => {
    const res = await cronRemindersPost(
      new Request("http://localhost/api/cron/reminders", {
        method: "POST",
        headers: { "x-cron-secret": process.env.CRON_SECRET! },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.summaries)).toBe(true);
  });
});
