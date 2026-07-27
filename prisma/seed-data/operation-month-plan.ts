/**
 * Plano puro (sem Prisma) do mês operacional do consultório.
 * Datas relativas a "hoje" civil em America/Sao_Paulo — consistente com CI UTC.
 */

import {
  civilDateISO,
  endOfDayInAppTz,
  shiftCivilDate,
  startOfDayInAppTz,
} from "../../src/lib/timezone";

export const OPERATION_MONTH_MARKER = "[seed-operation-month]";

/** Janela: 29 dias atrás → hoje → 5 dias à frente. */
export const OPERATION_MONTH_PAST_DAYS = 29;
export const OPERATION_MONTH_FUTURE_DAYS = 5;

export type OperationMonthSource =
  | "WALK_IN"
  | "CORPORATE"
  | "SELF_SERVICE"
  | "PARTICULAR";

export type OperationMonthStatus =
  | "AGENDADO"
  | "CONFIRMADO"
  | "REALIZADO"
  | "FALTOU"
  | "CANCELADO";

export type OperationMonthSlot = {
  /** Índice estável no plano (idempotência / testes). */
  slotIndex: number;
  dayOffset: number;
  hour: number;
  minute: number;
  source: OperationMonthSource;
  status: OperationMonthStatus;
  modality: "PRESENCIAL" | "TELE";
  /** Particular (companyIndex 0) ou corporativo (índice da empresa no seed). */
  patientPool: "particular" | "corporate";
  companyIndexSalt: number;
  procedureCode: string;
  withPep: boolean;
  withUsage: boolean;
  billed: boolean;
  invoiceStatus: "ABERTA" | "FECHADA" | "PAGA" | null;
  dispenseStock: boolean;
  reasonLabel: string;
};

export type CedigMonthLaunch = {
  launchIndex: number;
  dayOffset: number;
  hour: number;
  patientSalt: number;
  procedureCode: "CEDIG-ENDO" | "CEDIG-COLO" | "CEDIG-RESP";
  priceTable: "PARTICULAR" | "CENTRALMED" | "BEM_SAUDE" | "DR_SAUDE";
  paymentMethod: "PIX" | "CARTAO" | "DINHEIRO" | "CONVENIO";
  amountReceived: number;
  biopsies?: number;
  polypectomies?: number;
};

export type CedigMonthExpense = {
  dayOffset: number;
  category: "LABORATORIO" | "PESSOAL" | "INSUMOS" | "OUTRAS";
  amount: number;
  description: string;
};

export type OperationMonthPlan = {
  marker: typeof OPERATION_MONTH_MARKER;
  pastDays: number;
  futureDays: number;
  slots: OperationMonthSlot[];
  cedigLaunches: CedigMonthLaunch[];
  cedigExpenses: CedigMonthExpense[];
};

const PROCEDURE_ROTATION = [
  "CON-CLM",
  "CON-CAR",
  "CON-DER",
  "CON-PSI",
  "EXA-HEM",
  "EXA-ECG",
  "OCC-ASO",
  "OCC-PCM",
  "CON-OFT",
  "EXA-GLI",
] as const;

const SOURCE_ROTATION: OperationMonthSource[] = [
  "CORPORATE",
  "WALK_IN",
  "SELF_SERVICE",
  "PARTICULAR",
  "CORPORATE",
  "WALK_IN",
];

const HOURS = [8, 9, 10, 11, 14, 15, 16, 17] as const;

/** Dia da semana (0=domingo) no calendário civil BRT. */
function dayOfWeek(dayOffset: number, now = new Date()): number {
  const iso = shiftCivilDate(civilDateISO(now), dayOffset);
  return new Date(`${iso}T12:00:00-03:00`).getUTCDay();
}

function isWeekend(dayOffset: number, now = new Date()): boolean {
  const dow = dayOfWeek(dayOffset, now);
  return dow === 0 || dow === 6;
}

function statusForSlot(
  dayOffset: number,
  salt: number,
): OperationMonthStatus {
  if (dayOffset > 0) {
    return salt % 3 === 0 ? "CONFIRMADO" : "AGENDADO";
  }
  if (dayOffset === 0) {
    // Manhã já realizada; tarde ainda aberta.
    if (salt % 8 < 4) return "REALIZADO";
    return salt % 2 === 0 ? "CONFIRMADO" : "AGENDADO";
  }
  const roll = salt % 10;
  if (roll < 6) return "REALIZADO";
  if (roll < 8) return "FALTOU";
  return "CANCELADO";
}

function sourceLabel(source: OperationMonthSource): string {
  switch (source) {
    case "WALK_IN":
      return "Encaixe / walk-in";
    case "CORPORATE":
      return "Agenda corporativa";
    case "SELF_SERVICE":
      return "Autosserviço beneficiário";
    case "PARTICULAR":
      return "Particular agendado";
  }
}

/**
 * Gera o plano determinístico do mês operacional.
 * `now` só para testes unitários (default: data corrente).
 */
export function buildOperationMonthPlan(now = new Date()): OperationMonthPlan {
  const slots: OperationMonthSlot[] = [];
  let slotIndex = 0;

  for (
    let dayOffset = -OPERATION_MONTH_PAST_DAYS;
    dayOffset <= OPERATION_MONTH_FUTURE_DAYS;
    dayOffset++
  ) {
    const dow = dayOfWeek(dayOffset, now);
    // Dia útil: 3 slots; sábado: 1; domingo: 0.
    if (dow === 0) continue;
    const slotsToday = dow === 6 ? 1 : 3;

    for (let s = 0; s < slotsToday; s++) {
      const salt = slotIndex * 17 + Math.abs(dayOffset) * 3 + s;
      const source = SOURCE_ROTATION[salt % SOURCE_ROTATION.length]!;
      const status = statusForSlot(dayOffset, salt);
      const procedureCode = PROCEDURE_ROTATION[salt % PROCEDURE_ROTATION.length]!;
      const patientPool =
        source === "CORPORATE" || source === "SELF_SERVICE" ? "corporate" : "particular";
      const realized = status === "REALIZADO";
      const withUsage = realized;
      const withPep = realized && salt % 3 !== 0;
      const billed = withUsage && salt % 5 !== 0;
      let invoiceStatus: OperationMonthSlot["invoiceStatus"] = null;
      if (billed) {
        const invRoll = salt % 10;
        invoiceStatus = invRoll < 5 ? "PAGA" : invRoll < 8 ? "FECHADA" : "ABERTA";
      }
      const dispenseStock = withUsage && procedureCode === "CON-CLM";

      slots.push({
        slotIndex,
        dayOffset,
        hour: HOURS[(salt + s) % HOURS.length]!,
        minute: (salt * 7) % 60,
        source,
        status,
        modality: salt % 7 === 0 ? "TELE" : "PRESENCIAL",
        patientPool,
        companyIndexSalt: salt,
        procedureCode,
        withPep,
        withUsage,
        billed,
        invoiceStatus,
        dispenseStock,
        reasonLabel: `${OPERATION_MONTH_MARKER} ${sourceLabel(source)} · slot ${slotIndex}`,
      });
      slotIndex += 1;
    }
  }

  const cedigLaunches: CedigMonthLaunch[] = [];
  const cedigProcs: CedigMonthLaunch["procedureCode"][] = [
    "CEDIG-ENDO",
    "CEDIG-COLO",
    "CEDIG-RESP",
  ];
  const tables: CedigMonthLaunch["priceTable"][] = [
    "PARTICULAR",
    "CENTRALMED",
    "BEM_SAUDE",
    "DR_SAUDE",
  ];
  const payments: CedigMonthLaunch["paymentMethod"][] = [
    "PIX",
    "CARTAO",
    "DINHEIRO",
    "CONVENIO",
  ];
  const amounts = [900, 1450, 400, 3200, 1100, 750];

  let launchIndex = 0;
  for (let dayOffset = -OPERATION_MONTH_PAST_DAYS; dayOffset <= -1; dayOffset++) {
    if (isWeekend(dayOffset, now)) continue;
    // ~1 lançamento a cada 2 dias úteis
    if (Math.abs(dayOffset) % 2 !== 0) continue;
    const salt = launchIndex * 13 + Math.abs(dayOffset);
    const priceTable = tables[salt % tables.length]!;
    const paymentMethod =
      priceTable === "PARTICULAR"
        ? payments[salt % 3]! // PIX/CARTAO/DINHEIRO
        : "CONVENIO";
    cedigLaunches.push({
      launchIndex,
      dayOffset,
      hour: 9 + (salt % 6),
      patientSalt: salt,
      procedureCode: cedigProcs[salt % cedigProcs.length]!,
      priceTable,
      paymentMethod,
      amountReceived: amounts[salt % amounts.length]!,
      biopsies: salt % 4 === 0 ? 1 : undefined,
      polypectomies: salt % 5 === 0 ? 1 : undefined,
    });
    launchIndex += 1;
  }

  const cedigExpenses: CedigMonthExpense[] = [];
  for (let week = 0; week < 4; week++) {
    const dayOffset = -(week * 7 + 2);
    cedigExpenses.push(
      {
        dayOffset,
        category: "LABORATORIO",
        amount: 280 + week * 40,
        description: `${OPERATION_MONTH_MARKER} Lab biópsias — semana ${week + 1}`,
      },
      {
        dayOffset,
        category: "PESSOAL",
        amount: 450 + week * 25,
        description: `${OPERATION_MONTH_MARKER} Pagamento equipe — semana ${week + 1}`,
      },
    );
  }

  return {
    marker: OPERATION_MONTH_MARKER,
    pastDays: OPERATION_MONTH_PAST_DAYS,
    futureDays: OPERATION_MONTH_FUTURE_DAYS,
    slots,
    cedigLaunches,
    cedigExpenses,
  };
}

/** Limites da janela em Date (útil para queries de teste) — dia civil BRT. */
export function operationMonthWindow(now = new Date()): { from: Date; to: Date } {
  const today = civilDateISO(now);
  const fromISO = shiftCivilDate(today, -OPERATION_MONTH_PAST_DAYS);
  const toISO = shiftCivilDate(today, OPERATION_MONTH_FUTURE_DAYS);
  return {
    from: startOfDayInAppTz(fromISO),
    to: endOfDayInAppTz(toISO),
  };
}
