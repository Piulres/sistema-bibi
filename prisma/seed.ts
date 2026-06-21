import { PrismaClient } from "@prisma/client";
import {
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "../src/lib/timeline";

const prisma = new PrismaClient();

/** Primeiro dia do mês daqui a N meses. */
function firstDayOfMonthFromNow(monthsAhead: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() + monthsAhead);
  return d;
}

/** Retorna uma data de hoje com a hora informada (horario local). */
function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("Limpando dados existentes...");
  await prisma.timelineEvent.deleteMany();
  await prisma.message.deleteMany();
  await prisma.subscriptionCharge.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.procedureUsage.deleteMany();
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
      name: "Clínica Bibi Saúde",
      cnpj: "12.345.678/0001-90",
      branding: {
        create: {
          displayName: "Clínica Bibi Saúde",
          tagline: "Cuidado humanizado com gestão inteligente",
          primaryColor: "#0d9488",
          accentColor: "#14b8a6",
          heroFrom: "#0f172a",
          heroTo: "#134e4a",
          platformLabel: "Powered by Sistema Bibi",
        },
      },
    },
  });

  console.log("Criando tenant white-label demo (VitaCare)...");
  const vitacare = await prisma.tenant.create({
    data: {
      name: "Rede VitaCare",
      cnpj: "99.888.777/0001-11",
      branding: {
        create: {
          displayName: "VitaCare",
          tagline: "Saúde corporativa sob medida",
          primaryColor: "#2563eb",
          accentColor: "#3b82f6",
          heroFrom: "#1e3a8a",
          heroTo: "#1d4ed8",
          platformLabel: "Powered by Sistema Bibi",
        },
      },
    },
  });
  void vitacare;

  console.log("Criando empresas (PJ) e pipeline CRM...");
  const company = await prisma.company.create({
    data: {
      name: "TechCorp Benefícios LTDA",
      cnpj: "98.765.432/0001-10",
      status: "ATIVO",
      contractActive: true,
      tenantId: tenant.id,
    },
  });
  await prisma.company.create({
    data: {
      name: "NovaLog Transportes SA",
      cnpj: "11.222.333/0001-44",
      status: "NEGOCIACAO",
      contractActive: false,
      tenantId: tenant.id,
    },
  });
  await prisma.company.create({
    data: {
      name: "BetaStart Tecnologia",
      cnpj: "22.333.444/0001-55",
      status: "LEAD",
      contractActive: false,
      tenantId: tenant.id,
    },
  });
  await prisma.company.create({
    data: {
      name: "VelozCom Varejo",
      cnpj: "33.444.555/0001-66",
      status: "INADIMPLENTE",
      contractActive: true,
      tenantId: tenant.id,
    },
  });
  await prisma.company.create({
    data: {
      name: "OldCorp Encerrada",
      cnpj: "44.555.666/0001-77",
      status: "CANCELADO",
      contractActive: false,
      tenantId: tenant.id,
    },
  });
  await prisma.company.create({
    data: {
      name: "PropostaMed Clínicas",
      cnpj: "55.666.777/0001-88",
      status: "PROPOSTA",
      contractActive: false,
      tenantId: tenant.id,
    },
  });

  console.log("Criando usuarios dos quatro portais...");
  const prestador = await prisma.user.create({
    data: {
      email: "dra.helena@bibi.health",
      password: "bibi123",
      name: "Dra. Helena Martins",
      role: "PRESTADOR",
      tenantId: tenant.id,
    },
  });
  const interno = await prisma.user.create({
    data: {
      email: "faturamento@bibi.health",
      password: "bibi123",
      name: "Carlos Faturamento",
      role: "INTERNO",
      tenantId: tenant.id,
    },
  });
  await prisma.user.create({
    data: {
      email: "rh@techcorp.com",
      password: "bibi123",
      name: "Ana RH (TechCorp)",
      role: "PJ",
      tenantId: tenant.id,
      companyId: company.id,
    },
  });
  console.log("Criando catalogo de procedimentos...");
  const procData = [
    { code: "CON-CLM", name: "Consulta Clínica Médica", category: "CONSULTA", basePrice: 180 },
    { code: "CON-CAR", name: "Consulta Cardiologia", category: "CONSULTA", basePrice: 250 },
    { code: "CON-DER", name: "Consulta Dermatologia", category: "CONSULTA", basePrice: 220 },
    { code: "EXA-HEM", name: "Hemograma Completo", category: "EXAME", basePrice: 45 },
    { code: "EXA-ECG", name: "Eletrocardiograma", category: "EXAME", basePrice: 120 },
    { code: "EXA-USG", name: "Ultrassonografia Abdominal", category: "EXAME", basePrice: 190 },
  ];
  const procedures: Record<string, { id: string; basePrice: number; name: string }> = {};
  for (const p of procData) {
    const created = await prisma.procedure.create({
      data: { ...p, tenantId: tenant.id },
    });
    procedures[p.code] = { id: created.id, basePrice: created.basePrice, name: created.name };
  }

  console.log("Criando regra de precificacao dinamica (desconto corporativo)...");
  // Desconto de 15% para consultas clinicas dos beneficiarios da TechCorp.
  await prisma.pricingRule.create({
    data: {
      description: "Desconto corporativo TechCorp (-15%) em Consulta Clínica",
      multiplier: 0.85,
      procedureId: procedures["CON-CLM"].id,
      companyId: company.id,
    },
  });

  console.log("Criando beneficiarios...");
  const joao = await prisma.patient.create({
    data: {
      name: "João Pereira",
      cpf: "111.222.333-44",
      birthDate: new Date("1985-04-12"),
      phone: "(11) 98888-1111",
      tenantId: tenant.id,
      companyId: company.id,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.PATIENT,
      entityId: joao.id,
      action: TIMELINE_ACTIONS.CREATED,
      description: "Beneficiário João Pereira cadastrado",
      createdBy: prestador.id,
    },
  });
  await prisma.user.create({
    data: {
      email: "joao.pereira@email.com",
      password: "bibi123",
      name: "João Pereira",
      role: "BENEFICIARIO",
      tenantId: tenant.id,
      patientId: joao.id,
    },
  });
  const maria = await prisma.patient.create({
    data: {
      name: "Maria Souza",
      cpf: "555.666.777-88",
      birthDate: new Date("1992-09-30"),
      phone: "(11) 97777-2222",
      tenantId: tenant.id,
      companyId: company.id,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.PATIENT,
      entityId: maria.id,
      action: TIMELINE_ACTIONS.CREATED,
      description: "Beneficiário Maria Souza cadastrado",
      createdBy: prestador.id,
    },
  });
  const pedro = await prisma.patient.create({
    data: {
      name: "Pedro Almeida",
      cpf: "999.000.111-22",
      birthDate: new Date("1978-01-05"),
      phone: "(11) 96666-3333",
      tenantId: tenant.id,
      companyId: null,
    },
  });

  console.log("Criando agenda do dia para a prestadora...");
  const ag1 = await prisma.appointment.create({
    data: {
      scheduledAt: todayAt(9, 0),
      status: "CONFIRMADO",
      reason: "Retorno - dor torácica",
      tenantId: tenant.id,
      patientId: joao.id,
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
      reason: "Check-up anual",
      tenantId: tenant.id,
      patientId: maria.id,
      providerId: prestador.id,
    },
  });
  await prisma.appointment.create({
    data: {
      scheduledAt: todayAt(14, 0),
      status: "AGENDADO",
      reason: "Avaliação dermatológica",
      tenantId: tenant.id,
      patientId: pedro.id,
      providerId: prestador.id,
    },
  });

  console.log("Registrando uso de procedimentos (Pay Per Use) e prontuario...");
  const usageJoaoConsulta = await prisma.procedureUsage.create({
    data: {
      appointmentId: ag1.id,
      procedureId: procedures["CON-CLM"].id,
      priceCharged: procedures["CON-CLM"].basePrice * 0.85,
    },
  });
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.PROCEDURE_USAGE,
      entityId: usageJoaoConsulta.id,
      action: TIMELINE_ACTIONS.PROCEDURE_REGISTERED,
      description: "Consulta Clínica Médica registrada para João Pereira (R$ 153,00)",
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
      description: "Eletrocardiograma registrado para João Pereira (R$ 120,00)",
      createdBy: prestador.id,
    },
  });
  const recordJoao = await prisma.medicalRecord.create({
    data: {
      content:
        "Paciente refere melhora da dor torácica após ajuste medicamentoso. ECG sem alterações agudas. Mantida conduta.",
      patientId: joao.id,
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
      description: "Hemograma Completo registrado para Maria Souza (R$ 45,00)",
      createdBy: prestador.id,
    },
  });

  console.log("Criando assinaturas recorrentes (Recorrência)...");
  const subJoao = await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      patientId: joao.id,
      companyId: company.id,
      status: "ATIVA",
      billingCycle: "MENSAL",
      startDate: new Date("2025-01-01"),
      amount: 89.9,
      description: "Plano corporativo TechCorp — telemedicina",
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
  const joaoDueDates = [
    firstDayOfMonthFromNow(0),
    firstDayOfMonthFromNow(1),
    firstDayOfMonthFromNow(2),
  ];
  for (const dueDate of joaoDueDates) {
    await prisma.subscriptionCharge.create({
      data: {
        subscriptionId: subJoao.id,
        dueDate,
        amount: 89.9,
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
      description:
        "3 cobrança(s) futura(s) geradas para João Pereira (R$ 89,90/mensal)",
      createdBy: interno.id,
    },
  });

  const subMaria = await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      patientId: maria.id,
      companyId: company.id,
      status: "ATIVA",
      billingCycle: "TRIMESTRAL",
      startDate: new Date("2025-03-01"),
      amount: 249.9,
      description: "Check-up trimestral corporativo",
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
      amount: 249.9,
      status: "PENDENTE",
    },
  });

  const subPedro = await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      patientId: pedro.id,
      companyId: null,
      status: "SUSPENSA",
      billingCycle: "MENSAL",
      startDate: new Date("2024-06-01"),
      endDate: new Date("2025-12-31"),
      amount: 59.9,
      description: "Plano particular — suspenso por inadimplência",
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

  console.log("Criando fatura historica demo (Pedro)...");
  const agPedroPast = await prisma.appointment.create({
    data: {
      scheduledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: "REALIZADO",
      reason: "Avaliação dermatológica",
      tenantId: tenant.id,
      patientId: pedro.id,
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
      patientId: pedro.id,
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
  await prisma.timelineEvent.create({
    data: {
      tenantId: tenant.id,
      entityType: TIMELINE_ENTITY_TYPES.INVOICE,
      entityId: invPedro.id,
      action: TIMELINE_ACTIONS.INVOICE_ISSUED,
      description: `Fatura Pay Per Use emitida para Pedro Almeida (R$ 220,00)`,
      createdBy: interno.id,
    },
  });

  console.log("Criando fila de comunicacoes (Comunicacao)...");
  const msgJoao = await prisma.message.create({
    data: {
      tenantId: tenant.id,
      patientId: joao.id,
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
      patientId: maria.id,
      channel: "EMAIL",
      template: "SUBSCRIPTION_DUE",
      subject: "Cobrança recorrente — Bibi Saúde",
      body: "Olá Maria Souza, sua assinatura possui cobrança pendente de R$ 249,90. Regularize para manter o plano ativo.",
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

  console.log("Seed concluido com sucesso.");
  console.log("\nCredenciais de acesso (POC):");
  console.log("  Prestador    -> /login              : dra.helena@bibi.health / bibi123");
  console.log("  Interno      -> /interno/login       : faturamento@bibi.health / bibi123");
  console.log("  Empresa PJ   -> /pj/login            : rh@techcorp.com / bibi123");
  console.log("  Beneficiario -> /beneficiario/login  : joao.pereira@email.com / bibi123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
