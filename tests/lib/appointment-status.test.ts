import { describe, expect, it } from "vitest";
import {
  canRegisterProcedureForStatus,
  canTransitionAppointmentStatus,
  isAppointmentStatus,
  isTerminalAppointmentStatus,
} from "@/lib/appointment-status";

describe("appointment-status — máquina de estados (FLUXOS §10.1)", () => {
  it("reconhece status válidos e rejeita inválidos", () => {
    expect(isAppointmentStatus("AGENDADO")).toBe(true);
    expect(isAppointmentStatus("REALIZADO")).toBe(true);
    expect(isAppointmentStatus("PENDENTE")).toBe(false);
    expect(isAppointmentStatus("")).toBe(false);
  });

  it("classifica estados terminais", () => {
    expect(isTerminalAppointmentStatus("REALIZADO")).toBe(true);
    expect(isTerminalAppointmentStatus("FALTOU")).toBe(true);
    expect(isTerminalAppointmentStatus("CANCELADO")).toBe(true);
    expect(isTerminalAppointmentStatus("AGENDADO")).toBe(false);
    expect(isTerminalAppointmentStatus("CONFIRMADO")).toBe(false);
  });

  it("permite transições para frente a partir de AGENDADO", () => {
    for (const to of ["CONFIRMADO", "REALIZADO", "FALTOU", "CANCELADO"]) {
      expect(canTransitionAppointmentStatus("AGENDADO", to)).toBe(true);
    }
  });

  it("permite CONFIRMADO → REALIZADO/FALTOU/CANCELADO", () => {
    expect(canTransitionAppointmentStatus("CONFIRMADO", "REALIZADO")).toBe(true);
    expect(canTransitionAppointmentStatus("CONFIRMADO", "FALTOU")).toBe(true);
    expect(canTransitionAppointmentStatus("CONFIRMADO", "CANCELADO")).toBe(true);
  });

  it("bloqueia qualquer saída de estados terminais", () => {
    for (const from of ["REALIZADO", "FALTOU", "CANCELADO"]) {
      for (const to of ["AGENDADO", "CONFIRMADO", "REALIZADO", "FALTOU", "CANCELADO"]) {
        // No-op (mesmo estado) é permitido; qualquer outra saída é bloqueada.
        const expected = from === to;
        expect(canTransitionAppointmentStatus(from, to)).toBe(expected);
      }
    }
  });

  it("trata estados desconhecidos como inválidos", () => {
    expect(canTransitionAppointmentStatus("FOO", "AGENDADO")).toBe(false);
    expect(canTransitionAppointmentStatus("AGENDADO", "FOO")).toBe(false);
  });

  it("proíbe registrar procedimento em agendamento que não ocorreu", () => {
    expect(canRegisterProcedureForStatus("CANCELADO")).toBe(false);
    expect(canRegisterProcedureForStatus("FALTOU")).toBe(false);
    expect(canRegisterProcedureForStatus("AGENDADO")).toBe(true);
    expect(canRegisterProcedureForStatus("CONFIRMADO")).toBe(true);
    expect(canRegisterProcedureForStatus("REALIZADO")).toBe(true);
  });
});
