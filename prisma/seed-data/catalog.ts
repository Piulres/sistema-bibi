/** Prestadores adicionais além da Dra. Helena (demo principal). */
export const SEED_PROVIDERS = [
  {
    email: "dr.ricardo@bibi.health",
    name: "Dr. Ricardo Cardoso",
    specialty: "Cardiologia",
  },
  {
    email: "dra.fernanda@bibi.health",
    name: "Dra. Fernanda Lima",
    specialty: "Clínica Geral",
  },
  {
    email: "dr.paulo@bibi.health",
    name: "Dr. Paulo Mendes",
    specialty: "Dermatologia",
  },
] as const;

export const APPOINTMENT_REASONS = [
  "Consulta de rotina",
  "Retorno",
  "Check-up anual",
  "Dor de cabeça",
  "Avaliação cardiológica",
  "Exame admissional",
  "Teleconsulta",
  "ASO periódico",
  "PCMSO — exame complementar",
  "Avaliação pré-operatória",
  "Saúde mental — acompanhamento",
  "Dermatite ocupacional",
  "Atestado de saúde",
  "Retorno pós-exame",
] as const;

export const MEDICAL_RECORD_SNIPPETS = [
  "Paciente estável, sem queixas ativas. Mantida conduta e orientações preventivas.",
  "Refere melhora dos sintomas. Exame físico sem alterações relevantes.",
  "Solicitados exames complementares. Retorno em 15 dias com resultados.",
  "Paciente orientado quanto a hábitos de vida. Prescrito tratamento sintomático.",
  "ASO realizado — apto para função. Encaminhado ao setor de RH da empresa.",
  "Teleconsulta realizada com boa adesão. Plano terapêutico ajustado.",
  "Exame dermatológico sem lesões suspeitas. Uso de EPI reforçado.",
  "PA 120/80 mmHg, FC 72 bpm. ECG dentro da normalidade para a idade.",
] as const;

export const BILLING_CYCLES = ["MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"] as const;
