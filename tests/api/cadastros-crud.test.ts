import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as patientsGet, POST as patientsPost } from "@/app/api/interno/patients/route";
import { PATCH as patientPatch } from "@/app/api/interno/patients/[id]/route";
import { GET as companiesGet, POST as companiesPost } from "@/app/api/interno/companies/route";
import { PATCH as companyPatch } from "@/app/api/interno/companies/[id]/route";
import { GET as proceduresGet, POST as proceduresPost } from "@/app/api/interno/procedures/route";
import { PUT as procedurePut, DELETE as procedureDelete } from "@/app/api/interno/procedures/[id]/route";
import { GET as usersGet, POST as usersPost } from "@/app/api/interno/users/route";
import { PATCH as userPatch } from "@/app/api/interno/users/[id]/route";
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

const unique = () => Date.now().toString().slice(-8);

function generateValidCpf(): string {
  const seed = Date.now() % 1000000000;
  const nine = String(seed).padStart(9, "0");
  const nums = nine.split("").map(Number);
  const sum1 = nums.reduce((acc, d, i) => acc + d * (10 - i), 0);
  let d1 = (sum1 * 10) % 11;
  if (d1 === 10) d1 = 0;
  const sum2 = [...nums, d1].reduce((acc, d, i) => acc + d * (11 - i), 0);
  let d2 = (sum2 * 10) % 11;
  if (d2 === 10) d2 = 0;
  return nine + String(d1) + String(d2);
}

function generateValidCnpj(): string {
  const base = String(Date.now() % 100000000000)
    .padStart(12, "0")
    .slice(-12)
    .split("")
    .map(Number);
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const mod = (nums: number[], weights: number[]) => {
    const sum = nums.reduce((acc, d, i) => acc + d * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = mod(base, w1);
  const d2 = mod([...base, d1], w2);
  return [...base, d1, d2].join("");
}

describe("API — CRUD Cadastros (interno)", () => {
  afterEach(() => {
    clearSessionMock();
  });

  describe("com ADMIN (cadastros)", () => {
    beforeEach(async () => {
      await setSessionForEmail("faturamento@bibi.health");
    });

    it("lista todas as entidades de cadastro", async () => {
      const [p, c, pr, u] = await Promise.all([
        patientsGet(),
        companiesGet(),
        proceduresGet(),
        usersGet(),
      ]);
      expect(p.status).toBe(200);
      expect(c.status).toBe(200);
      expect(pr.status).toBe(200);
      expect(u.status).toBe(200);
    });

    it("CRUD beneficiário completo", async () => {
      const suffix = unique();
      const createRes = await patientsPost(
        new Request("http://localhost/api/interno/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Teste Benef ${suffix}`,
            cpf: generateValidCpf(),
            birthDate: "1990-05-15",
            phone: "11999990000",
            email: `benef.${suffix}@test.com`,
            bondType: "TITULAR",
          }),
        }),
      );
      expect(createRes.status).toBe(200);
      const created = await createRes.json();
      const id = created.patient.id as string;

      const patchRes = await patientPatch(
        new Request(`http://localhost/api/interno/patients/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: "11988887777", employeeId: "MAT-001" }),
        }),
        { params: Promise.resolve({ id }) },
      );
      expect(patchRes.status).toBe(200);
      const patched = await patchRes.json();
      expect(patched.patient.employeeId).toBe("MAT-001");
    });

    it("CRUD empresa com campos B2B", async () => {
      const suffix = unique();
      const createRes = await companiesPost(
        new Request("http://localhost/api/interno/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Empresa Teste ${suffix} LTDA`,
            cnpj: generateValidCnpj(),
            tradeName: `Fantasia ${suffix}`,
            contactName: "RH Demo",
            contactEmail: `rh.${suffix}@empresa.com`,
            addressCity: "São Paulo",
            addressState: "SP",
          }),
        }),
      );
      expect(createRes.status).toBe(200);
      const created = await createRes.json();
      const id = created.company.id as string;

      const patchRes = await companyPatch(
        new Request(`http://localhost/api/interno/companies/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "NEGOCIACAO" }),
        }),
        { params: Promise.resolve({ id }) },
      );
      expect(patchRes.status).toBe(200);
      const patched = await patchRes.json();
      expect(patched.company.status).toBe("NEGOCIACAO");
    });

    it("rejeita CNPJ inválido", async () => {
      const res = await companiesPost(
        new Request("http://localhost/api/interno/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "X", cnpj: "00000000000000" }),
        }),
      );
      expect(res.status).toBe(400);
    });

    it("CRUD procedimento", async () => {
      const suffix = unique();
      const createRes = await proceduresPost(
        new Request("http://localhost/api/interno/procedures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: `T${suffix}`,
            name: "Procedimento Teste",
            category: "CONSULTA",
            basePrice: 199.9,
          }),
        }),
      );
      expect(createRes.status).toBe(200);
      const { procedure } = await createRes.json();
      const id = procedure.id as string;

      const putRes = await procedurePut(
        new Request(`http://localhost/api/interno/procedures/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ basePrice: 220 }),
        }),
        { params: Promise.resolve({ id }) },
      );
      expect(putRes.status).toBe(200);

      const delRes = await procedureDelete(
        new Request(`http://localhost/api/interno/procedures/${id}`, { method: "DELETE" }),
        { params: Promise.resolve({ id }) },
      );
      expect(delRes.status).toBe(200);
    });

    it("CRUD usuário prestador com conselho", async () => {
      const suffix = unique();
      const createRes = await usersPost(
        new Request("http://localhost/api/interno/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Dr. Teste ${suffix}`,
            email: `dr.${suffix}@bibi.health`,
            password: "bibi123",
            role: "PRESTADOR",
            councilType: "CRM",
            councilNumber: "123456",
            councilUf: "SP",
            specialty: "Clínica Geral",
          }),
        }),
      );
      expect(createRes.status).toBe(200);
      const { user } = await createRes.json();
      const id = user.id as string;

      const patchRes = await userPatch(
        new Request(`http://localhost/api/interno/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ specialty: "Cardiologia" }),
        }),
        { params: Promise.resolve({ id }) },
      );
      expect(patchRes.status).toBe(200);
      const patched = await patchRes.json();
      expect(patched.user.specialty).toBe("Cardiologia");
    });
  });

  describe("RBAC cadastros", () => {
    it("FATURAMENTO não acessa cadastros", async () => {
      await setSessionForEmail("financeiro@bibi.health");
      const res = await patientsGet();
      expect(res.status).toBe(403);
    });
  });
});
