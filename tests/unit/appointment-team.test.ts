import { describe, expect, it } from "vitest";
import {
  isTeamRole,
  matchesTeamRole,
  parseTeamRoleRequirements,
  serializeTeamRoleRequirements,
  teamRoleLabel,
  teamRolesForNiche,
} from "@/lib/clinical/team-roles";
import { validateTeamRequirements } from "@/lib/appointment-team-service";

describe("team-roles", () => {
  it("valida papéis conhecidos", () => {
    expect(isTeamRole("ANESTESISTA")).toBe(true);
    expect(isTeamRole("INVALIDO")).toBe(false);
  });

  it("serializa e parseia requisitos de equipe", () => {
    const json = serializeTeamRoleRequirements([
      { role: "ANESTESISTA", required: true, minCount: 1 },
      { role: "TECNICO_ENFERMAGEM", required: false },
    ]);
    const parsed = parseTeamRoleRequirements(json);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({ role: "ANESTESISTA", required: true });
  });

  it("retorna labels por nicho", () => {
    expect(teamRoleLabel("ANESTESISTA", "MEDICAL")).toBe("Anestesista");
    expect(teamRoleLabel("ANESTESISTA", "VET")).toContain("veterinário");
    expect(teamRolesForNiche("LEGAL")).toContain("PARALEGAL");
  });

  it("identifica profissionais por especialidade", () => {
    expect(
      matchesTeamRole({ specialty: "Anestesiologia", councilType: "CRM", role: "PRESTADOR" }, "ANESTESISTA"),
    ).toBe(true);
    expect(
      matchesTeamRole({ specialty: "Técnica de enfermagem", councilType: null, role: "INTERNO" }, "TECNICO_ENFERMAGEM"),
    ).toBe(true);
  });
});

describe("validateTeamRequirements", () => {
  it("detecta anestesista obrigatório ausente", () => {
    const requirements = parseTeamRoleRequirements(
      serializeTeamRoleRequirements([{ role: "ANESTESISTA", required: true }]),
    );
    const error = validateTeamRequirements(requirements, []);
    expect(error).toContain("Anestesista");
  });

  it("passa quando equipe completa", () => {
    const requirements = parseTeamRoleRequirements(
      serializeTeamRoleRequirements([{ role: "ANESTESISTA", required: true }]),
    );
    const error = validateTeamRequirements(requirements, [{ role: "ANESTESISTA" }]);
    expect(error).toBeNull();
  });
});
