import type { PrismaClient } from "@prisma/client";
import {
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "../../src/lib/timeline";
import { hashPassword } from "../../src/lib/password";
import { contractActiveForStatus } from "./helpers";
import { SEED_COMPANIES } from "./companies";
import {
  generateBeneficiaries,
  generatePjUsers,
  ensureUniqueCpfs,
} from "./generators";
import {
  todayAt,
  firstDayOfMonthFromNow,
  daysAgo,
} from "./helpers";
import { SEED_PROVIDERS, DEMO_PRESTADOR_HELENA } from "./catalog";
import {
  ALL_SEED_PROCEDURES,
  CORPORATE_BENEFIT_PRODUCTS,
  chargePrice,
  formatBrl,
} from "./pricing-market";
import {
  seedOperationalMass,
  seedBeneficiaryPortalUsers,
  type PatientRef,
  type ProcedureRef,
} from "./scenarios";
import { resolveSeedScale } from "./scale";
import { seedVitacareTenant } from "./vitacare";
import { seedMonthlyRevenueBaseline } from "./monthly-baseline";
import { seedClinicalDemo } from "./clinical-demo";
import { seedMedicalStock } from "./stock-demo";
import { currentTotpCode, DEMO_MFA_SECRET } from "./totp-demo";

const DEMO_PASSWORD = hashPassword("bibi123");

export type SeedRunResult = {
  scale: string;
  companies: number;
  patients: number;
  appointments: number;
  invoices: number;
  pendingUsages: number;
  vitacareCompanies: number;
  vitacarePatients: number;
  durationMs: number;
};

/** Repopula o banco com a massa demo (mesmo fluxo do `prisma db seed`). */
export async function runDatabaseSeed(prisma: PrismaClient): Promise<SeedRunResult> {
  const startedAt = Date.now();
  const scale = resolveSeedScale();
  console.log(`Escala do seed: ${scale.scale} (SEED_SCALE)`);
  console.log("Limpando dados existentes...");
  await prisma.timelineEvent.deleteMany();
  await prisma.message.deleteMany();
  await prisma.webhookEndpoint.deleteMany();
  await prisma.webhookDelivery.deleteMany();
  await prisma.subscriptionCharge.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.procedureUsage.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.procedureMaterialKit.deleteMany();
  await prisma.stockLot.deleteMany();
  await prisma.medicalProduct.deleteMany();
  await prisma.patientProtocolEnrollment.deleteMany();
  await prisma.examOrder.deleteMany();
  await prisma.medicationPrescription.deleteMany();
  await prisma.patientClinicalProfile.deleteMany();
  await prisma.careProtocolTemplate.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.tenant.deleteMany();

  console.log("Criando tenant...");
  const tenant = await prisma.tenant.create({
    data: {
      name: "Clínica Horizonte",
      cnpj: "12.345.678/0001-90",
      branding: {
        create: {
          displayName: "Clínica Horizonte",
          tagline: "Cuidado humanizado com gestão inteligente",
          primaryColor: "#0d9488",
          accentColor: "#14b8a6",
          heroFrom: "#0f172a",
          heroTo: "#134e4a",
          platformLabel: "Powered by Sistema Bibi",
          colorScheme: "light",
        },
      },
    },
  });

  console.log("Criando tenant white-label VitaCare (dados no final do seed)...");
  console.log(`Criando ${SEED_COMPANIES.length} empresas (PJ) e pipeline CRM...`);
  const companyIdByIndex = new Map<number, string>();
  for (const seed of SEED_COMPANIES) {
    const company = await prisma.company.create({
      data: {
        name: seed.name,
        cnpj: seed.cnpj,
        status: seed.status,
        contractActive: contractActiveForStatus(seed.status),
        tenantId: tenant.id,
      },
    });
    companyIdByIndex.set(seed.index, company.id);
  }

  console.log("Criando usuarios dos portais...");
  const prestador = await prisma.user.create({
    data: {
      email: DEMO_PRESTADOR_HELENA.email,
      password: DEMO_PASSWORD,
      name: DEMO_PRESTADOR_HELENA.name,
      role: "PRESTADOR",
      tenantId: tenant.id,
      specialty: DEMO_PRESTADOR_HELENA.specialty,
      councilType: DEMO_PRESTADOR_HELENA.councilType,
      councilNumber: DEMO_PRESTADOR_HELENA.councilNumber,
      councilUf: DEMO_PRESTADOR_HELENA.councilUf,
      phone: DEMO_PRESTADOR_HELENA.phone,
    },
  });
  const providerIds = [prestador.id];
  for (const p of SEED_PROVIDERS) {
    const created = await prisma.user.create({
      data: {
        email: p.email,
        password: DEMO_PASSWORD,
        name: p.name,
        role: "PRESTADOR",
        tenantId: tenant.id,
        specialty: p.specialty,
        councilType: p.councilType,
        councilNumber: p.councilNumber,
        councilUf: p.councilUf,
        phone: p.phone,
      },
    });
    providerIds.push(created.id);
  }
  const interno = await prisma.user.create({
    data: {
      email: "faturamento@bibi.health",
      password: DEMO_PASSWORD,
      name: "Carlos Faturamento",
      role: "INTERNO",
      internoProfile: "ADMIN",
      tenantId: tenant.id,
    },
  });
  await prisma.user.create({
    data: {
      email: "recepcao@bibi.health",
      password: DEMO_PASSWORD,
      name: "Paula Recepção",
      role: "INTERNO",
      internoProfile: "RECEPCAO",
      tenantId: tenant.id,
    },
  });
  await prisma.user.create({
    data: {
      email: "financeiro@bibi.health",
      password: DEMO_PASSWORD,
      name: "Fernanda Financeiro",
      role: "INTERNO",
      internoProfile: "FATURAMENTO",
      tenantId: tenant.id,
    },
  });
  await prisma.user.create({
    data: {
      email: "seguranca@bibi.health",
      password: DEMO_PASSWORD,
      name: "Admin Segurança (MFA)",
      role: "INTERNO",
      internoProfile: "ADMIN",
      mfaEnabled: true,
      mfaSecret: DEMO_MFA_SECRET,
      tenantId: tenant.id,
    },
  });

  const pjUsers = generatePjUsers(SEED_COMPANIES);
  for (const pj of pjUsers) {
    const companyId = companyIdByIndex.get(pj.companyIndex);
    if (!companyId) continue;
    await prisma.user.create({
      data: {
        email: pj.email,
        password: DEMO_PASSWORD,
        name: pj.name,
        role: "PJ",
        tenantId: tenant.id,
        companyId,
      },
    });
  }

  console.log("Criando catalogo de procedimentos...");
  const procData = [...ALL_SEED_PROCEDURES];
  const procedures: Record<string, ProcedureRef> = {};
  for (const p of procData) {
    const created = await prisma.procedure.create({
      data: { ...p, tenantId: tenant.id },
    });
    procedures[p.code] = {
      id: created.id,
      basePrice: created.basePrice,
      name: created.name,
      code: p.code,
      category: p.category,
    };
  }

  const discountByCompanyIndex = new Map<number, number>();
  for (const seed of SEED_COMPANIES) {
    if (seed.clinicalDiscount) {
      discountByCompanyIndex.set(seed.index, seed.clinicalDiscount);
    }
  }

  console.log("Criando regras de precificacao dinamica (descontos corporativos)...");
  for (const seed of SEED_COMPANIES) {
    if (!seed.clinicalDiscount) continue;
    const companyId = companyIdByIndex.get(seed.index);
    if (!companyId) continue;
    const discountPct = Math.round((1 - seed.clinicalDiscount) * 100);
    for (const proc of ALL_SEED_PROCEDURES) {
      if (proc.category !== "CONSULTA" && proc.category !== "OCUPACIONAL") continue;
      await prisma.pricingRule.create({
        data: {
          description: `Desconto corporativo ${seed.name.split(" ")[0]} (${discountPct}%) em ${proc.name}`,
          multiplier: seed.clinicalDiscount,
          procedureId: procedures[proc.code]!.id,
          companyId,
        },
      });
    }
  }

  console.log("Criando estoque medico (produtos, lotes, kits)...");
  await seedMedicalStock(prisma, tenant.id, procedures);

  console.log("Criando beneficiarios...");
  const beneficiaries = ensureUniqueCpfs(generateBeneficiaries(SEED_COMPANIES));
  const patientIdByDemo = new Map<string, string>();
  const patientRefs: PatientRef[] = [];

  for (const b of beneficiaries) {
    const companyId =
      b.companyIndex > 0 ? (companyIdByIndex.get(b.companyIndex) ?? null) : null;

    const patient = await prisma.patient.create({
      data: {
        name: b.name,
        cpf: b.cpf,
        birthDate: b.birthDate,
        phone: b.phone,
        consentAt: b.isDemo !== "pedro" ? new Date() : null,
        consentVersion: b.isDemo !== "pedro" ? "v1-poc" : null,
        tenantId: tenant.id,
        companyId,
      },
    });
    patientRefs.push({
      id: patient.id,
      name: b.name,
      companyId,
      companyIndex: b.companyIndex,
    });

    if (b.isDemo) {
      patientIdByDemo.set(b.isDemo, patient.id);
      await prisma.timelineEvent.create({
        data: {
          tenantId: tenant.id,
          entityType: TIMELINE_ENTITY_TYPES.PATIENT,
          entityId: patient.id,
          action: TIMELINE_ACTIONS.CREATED,
          description: `Beneficiário ${b.name} cadastrado`,
          createdBy: prestador.id,
        },
      });
    }

    if (b.isDemo === "joao" || b.isDemo === "maria" || b.isDemo === "pedro") {
      await prisma.user.create({
        data: {
          email: b.email,
          password: DEMO_PASSWORD,
          name: b.name,
          role: "BENEFICIARIO",
          tenantId: tenant.id,
          patientId: patient.id,
        },
      });
    }
  }

  const excludePatientIds = new Set<string>();

  const joaoId = patientIdByDemo.get("joao")!;
  const mariaId = patientIdByDemo.get("maria")!;
  const pedroId = patientIdByDemo.get("pedro")!;
  excludePatientIds.add(joaoId).add(mariaId).add(pedroId);
  const techCorpId = companyIdByIndex.get(1)!;

  console.log("Criando agenda do dia e consultas historicas...");
  const ag1 = await prisma.appointment.create({
    data: {
      scheduledAt: todayAt(9, 0),
      status: "CONFIRMADO",
      reason: "Retorno - dor torácica",
      tenantId: tenant.id,
      patientId: joaoId,
      providerId: prestador.id,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.APPOINTMENT,
      entityId: ag1.id,
      action: TIMELINE_ACTIONS.CREATED,
      description: "Agendamento criado para João Pereira",
      createdBy: prestador.id,
    },
  });

  const ag2 = await prisma.appointment.create({
    data: {
      scheduledAt: todayAt(10, 30),
      status: "AGENDADO",
      modality: "TELE",
      telemedicineUrl: "https://meet.bibi.health/room/seed-tele-maria",
      reason: "Check-up anual (telemedicina)",
      tenantId: tenant.id,
      patientId: mariaId,
      providerId: prestador.id,
    },
  });
  await prisma.appointment.create({
    data: {
      scheduledAt: todayAt(14, 0),
      status: "AGENDADO",
      reason: "Avaliação dermatológica",
      tenantId: tenant.id,
      patientId: pedroId,
      providerId: prestador.id,
    },
  });

  console.log("Registrando uso de procedimentos (Pay Per Use) e prontuario demo...");
  const joaoConsultaPrice = chargePrice(
    "CONSULTA",
    procedures["CON-CLM"].basePrice,
    1,
    discountByCompanyIndex,
  );
  const usageJoaoConsulta = await prisma.procedureUsage.create({
    data: {
      appointmentId: ag1.id,
      procedureId: procedures["CON-CLM"].id,
      priceCharged: joaoConsultaPrice,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.PROCEDURE_USAGE,
      entityId: usageJoaoConsulta.id,
      action: TIMELINE_ACTIONS.PROCEDURE_REGISTERED,
      description: `Consulta Clínica Médica registrada para João Pereira (${formatBrl(joaoConsultaPrice)})`,
      createdBy: prestador.id,
    },
  });

  const usageJoaoEcg = await prisma.procedureUsage.create({
    data: {
      appointmentId: ag1.id,
      procedureId: procedures["EXA-ECG"].id,
      priceCharged: procedures["EXA-ECG"].basePrice,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.PROCEDURE_USAGE,
      entityId: usageJoaoEcg.id,
      action: TIMELINE_ACTIONS.PROCEDURE_REGISTERED,
      description: `Eletrocardiograma registrado para João Pereira (${formatBrl(procedures["EXA-ECG"].basePrice)})`,
      createdBy: prestador.id,
    },
  });

  const recordJoao = await prisma.medicalRecord.create({
    data: {
      recordType: "EVOLUCAO",
      title: "Evolução — dor torácica",
      content:
        "Paciente refere melhora da dor torácica após ajuste medicamentoso. ECG sem alterações agudas. Mantida conduta.",
      patientId: joaoId,
      providerId: prestador.id,
      appointmentId: ag1.id,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.MEDICAL_RECORD,
      entityId: recordJoao.id,
      action: TIMELINE_ACTIONS.MEDICAL_RECORD_CREATED,
      description: "Anotação clínica registrada no prontuário de João Pereira",
      createdBy: prestador.id,
    },
  });

  const recordJoaoReceita = await prisma.medicalRecord.create({
    data: {
      recordType: "RECEITA",
      title: "Receituário — anti-hipertensivo",
      content:
        "Losartana 50mg — 1 comprimido pela manhã.\nAtenolol 25mg — 1 comprimido à noite.\nRetorno em 30 dias.",
      patientId: joaoId,
      providerId: prestador.id,
      appointmentId: ag1.id,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.MEDICAL_RECORD,
      entityId: recordJoaoReceita.id,
      action: TIMELINE_ACTIONS.MEDICAL_RECORD_CREATED,
      description: "Receituário emitido para João Pereira",
      createdBy: prestador.id,
    },
  });

  console.log("Criando massa Care Chart (perfil, meds, exames, protocolos)...");
  await seedClinicalDemo(prisma, {
    tenantId: tenant.id,
    patientId: joaoId,
    providerId: prestador.id,
    appointmentId: ag1.id,
    procedureHbA1cId: procedures["EXA-GLI"]?.id,
  });

  const usageMaria = await prisma.procedureUsage.create({
    data: {
      appointmentId: ag2.id,
      procedureId: procedures["EXA-HEM"].id,
      priceCharged: procedures["EXA-HEM"].basePrice,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.PROCEDURE_USAGE,
      entityId: usageMaria.id,
      action: TIMELINE_ACTIONS.PROCEDURE_REGISTERED,
      description: `Hemograma Completo registrado para Maria Souza (${formatBrl(procedures["EXA-HEM"].basePrice)})`,
      createdBy: prestador.id,
    },
  });

  const invMaria = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      patientId: mariaId,
      companyId: techCorpId,
      total: procedures["EXA-HEM"].basePrice,
      status: "FECHADA",
      items: {
        create: [
          {
            description: procedures["EXA-HEM"].name,
            amount: procedures["EXA-HEM"].basePrice,
            usageId: usageMaria.id,
          },
        ],
      },
    },
  });
  await prisma.procedureUsage.update({
    where: { id: usageMaria.id },
    data: { billed: true },
  });
  await prisma.payment.create({
    data: {
      invoiceId: invMaria.id,
      method: "PIX",
      amount: procedures["EXA-HEM"].basePrice,
      status: "PENDING",
      gatewayId: "mock",
      externalId: `seed-pix-maria-${invMaria.id.slice(-8)}`,
      pixCopyPaste: `00020126580014br.gov.bcb.pix0136maria-${invMaria.id.slice(-12)}`,
      createdBy: interno.id,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.INVOICE,
      entityId: invMaria.id,
      action: TIMELINE_ACTIONS.INVOICE_ISSUED,
      description: `Fatura Pay Per Use emitida para Maria Souza (${formatBrl(procedures["EXA-HEM"].basePrice)})`,
      createdBy: interno.id,
    },
  });

  console.log("Criando assinaturas recorrentes...");
  const telemedicina = CORPORATE_BENEFIT_PRODUCTS.TELEMEDICINA_24H;
  const checkup = CORPORATE_BENEFIT_PRODUCTS.CHECKUP_PROGRAMADO;
  const subJoao = await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      patientId: joaoId,
      companyId: techCorpId,
      status: "ATIVA",
      billingCycle: telemedicina.billingCycle,
      startDate: new Date("2025-01-01"),
      amount: telemedicina.amount,
      description: `${telemedicina.description} — TechCorp`,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.SUBSCRIPTION,
      entityId: subJoao.id,
      action: TIMELINE_ACTIONS.CREATED,
      description: "Assinatura Mensal criada para João Pereira",
      createdBy: interno.id,
    },
  });
  for (const dueDate of [
    firstDayOfMonthFromNow(0),
    firstDayOfMonthFromNow(1),
    firstDayOfMonthFromNow(2),
  ]) {
    await prisma.subscriptionCharge.create({
      data: {
        subscriptionId: subJoao.id,
        dueDate,
        amount: telemedicina.amount,
        status: "PENDENTE",
      },
    });
  }
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.SUBSCRIPTION,
      entityId: subJoao.id,
      action: TIMELINE_ACTIONS.SUBSCRIPTION_CHARGES_GENERATED,
      description: `3 cobrança(s) futura(s) geradas para João Pereira (${formatBrl(telemedicina.amount)}/mensal)`,
      createdBy: interno.id,
    },
  });

  const subMaria = await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      patientId: mariaId,
      companyId: techCorpId,
      status: "ATIVA",
      billingCycle: checkup.billingCycle,
      startDate: new Date("2025-03-01"),
      amount: checkup.amount,
      description: `${checkup.description} — TechCorp`,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.SUBSCRIPTION,
      entityId: subMaria.id,
      action: TIMELINE_ACTIONS.CREATED,
      description: "Assinatura Trimestral criada para Maria Souza",
      createdBy: interno.id,
    },
  });
  await prisma.subscriptionCharge.create({
    data: {
      subscriptionId: subMaria.id,
      dueDate: firstDayOfMonthFromNow(2),
      amount: checkup.amount,
      status: "PENDENTE",
    },
  });

  const particular = CORPORATE_BENEFIT_PRODUCTS.TELEMEDICINA_PARTICULAR;
  const subPedro = await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      patientId: pedroId,
      companyId: null,
      status: "SUSPENSA",
      billingCycle: particular.billingCycle,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2025-12-31"),
      amount: particular.amount,
      description: `${particular.description} — suspenso por inadimplência`,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.SUBSCRIPTION,
      entityId: subPedro.id,
      action: TIMELINE_ACTIONS.CREATED,
      description: "Assinatura Mensal criada para Pedro Almeida",
      createdBy: interno.id,
    },
  });

  console.log("Gerando massa operacional completa (agenda, faturas, recorrencia, integracoes)...");
  const massStats = await seedOperationalMass({
    prisma,
    tenantId: tenant.id,
    procedures,
    providerIds,
    internoId: interno.id,
    companyIdByIndex,
    discountByCompanyIndex,
    patients: patientRefs,
    excludePatientIds,
    companies: SEED_COMPANIES,
    scale,
  });

  const beneficiaryUsers = await seedBeneficiaryPortalUsers({
    prisma,
    tenantId: tenant.id,
    patients: patientRefs,
    excludePatientIds,
    password: DEMO_PASSWORD,
    scale,
  });
  massStats.beneficiaryUsers = beneficiaryUsers;

  console.log("Criando baseline de receita mensal deterministica (6 meses)...");
  const baseline = await seedMonthlyRevenueBaseline({
    prisma,
    tenantId: tenant.id,
    internoId: interno.id,
    patients: patientRefs,
    companies: SEED_COMPANIES,
    companyIdByIndex,
  });
  console.log(`  Baseline: ${baseline.months} meses · R$ ${baseline.totalRevenue.toFixed(2)}`);

  console.log("Criando fatura historica demo (Pedro)...");
  const agPedroPast = await prisma.appointment.create({
    data: {
      scheduledAt: daysAgo(30),
      status: "REALIZADO",
      reason: "Avaliação dermatológica",
      tenantId: tenant.id,
      patientId: pedroId,
      providerId: prestador.id,
    },
  });
  const usagePedro = await prisma.procedureUsage.create({
    data: {
      appointmentId: agPedroPast.id,
      procedureId: procedures["CON-DER"].id,
      priceCharged: procedures["CON-DER"].basePrice,
      billed: true,
    },
  });
  const invPedro = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      patientId: pedroId,
      companyId: null,
      total: procedures["CON-DER"].basePrice,
      status: "PAGA",
      items: {
        create: [
          {
            description: procedures["CON-DER"].name,
            amount: procedures["CON-DER"].basePrice,
            usageId: usagePedro.id,
          },
        ],
      },
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: invPedro.id,
      method: "PIX",
      amount: procedures["CON-DER"].basePrice,
      status: "CONFIRMED",
      gatewayId: "mock",
      externalId: `seed-pix-pedro-${invPedro.id.slice(-8)}`,
      pixCopyPaste: `00020126580014br.gov.bcb.pix0136pedro-${invPedro.id.slice(-12)}`,
      paidAt: daysAgo(28),
      createdBy: interno.id,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.INVOICE,
      entityId: invPedro.id,
      action: TIMELINE_ACTIONS.INVOICE_ISSUED,
      description: `Fatura Pay Per Use emitida para Pedro Almeida (${formatBrl(procedures["CON-DER"].basePrice)})`,
      createdBy: interno.id,
    },
  });

  console.log("Criando webhook demo (Integrações B2B)...");
  await prisma.webhookEndpoint.create({
    data: {
      tenantId: tenant.id,
      label: "ERP TechCorp (demo)",
      url: "https://webhook.site/demo-bibi-tier3",
      secret: "demo-webhook-secret",
      events: JSON.stringify(["INVOICE_ISSUED", "APPOINTMENT_CREATED", "COMPANY_STATUS_CHANGED"]),
    },
  });

  console.log("Criando fila de comunicacoes...");
  const msgJoao = await prisma.message.create({
    data: {
      tenantId: tenant.id,
      patientId: joaoId,
      channel: "WHATSAPP",
      template: "APPOINTMENT_REMINDER",
      body: "Olá João Pereira, lembramos sua consulta agendada para hoje às 09:00. Em caso de impossibilidade, entre em contato conosco.",
      status: "PENDENTE",
      createdBy: interno.id,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.MESSAGE,
      entityId: msgJoao.id,
      action: TIMELINE_ACTIONS.MESSAGE_QUEUED,
      description: "WhatsApp enfileirado para João Pereira (Lembrete de consulta)",
      createdBy: interno.id,
    },
  });

  const msgMaria = await prisma.message.create({
    data: {
      tenantId: tenant.id,
      patientId: mariaId,
      channel: "EMAIL",
      template: "SUBSCRIPTION_DUE",
      subject: "Cobrança recorrente — Bibi Saúde",
      body: `Olá Maria Souza, sua assinatura possui cobrança pendente de ${formatBrl(checkup.amount)}. Regularize para manter o benefício ativo.`,
      status: "PENDENTE",
      createdBy: interno.id,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.MESSAGE,
      entityId: msgMaria.id,
      action: TIMELINE_ACTIONS.MESSAGE_QUEUED,
      description: "E-mail enfileirado para Maria Souza (Cobrança recorrente)",
      createdBy: interno.id,
    },
  });

  console.log("\nPopulando tenant VitaCare (white-label)...");
  const vitacareStats = await seedVitacareTenant(prisma, DEMO_PASSWORD, scale);

  const companyCount = await prisma.company.count({ where: { tenantId: tenant.id } });
  const patientCount = await prisma.patient.count({ where: { tenantId: tenant.id } });
  const pjCount = await prisma.user.count({ where: { tenantId: tenant.id, role: "PJ" } });
  const appointmentCount = await prisma.appointment.count({ where: { tenantId: tenant.id } });
  const invoiceCount = await prisma.invoice.count({ where: { tenantId: tenant.id } });
  const pendingUsages = await prisma.procedureUsage.count({
    where: { billed: false, appointment: { tenantId: tenant.id } },
  });

  console.log("\nSeed concluido com sucesso.");
  console.log(`  Escala: ${scale.scale}`);
  console.log(`  Empresas Bibi (clientes PJ): ${companyCount}`);
  console.log(`  Beneficiarios Bibi: ${patientCount}`);
  console.log(`  Usuarios PJ: ${pjCount}`);
  console.log(`  Prestadores: ${providerIds.length}`);
  console.log(`  Agendamentos Bibi: ${appointmentCount}`);
  console.log(`  Faturas Bibi: ${invoiceCount}`);
  console.log(`  Procedimentos pendentes de faturamento: ${pendingUsages}`);
  console.log(`  VitaCare: ${vitacareStats.companies} empresas · ${vitacareStats.patients} beneficiarios`);
  console.log("\nMassa operacional Bibi (esta execucao):");
  console.log(`  +${massStats.appointments} agendamentos · +${massStats.procedureUsages} procedimentos`);
  console.log(`  +${massStats.medicalRecords} prontuarios · +${massStats.invoices} faturas · +${massStats.payments} pagamentos`);
  console.log(`  +${massStats.subscriptions} assinaturas · +${massStats.subscriptionCharges} cobrancas recorrentes`);
  console.log(`  +${massStats.messages} mensagens · +${massStats.timelineEvents} eventos timeline`);
  console.log(`  +${massStats.webhookDeliveries} entregas webhook · +${massStats.beneficiaryUsers} usuarios beneficiario`);
  console.log("\nCredenciais de acesso (POC):");
  console.log("  Prestador    -> /login              : dra.helena@bibi.health / bibi123");
  console.log("  Interno      -> /interno/login       : faturamento@bibi.health / bibi123 (ADMIN)");
  console.log("  Faturamento  -> /interno/login       : financeiro@bibi.health / bibi123 (RBAC FATURAMENTO)");
  console.log("  Recepção     -> /interno/login       : recepcao@bibi.health / bibi123 (RBAC RECEPCAO)");
  console.log("  MFA demo     -> /interno/login       : seguranca@bibi.health / bibi123 + TOTP");
  console.log(`    Secret MFA: ${DEMO_MFA_SECRET} · Codigo atual: ${currentTotpCode()}`);
  console.log("  Empresa PJ   -> /pj/login            : rh@techcorp.com / bibi123");
  console.log("  Beneficiario -> /beneficiario/login  : joao.pereira@email.com / bibi123");
  console.log("  Beneficiario -> /beneficiario/login  : maria.souza@email.com / bibi123");
  console.log("  Beneficiario -> /beneficiario/login  : pedro.almeida@email.com / bibi123 (particular)");
  console.log("  VitaCare     -> /interno/login       : operacao@vitacare.demo / bibi123");
  console.log("  VitaCare PJ  -> /pj/login            : rh@vitacarecorp.demo / bibi123");
  console.log("\nSEED_SCALE=small|medium|large no .env controla volume da massa");
  console.log("\nTier 4: MFA em /interno/seguranca · TISS XML no faturamento · telemedicina na agenda");

  return {
    scale: scale.scale,
    companies: companyCount,
    patients: patientCount,
    appointments: appointmentCount,
    invoices: invoiceCount,
    pendingUsages,
    vitacareCompanies: vitacareStats.companies,
    vitacarePatients: vitacareStats.patients,
    durationMs: Date.now() - startedAt,
  };
}
