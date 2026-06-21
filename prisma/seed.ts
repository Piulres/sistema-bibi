import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Retorna uma data de hoje com a hora informada (horario local). */
function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("Limpando dados existentes...");
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
    data: { name: "Clínica Bibi Saúde", cnpj: "12.345.678/0001-90" },
  });

  console.log("Criando empresa (PJ)...");
  const company = await prisma.company.create({
    data: {
      name: "TechCorp Benefícios LTDA",
      cnpj: "98.765.432/0001-10",
      contractActive: true,
      tenantId: tenant.id,
    },
  });

  console.log("Criando usuarios dos tres portais...");
  const prestador = await prisma.user.create({
    data: {
      email: "dra.helena@bibi.health",
      password: "bibi123",
      name: "Dra. Helena Martins",
      role: "PRESTADOR",
      tenantId: tenant.id,
    },
  });
  await prisma.user.create({
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
  // Joao (corporativo): consulta clinica com desconto + ECG.
  await prisma.procedureUsage.create({
    data: {
      appointmentId: ag1.id,
      procedureId: procedures["CON-CLM"].id,
      priceCharged: procedures["CON-CLM"].basePrice * 0.85,
    },
  });
  await prisma.procedureUsage.create({
    data: {
      appointmentId: ag1.id,
      procedureId: procedures["EXA-ECG"].id,
      priceCharged: procedures["EXA-ECG"].basePrice,
    },
  });
  await prisma.medicalRecord.create({
    data: {
      content:
        "Paciente refere melhora da dor torácica após ajuste medicamentoso. ECG sem alterações agudas. Mantida conduta.",
      patientId: joao.id,
      providerId: prestador.id,
      appointmentId: ag1.id,
    },
  });

  // Maria (corporativo): hemograma realizado.
  await prisma.procedureUsage.create({
    data: {
      appointmentId: ag2.id,
      procedureId: procedures["EXA-HEM"].id,
      priceCharged: procedures["EXA-HEM"].basePrice,
    },
  });

  console.log("Seed concluido com sucesso.");
  console.log("\nCredenciais de acesso (POC):");
  console.log("  Prestador  -> /login          : dra.helena@bibi.health / bibi123");
  console.log("  Interno    -> /interno/login   : faturamento@bibi.health / bibi123");
  console.log("  Empresa PJ -> /pj/login        : rh@techcorp.com / bibi123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
