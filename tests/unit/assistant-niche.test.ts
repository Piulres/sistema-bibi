import { describe, expect, it } from "vitest";
import { extractCreateAppointmentArgs, extractPetName, extractTutorName } from "@/lib/assistant/provider/mock-extractors";
import { matchProcedureNameInText, clearProcedureMatchCache } from "@/lib/assistant/procedure-match";
import { searchNicheKnowledge } from "@/lib/assistant/niche-knowledge";
import { NICHE_MASTER_LABELS } from "@/constants/niches";
import { getTestPrisma } from "../helpers/db";

describe("assistant multi-nicho", () => {
  it("extrai pet e tutor no texto VET", () => {
    const raw = "agendar atendimento para o pet Thor do tutor João amanhã às 10h";
    expect(extractPetName(raw)).toBe("Thor");
    expect(extractTutorName(raw)).toBe("João");
    const args = extractCreateAppointmentArgs(raw);
    expect(args.petName).toBe("Thor");
    expect(args.patientName).toBe("João");
  });

  it("RAG retorna snippet veterinário", () => {
    const chunks = searchNicheKnowledge("VET", "como agendar pet tutor", NICHE_MASTER_LABELS.VET);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]?.content).toMatch(/pet|tutor/i);
  });

  it("resolve procedimento do catálogo do tenant petcare", async () => {
    const prisma = getTestPrisma();
    const tenant = await prisma.tenant.findFirst({ where: { slug: "petcare" } });
    expect(tenant).toBeTruthy();
    clearProcedureMatchCache(tenant!.id);
    const procedures = await prisma.procedure.findMany({
      where: { tenantId: tenant!.id },
      take: 1,
    });
    expect(procedures.length).toBeGreaterThan(0);
    const name = procedures[0]!.name;
    const matched = await matchProcedureNameInText(tenant!.id, `quero marcar ${name} amanhã`);
    expect(matched).toBe(name);
  });
});
