import type { NicheId } from "../../src/lib/niche/types";
import type { CompanyStatus } from "../../src/lib/company-crm";
import type { SeedCompany } from "./companies";

export type NicheProcedureSeed = {
  code: string;
  name: string;
  category: string;
  serviceType: string;
  basePrice: number;
  tissCode?: string;
};

export type NicheCompanySeed = {
  name: string;
  cnpj: string;
  status: CompanyStatus;
  sector: string;
  beneficiaries: number;
  clinicalDiscount?: number;
};

export type NicheProviderSeed = {
  email: string;
  name: string;
  specialty: string;
  councilType?: string;
  councilNumber?: string;
  councilUf?: string;
  phone?: string;
};

export type NicheStarPatient = {
  name: string;
  cpf: string;
  email: string;
  birthDate: Date;
  phone: string;
  companyIndex: number;
};

export type NicheStarPet = {
  name: string;
  species: string;
  breed: string;
  size: string;
  tutorEmail: string;
  sex?: string;
  weightKg?: number;
};

export type NicheOperationalConfig = {
  niche: NicheId;
  slug: string;
  procedures: NicheProcedureSeed[];
  providers: NicheProviderSeed[];
  companies: NicheCompanySeed[];
  appointmentReasons: readonly string[];
  recordSnippets: readonly string[];
  starPatients: NicheStarPatient[];
  starPets?: NicheStarPet[];
  pjEmail: string;
  pjName: string;
  telemedicineRatio: number;
  sectorProfiles: Record<string, { procedureCodes: string[]; reasons: readonly string[] }>;
};

const VET_PROCEDURES: NicheProcedureSeed[] = [
  { code: "VET-CON", name: "Consulta Veterinária Geral", category: "CONSULTA", serviceType: "CLINICA", basePrice: 180 },
  { code: "VET-CON-ESP", name: "Consulta Especialista", category: "CONSULTA", serviceType: "CLINICA", basePrice: 320 },
  { code: "VET-RET", name: "Retorno / Reavaliação", category: "CONSULTA", serviceType: "CLINICA", basePrice: 95 },
  { code: "VET-EMER", name: "Atendimento Emergencial", category: "CONSULTA", serviceType: "EMERGENCIA", basePrice: 280 },
  { code: "VET-VAC", name: "Vacinação (V8/V10)", category: "SERVICO", serviceType: "PREVENTIVO", basePrice: 120 },
  { code: "VET-VERM", name: "Vermifugação", category: "SERVICO", serviceType: "PREVENTIVO", basePrice: 65 },
  { code: "VET-ANTP", name: "Antiparasitário (spot-on)", category: "SERVICO", serviceType: "PREVENTIVO", basePrice: 85 },
  { code: "VET-BAN", name: "Banho e Tosa (porte médio)", category: "SERVICO", serviceType: "ESTETICA", basePrice: 150 },
  { code: "VET-BAN-P", name: "Banho Simples (pequeno porte)", category: "SERVICO", serviceType: "ESTETICA", basePrice: 60 },
  { code: "VET-TOSA", name: "Tosa Higiênica", category: "SERVICO", serviceType: "ESTETICA", basePrice: 90 },
  { code: "VET-UNHA", name: "Corte de Unhas", category: "SERVICO", serviceType: "ESTETICA", basePrice: 40 },
  { code: "VET-EX-HMG", name: "Hemograma Veterinário", category: "EXAME", serviceType: "DIAGNOSTICO", basePrice: 95 },
  { code: "VET-EX-BIO", name: "Bioquímica Sérica", category: "EXAME", serviceType: "DIAGNOSTICO", basePrice: 140 },
  { code: "VET-EX-RX", name: "Radiografia", category: "EXAME", serviceType: "DIAGNOSTICO", basePrice: 180 },
  { code: "VET-EX-US", name: "Ultrassonografia", category: "EXAME", serviceType: "DIAGNOSTICO", basePrice: 260 },
  { code: "VET-CIR-CAS", name: "Castração", category: "SERVICO", serviceType: "CIRURGIA", basePrice: 450 },
  { code: "VET-CIR-ODO", name: "Odontologia Veterinária", category: "SERVICO", serviceType: "CIRURGIA", basePrice: 380 },
  { code: "VET-INT-DIA", name: "Internação (diária)", category: "SESSAO", serviceType: "INTERNACAO", basePrice: 220 },
  { code: "VET-HIDR", name: "Fluidoterapia", category: "SESSAO", serviceType: "INTERNACAO", basePrice: 120 },
];

const DENTAL_PROCEDURES: NicheProcedureSeed[] = [
  { code: "DEN-CON", name: "Consulta Odontológica", category: "CONSULTA", serviceType: "CLINICA", basePrice: 350 },
  { code: "DEN-LIM", name: "Limpeza e Profilaxia", category: "SERVICO", serviceType: "PREVENTIVO", basePrice: 280 },
  { code: "DEN-RX", name: "Radiografia Panorâmica", category: "EXAME", serviceType: "DIAGNOSTICO", basePrice: 150 },
  { code: "DEN-RX-PER", name: "Radiografia Periapical", category: "EXAME", serviceType: "DIAGNOSTICO", basePrice: 80 },
  { code: "DEN-REST", name: "Restauração em Resina", category: "SERVICO", serviceType: "RESTAURADOR", basePrice: 320 },
  { code: "DEN-CAN", name: "Tratamento de Canal", category: "SERVICO", serviceType: "ENDODONTIA", basePrice: 850 },
  { code: "DEN-EXT", name: "Extração Simples", category: "SERVICO", serviceType: "CIRURGIA", basePrice: 280 },
  { code: "DEN-CLR", name: "Clareamento Dental", category: "SERVICO", serviceType: "ESTETICA", basePrice: 1200 },
  { code: "DEN-APAR", name: "Manutenção de Aparelho", category: "SESSAO", serviceType: "ORTODONTIA", basePrice: 220 },
  { code: "DEN-PROT", name: "Prótese — Coroa Cerâmica", category: "SERVICO", serviceType: "PROTESE", basePrice: 1800 },
  { code: "DEN-ODP", name: "Odontopediatria — Consulta", category: "CONSULTA", serviceType: "PEDIATRIA", basePrice: 300 },
  { code: "DEN-PER", name: "Periodontia — Raspagem", category: "SERVICO", serviceType: "PERIODONTIA", basePrice: 450 },
  { code: "DEN-IMP", name: "Implante — Avaliação", category: "CONSULTA", serviceType: "IMPLANTODONTIA", basePrice: 400 },
  { code: "DEN-CIR", name: "Cirurgia Oral Menor", category: "SERVICO", serviceType: "CIRURGIA", basePrice: 650 },
  { code: "DEN-RET", name: "Retorno Pós-procedimento", category: "CONSULTA", serviceType: "CLINICA", basePrice: 120 },
];

const LEGAL_PROCEDURES: NicheProcedureSeed[] = [
  { code: "LEG-CON", name: "Consulta Jurídica Inicial", category: "CONSULTA", serviceType: "JURIDICO", basePrice: 350 },
  { code: "LEG-HT", name: "Hora Técnica Jurídica", category: "SESSAO", serviceType: "JURIDICO", basePrice: 500 },
  { code: "LEG-PAR", name: "Parecer Jurídico", category: "SERVICO", serviceType: "JURIDICO", basePrice: 600 },
  { code: "LEG-CONT", name: "Revisão de Contrato", category: "SERVICO", serviceType: "CONTRATUAL", basePrice: 480 },
  { code: "LEG-TRAB", name: "Direito Trabalhista — Consulta", category: "CONSULTA", serviceType: "TRABALHISTA", basePrice: 420 },
  { code: "LEG-CML", name: "Direito Empresarial", category: "CONSULTA", serviceType: "EMPRESARIAL", basePrice: 550 },
  { code: "LEG-FAM", name: "Direito de Família", category: "CONSULTA", serviceType: "FAMILIA", basePrice: 400 },
  { code: "LEG-IMOB", name: "Direito Imobiliário", category: "CONSULTA", serviceType: "IMOBILIARIO", basePrice: 450 },
  { code: "LEG-MED", name: "Mediação / Conciliação", category: "SESSAO", serviceType: "ALTERNATIVO", basePrice: 380 },
  { code: "LEG-DUE", name: "Due Diligence Básica", category: "SERVICO", serviceType: "EMPRESARIAL", basePrice: 2500 },
  { code: "LEG-LGPD", name: "Consultoria LGPD", category: "SERVICO", serviceType: "COMPLIANCE", basePrice: 800 },
  { code: "LEG-PRO", name: "Audiência — Preparação", category: "SESSAO", serviceType: "PROCESSUAL", basePrice: 650 },
  { code: "LEG-RET", name: "Retorno Processual", category: "CONSULTA", serviceType: "JURIDICO", basePrice: 280 },
];

const SPA_PROCEDURES: NicheProcedureSeed[] = [
  { code: "SPA-MSG", name: "Massagem Relaxante (60min)", category: "SESSAO", serviceType: "SPA", basePrice: 180 },
  { code: "SPA-DEP", name: "Massagem Desportiva (60min)", category: "SESSAO", serviceType: "SPA", basePrice: 200 },
  { code: "SPA-DREN", name: "Drenagem Linfática", category: "SESSAO", serviceType: "SPA", basePrice: 190 },
  { code: "SPA-REF", name: "Reflexologia Podal", category: "SESSAO", serviceType: "SPA", basePrice: 150 },
  { code: "SPA-HOT", name: "Pedras Quentes", category: "SESSAO", serviceType: "SPA", basePrice: 220 },
  { code: "SPA-FAC", name: "Tratamento Facial", category: "SERVICO", serviceType: "ESTETICA", basePrice: 220 },
  { code: "SPA-ARO", name: "Aromaterapia", category: "SESSAO", serviceType: "WELLNESS", basePrice: 130 },
  { code: "SPA-YOG", name: "Aula de Yoga", category: "SESSAO", serviceType: "WELLNESS", basePrice: 120 },
  { code: "SPA-PIL", name: "Pilates Individual", category: "SESSAO", serviceType: "WELLNESS", basePrice: 160 },
  { code: "SPA-SAUN", name: "Sauna + Hidromassagem", category: "SESSAO", serviceType: "SPA", basePrice: 140 },
  { code: "SPA-PAC", name: "Day Spa — Pacote Completo", category: "SERVICO", serviceType: "PACOTE", basePrice: 480 },
  { code: "SPA-MAN", name: "Manicure + Pedicure Spa", category: "SERVICO", serviceType: "ESTETICA", basePrice: 110 },
  { code: "SPA-CORP", name: "Massagem Corporativa (in company)", category: "SESSAO", serviceType: "B2B", basePrice: 350 },
];

const EDUCATION_PROCEDURES: NicheProcedureSeed[] = [
  { code: "EDU-AUL", name: "Aula Particular (60min)", category: "SESSAO", serviceType: "EDUCACAO", basePrice: 150 },
  { code: "EDU-MEN", name: "Mentoria Individual", category: "SESSAO", serviceType: "MENTORIA", basePrice: 200 },
  { code: "EDU-WKS", name: "Workshop Corporativo (4h)", category: "SERVICO", serviceType: "CAPACITACAO", basePrice: 800 },
  { code: "EDU-ING", name: "Inglês — Conversação", category: "SESSAO", serviceType: "IDIOMAS", basePrice: 170 },
  { code: "EDU-MAT", name: "Reforço Matemática", category: "SESSAO", serviceType: "EDUCACAO", basePrice: 140 },
  { code: "EDU-CAR", name: "Coaching de Carreira", category: "SESSAO", serviceType: "MENTORIA", basePrice: 250 },
  { code: "EDU-CERT", name: "Preparatório Certificação", category: "SESSAO", serviceType: "CAPACITACAO", basePrice: 220 },
  { code: "EDU-TEA", name: "Treinamento de Equipe (4h)", category: "SERVICO", serviceType: "CAPACITACAO", basePrice: 1200 },
  { code: "EDU-WEB", name: "Webinar ao Vivo", category: "SESSAO", serviceType: "DIGITAL", basePrice: 180 },
  { code: "EDU-ONB", name: "Onboarding Corporativo", category: "SERVICO", serviceType: "RH", basePrice: 950 },
  { code: "EDU-ID", name: "Avaliação de Nivelamento", category: "CONSULTA", serviceType: "IDIOMAS", basePrice: 90 },
  { code: "EDU-CUR", name: "Curso Intensivo (8h)", category: "SERVICO", serviceType: "CAPACITACAO", basePrice: 650 },
  { code: "EDU-RET", name: "Acompanhamento Pedagógico", category: "SESSAO", serviceType: "EDUCACAO", basePrice: 130 },
];

const CONSTRUCTION_PROCEDURES: NicheProcedureSeed[] = [
  { code: "ENG-VIS", name: "Vistoria Técnica Inicial", category: "CONSULTA", serviceType: "ENGENHARIA", basePrice: 450 },
  { code: "ENG-HT", name: "Hora Técnica de Engenheiro", category: "SESSAO", serviceType: "ENGENHARIA", basePrice: 350 },
  { code: "ENG-LAU", name: "Laudo Estrutural", category: "SERVICO", serviceType: "ENGENHARIA", basePrice: 2500 },
  { code: "ENG-ART", name: "Emissão de ART", category: "SERVICO", serviceType: "ENGENHARIA", basePrice: 180 },
  { code: "ENG-FIS", name: "Fiscalização de Obra (mensal)", category: "SESSAO", serviceType: "ENGENHARIA", basePrice: 3200 },
  { code: "ENG-PROJ", name: "Projeto Arquitetônico (m²)", category: "SERVICO", serviceType: "ENGENHARIA", basePrice: 85 },
  { code: "ENG-INS", name: "Inspeção Predial", category: "SERVICO", serviceType: "ENGENHARIA", basePrice: 1800 },
  { code: "ENG-ORC", name: "Orçamento de Reforma", category: "SERVICO", serviceType: "ENGENHARIA", basePrice: 950 },
  { code: "ENG-TOP", name: "Topografia / Levantamento", category: "SERVICO", serviceType: "ENGENHARIA", basePrice: 1200 },
  { code: "ENG-MAN", name: "Manutenção Predial (visita)", category: "CONSULTA", serviceType: "ENGENHARIA", basePrice: 380 },
  { code: "ENG-RET", name: "Retorno Vistoria Técnica", category: "CONSULTA", serviceType: "ENGENHARIA", basePrice: 220 },
  { code: "ENG-PER", name: "Perícia Técnica Judicial", category: "SERVICO", serviceType: "ENGENHARIA", basePrice: 4500 },
];

export const NICHE_BENEFIT_PRODUCTS = {
  VET: {
    AUXILIO_PET: { billingCycle: "MENSAL" as const, amount: 89.9, description: "Auxílio pet — crédito Pay Per Use mensal" },
    PLANO_PREVENTIVO: { billingCycle: "TRIMESTRAL" as const, amount: 249.9, description: "Pacote preventivo — vacinas e vermífugo" },
  },
  DENTAL: {
    ODONTO_CORP: { billingCycle: "MENSAL" as const, amount: 59.9, description: "Odontologia corporativa — limpeza anual inclusa" },
    CLAREAMENTO: { billingCycle: "SEMESTRAL" as const, amount: 399.9, description: "Programa clareamento — acompanhamento semestral" },
  },
  LEGAL: {
    ASSIST_JUR: { billingCycle: "MENSAL" as const, amount: 149.9, description: "Assistência jurídica — horas técnicas inclusas" },
    COMPLIANCE: { billingCycle: "TRIMESTRAL" as const, amount: 449.9, description: "Pacote compliance + LGPD trimestral" },
  },
  SPA: {
    WELLNESS: { billingCycle: "MENSAL" as const, amount: 79.9, description: "Wellness corporativo — sessões mensais" },
    DAY_SPA: { billingCycle: "TRIMESTRAL" as const, amount: 299.9, description: "Day spa trimestral — pacote completo" },
  },
  EDUCATION: {
    EDUCORP: { billingCycle: "MENSAL" as const, amount: 99.9, description: "Educação corporativa — crédito de aulas" },
    IDIOMAS: { billingCycle: "MENSAL" as const, amount: 129.9, description: "Inglês corporativo — aulas mensais" },
  },
  CONSTRUCTION: {
    MANUT_PRED: { billingCycle: "MENSAL" as const, amount: 199.9, description: "Manutenção predial — visitas técnicas mensais" },
    FISCAL_OBRA: { billingCycle: "TRIMESTRAL" as const, amount: 899.9, description: "Fiscalização de obra trimestral" },
  },
} as const;

export const NICHE_OPERATIONAL_CONFIGS: NicheOperationalConfig[] = [
  {
    niche: "VET",
    slug: "petcare",
    procedures: VET_PROCEDURES,
    providers: [
      { email: "dr.rafael@petcare.demo", name: "Dr. Rafael Mendes", specialty: "Clínica Geral Veterinária", councilType: "CRMV", councilNumber: "12345", councilUf: "SP", phone: "(11) 3456-9001" },
      { email: "dra.ana@petcare.demo", name: "Dra. Ana Costa", specialty: "Cirurgia Veterinária", councilType: "CRMV", councilNumber: "23456", councilUf: "SP", phone: "(11) 3456-9002" },
      { email: "groomer.lu@petcare.demo", name: "Luciana Tosadora", specialty: "Estética Pet", phone: "(11) 3456-9003" },
    ],
    companies: [
      { name: "TechPet Benefícios", cnpj: "11.100.200/0001-01", status: "ATIVO", sector: "Tecnologia", beneficiaries: 8, clinicalDiscount: 0.9 },
      { name: "RetailPet Varejo", cnpj: "11.200.300/0001-02", status: "ATIVO", sector: "Varejo", beneficiaries: 6 },
      { name: "AgroPet Cooperativa", cnpj: "11.300.400/0001-03", status: "ATIVO", sector: "Agronegócio", beneficiaries: 5 },
      { name: "Indústria PetFood", cnpj: "11.400.500/0001-04", status: "ATIVO", sector: "Indústria", beneficiaries: 7, clinicalDiscount: 0.85 },
      { name: "Startup PetTech", cnpj: "11.500.600/0001-05", status: "NEGOCIACAO", sector: "HealthTech", beneficiaries: 0 },
      { name: "Hotelaria Pet Friendly", cnpj: "11.600.700/0001-06", status: "ATIVO", sector: "Hospitalidade", beneficiaries: 4 },
      { name: "Financeira PetCorp", cnpj: "11.700.800/0001-07", status: "ATIVO", sector: "Financeiro", beneficiaries: 5 },
      { name: "Construtora Pet Park", cnpj: "11.800.900/0001-08", status: "PROPOSTA", sector: "Construção Civil", beneficiaries: 0 },
    ],
    appointmentReasons: [
      "Consulta de rotina — Thor (Golden Retriever)",
      "Vacinação anual — Luna (SRD)",
      "Banho e tosa — Bob (Poodle)",
      "Retorno pós-cirurgia — Mel (Persa)",
      "Emergência — vômito — Max (Labrador)",
      "Check-up preventivo — Nina (Gato)",
      "Castração — agendamento",
      "Exame de rotina — Rex (Pastor Alemão)",
      "Tosa higiênica — Pipoca (Shih Tzu)",
      "Vermifugação — Mia (Bulldog)",
      "Ultrassom abdominal — Simba (Maine Coon)",
      "Retorno vacinal — Zeus (Husky)",
    ],
    recordSnippets: [
      "Pet estável, mucosas rosadas, hidratado. Tutor orientado sobre vermifugação trimestral.",
      "Vacina V10 aplicada sem intercorrências. Próxima dose em 12 meses.",
      "Banho e tosa realizados. Pelagem desembaraçada, unhas cortadas.",
      "Castração eletiva realizada. Tutor recebeu orientações pós-operatórias por escrito.",
      "Hemograma dentro da normalidade. Conduta expectante, retorno em 30 dias.",
      "Emergência atendida — fluidoterapia iniciada. Pet estável para alta.",
      "Radiografia sem alterações significativas. Prescrito analgésico por 5 dias.",
      "Pet apresenta melhora clínica. Mantida dieta e medicação prescrita.",
    ],
    starPatients: [
      {
        name: "Carlos Mendes",
        cpf: "111.333.555-77",
        email: "tutor@petcare.demo",
        birthDate: new Date(1985, 3, 12),
        phone: "(11) 98765-4321",
        companyIndex: 1,
      },
      {
        name: "Fernanda Lima",
        cpf: "222.444.666-88",
        email: "fernanda.tutor@petcare.demo",
        birthDate: new Date(1990, 7, 22),
        phone: "(11) 97654-3210",
        companyIndex: 2,
      },
    ],
    starPets: [
      { name: "Thor", species: "CANINO", breed: "Golden Retriever", size: "GRANDE", tutorEmail: "tutor@petcare.demo", sex: "M", weightKg: 32 },
      { name: "Luna", species: "FELINO", breed: "SRD", size: "PEQUENO", tutorEmail: "tutor@petcare.demo", sex: "F", weightKg: 4.2 },
      { name: "Bob", species: "CANINO", breed: "Poodle", size: "PEQUENO", tutorEmail: "fernanda.tutor@petcare.demo", sex: "M", weightKg: 6.5 },
      { name: "Mel", species: "FELINO", breed: "Persa", size: "MEDIO", tutorEmail: "fernanda.tutor@petcare.demo", sex: "F", weightKg: 5.1 },
    ],
    pjEmail: "rh@techpet.demo",
    pjName: "RH TechPet",
    telemedicineRatio: 0.05,
    sectorProfiles: {
      Tecnologia: { procedureCodes: ["VET-CON", "VET-VAC", "VET-BAN", "VET-ANTP"], reasons: ["Consulta de rotina", "Vacinação anual", "Check-up preventivo"] },
      Varejo: { procedureCodes: ["VET-BAN", "VET-TOSA", "VET-UNHA", "VET-CON"], reasons: ["Banho e tosa", "Tosa higiênica", "Consulta de rotina"] },
      Indústria: { procedureCodes: ["VET-CON", "VET-VAC", "VET-VERM", "VET-EX-HMG"], reasons: ["Vacinação anual", "Exame de rotina", "Vermifugação"] },
      Agronegócio: { procedureCodes: ["VET-CON", "VET-VAC", "VET-EX-RX", "VET-RET"], reasons: ["Consulta de rotina", "Retorno vacinal", "Exame de rotina"] },
      Financeiro: { procedureCodes: ["VET-CON-ESP", "VET-EX-US", "VET-CIR-CAS", "VET-EMER"], reasons: ["Consulta especialista", "Emergência", "Castração — agendamento"] },
      Hospitalidade: { procedureCodes: ["VET-BAN-P", "VET-BAN", "VET-TOSA", "VET-CON"], reasons: ["Banho e tosa", "Tosa higiênica", "Consulta de rotina"] },
    },
  },
  {
    niche: "DENTAL",
    slug: "smile",
    procedures: DENTAL_PROCEDURES,
    providers: [
      { email: "dra.camila@smile.demo", name: "Dra. Camila Rocha", specialty: "Odontologia Geral", councilType: "CRO", councilNumber: "12345", councilUf: "SP", phone: "(11) 3456-9101" },
      { email: "dr.marcos@smile.demo", name: "Dr. Marcos Alves", specialty: "Endodontia", councilType: "CRO", councilNumber: "23456", councilUf: "SP", phone: "(11) 3456-9102" },
      { email: "dra.julia@smile.demo", name: "Dra. Júlia Ferreira", specialty: "Ortodontia", councilType: "CRO", councilNumber: "34567", councilUf: "RJ", phone: "(21) 3456-9103" },
    ],
    companies: [
      { name: "CorpOdonto Benefícios", cnpj: "22.100.200/0001-01", status: "ATIVO", sector: "Tecnologia", beneficiaries: 10, clinicalDiscount: 0.88 },
      { name: "Financeira SmileCorp", cnpj: "22.200.300/0001-02", status: "ATIVO", sector: "Financeiro", beneficiaries: 8 },
      { name: "Indústria MetalSul", cnpj: "22.300.400/0001-03", status: "ATIVO", sector: "Indústria", beneficiaries: 12, clinicalDiscount: 0.85 },
      { name: "Varejo MaxDental", cnpj: "22.400.500/0001-04", status: "ATIVO", sector: "Varejo", beneficiaries: 6 },
      { name: "EduTech Ensino", cnpj: "22.500.600/0001-05", status: "ATIVO", sector: "Educação", beneficiaries: 7 },
      { name: "Logística Express", cnpj: "22.600.700/0001-06", status: "NEGOCIACAO", sector: "Logística", beneficiaries: 0 },
      { name: "Construtora Horizonte", cnpj: "22.700.800/0001-07", status: "ATIVO", sector: "Construção Civil", beneficiaries: 9 },
      { name: "Startup Health Inno", cnpj: "22.800.900/0001-08", status: "LEAD", sector: "HealthTech", beneficiaries: 0 },
    ],
    appointmentReasons: [
      "Consulta odontológica de rotina",
      "Limpeza e profilaxia semestral",
      "Dor de dente — urgência",
      "Manutenção de aparelho ortodôntico",
      "Retorno pós-canal",
      "Avaliação para implante",
      "Clareamento dental — consulta inicial",
      "Extração — agendamento",
      "Odontopediatria — primeira consulta",
      "Periodontia — raspagem",
      "Radiografia panorâmica",
      "Retorno pós-restauração",
    ],
    recordSnippets: [
      "Paciente sem queixas álgicas. Exame clínico dentro da normalidade. Orientada higiene bucal.",
      "Profilaxia realizada. Gengivas levemente inflamadas — reforçada escovação interdental.",
      "Tratamento de canal concluído. Restauração provisória. Retorno em 7 dias.",
      "Radiografia sem lesões periapicais. Conduta conservadora mantida.",
      "Aparelho ortodôntico ajustado. Próxima manutenção em 30 dias.",
      "Extração simples sem intercorrências. Orientações pós-operatórias fornecidas.",
      "Avaliação para implante — osso adequado. Encaminhado para planejamento.",
      "Clareamento iniciado. Sensibilidade leve — uso de gel desensibilizante orientado.",
    ],
    starPatients: [
      {
        name: "Patricia Souza",
        cpf: "333.555.777-99",
        email: "paciente@smile.demo",
        birthDate: new Date(1988, 1, 15),
        phone: "(11) 96543-2109",
        companyIndex: 1,
      },
      {
        name: "Roberto Dias",
        cpf: "444.666.888-00",
        email: "roberto.dental@smile.demo",
        birthDate: new Date(1975, 10, 3),
        phone: "(11) 95432-1098",
        companyIndex: 3,
      },
    ],
    pjEmail: "rh@corpodont.demo",
    pjName: "RH CorpOdonto",
    telemedicineRatio: 0.08,
    sectorProfiles: {
      Tecnologia: { procedureCodes: ["DEN-CON", "DEN-LIM", "DEN-RX", "DEN-RET"], reasons: ["Consulta odontológica de rotina", "Limpeza e profilaxia semestral"] },
      Financeiro: { procedureCodes: ["DEN-CON", "DEN-CLR", "DEN-IMP", "DEN-REST"], reasons: ["Clareamento dental — consulta inicial", "Avaliação para implante"] },
      Indústria: { procedureCodes: ["DEN-CON", "DEN-LIM", "DEN-EXT", "DEN-RX-PER"], reasons: ["Consulta odontológica de rotina", "Extração — agendamento"] },
      Varejo: { procedureCodes: ["DEN-LIM", "DEN-REST", "DEN-CON", "DEN-RET"], reasons: ["Limpeza e profilaxia semestral", "Retorno pós-restauração"] },
      Educação: { procedureCodes: ["DEN-ODP", "DEN-CON", "DEN-APAR", "DEN-LIM"], reasons: ["Odontopediatria — primeira consulta", "Manutenção de aparelho ortodôntico"] },
      "Construção Civil": { procedureCodes: ["DEN-CON", "DEN-EXT", "DEN-CIR", "DEN-PER"], reasons: ["Dor de dente — urgência", "Periodontia — raspagem"] },
    },
  },
  {
    niche: "LEGAL",
    slug: "lex",
    procedures: LEGAL_PROCEDURES,
    providers: [
      { email: "dr.andre@lex.demo", name: "Dr. André Lex", specialty: "Direito Empresarial", councilType: "OAB", councilNumber: "123456", councilUf: "SP", phone: "(11) 3456-9201" },
      { email: "dra.beatriz@lex.demo", name: "Dra. Beatriz Nunes", specialty: "Direito Trabalhista", councilType: "OAB", councilNumber: "234567", councilUf: "SP", phone: "(11) 3456-9202" },
      { email: "dr.cesar@lex.demo", name: "Dr. César Oliveira", specialty: "Direito Civil e Família", councilType: "OAB", councilNumber: "345678", councilUf: "RJ", phone: "(21) 3456-9203" },
    ],
    companies: [
      { name: "AssJur Corp", cnpj: "33.100.200/0001-01", status: "ATIVO", sector: "Tecnologia", beneficiaries: 15, clinicalDiscount: 0.9 },
      { name: "Indústria MetalSul", cnpj: "33.200.300/0001-02", status: "ATIVO", sector: "Indústria", beneficiaries: 20, clinicalDiscount: 0.85 },
      { name: "Financeira Capital", cnpj: "33.300.400/0001-03", status: "ATIVO", sector: "Financeiro", beneficiaries: 12 },
      { name: "Varejo Nacional", cnpj: "33.400.500/0001-04", status: "ATIVO", sector: "Varejo", beneficiaries: 8 },
      { name: "Construtora Alpha", cnpj: "33.500.600/0001-05", status: "ATIVO", sector: "Construção Civil", beneficiaries: 18 },
      { name: "Logística Express", cnpj: "33.600.700/0001-06", status: "NEGOCIACAO", sector: "Logística", beneficiaries: 0 },
      { name: "AgroTech Cooperativa", cnpj: "33.700.800/0001-07", status: "ATIVO", sector: "Agronegócio", beneficiaries: 6 },
      { name: "Startup LegalTech", cnpj: "33.800.900/0001-08", status: "PROPOSTA", sector: "HealthTech", beneficiaries: 0 },
    ],
    appointmentReasons: [
      "Consulta trabalhista — rescisão",
      "Revisão de contrato de prestação de serviços",
      "Parecer sobre compliance LGPD",
      "Mediação — conflito societário",
      "Consulta imobiliária — locação comercial",
      "Due diligence — aquisição",
      "Direito de família — inventário",
      "Retorno processual — audiência",
      "Consulta empresarial — contrato social",
      "Hora técnica — parecer tributário",
      "Consulta inicial — assessoria geral",
      "Preparação para audiência trabalhista",
    ],
    recordSnippets: [
      "Cliente orientado sobre prazos prescricionais. Documentação solicitada para análise.",
      "Parecer jurídico elaborado. Riscos mapeados e alternativas apresentadas.",
      "Contrato revisado — cláusulas de rescisão ajustadas conforme solicitado.",
      "Mediação realizada com acordo parcial. Próxima sessão agendada.",
      "Due diligence concluída. Relatório entregue ao departamento jurídico do cliente.",
      "Consulta trabalhista — verbas rescisórias calculadas. Orientação sobre acordo.",
      "Consultoria LGPD — mapeamento de dados pessoais iniciado.",
      "Retorno processual — petição protocolada. Cliente informado sobre andamento.",
    ],
    starPatients: [
      {
        name: "Mariana Costa",
        cpf: "555.777.999-11",
        email: "cliente@lex.demo",
        birthDate: new Date(1982, 5, 8),
        phone: "(11) 94321-0987",
        companyIndex: 1,
      },
      {
        name: "Eduardo Prado",
        cpf: "666.888.000-22",
        email: "eduardo.lex@lex.demo",
        birthDate: new Date(1978, 11, 20),
        phone: "(11) 93210-9876",
        companyIndex: 3,
      },
    ],
    pjEmail: "rh@assjur.demo",
    pjName: "RH AssJur",
    telemedicineRatio: 0.55,
    sectorProfiles: {
      Tecnologia: { procedureCodes: ["LEG-LGPD", "LEG-CONT", "LEG-CML", "LEG-HT"], reasons: ["Parecer sobre compliance LGPD", "Revisão de contrato de prestação de serviços"] },
      Indústria: { procedureCodes: ["LEG-TRAB", "LEG-PRO", "LEG-PAR", "LEG-CON"], reasons: ["Consulta trabalhista — rescisão", "Preparação para audiência trabalhista"] },
      Financeiro: { procedureCodes: ["LEG-DUE", "LEG-CML", "LEG-CONT", "LEG-PAR"], reasons: ["Due diligence — aquisição", "Consulta empresarial — contrato social"] },
      Varejo: { procedureCodes: ["LEG-CON", "LEG-TRAB", "LEG-IMOB", "LEG-RET"], reasons: ["Consulta inicial — assessoria geral", "Consulta imobiliária — locação comercial"] },
      "Construção Civil": { procedureCodes: ["LEG-TRAB", "LEG-IMOB", "LEG-CONT", "LEG-MED"], reasons: ["Consulta trabalhista — rescisão", "Mediação — conflito societário"] },
      Agronegócio: { procedureCodes: ["LEG-CON", "LEG-IMOB", "LEG-FAM", "LEG-HT"], reasons: ["Consulta imobiliária — locação comercial", "Direito de família — inventário"] },
    },
  },
  {
    niche: "SPA",
    slug: "zen",
    procedures: SPA_PROCEDURES,
    providers: [
      { email: "instrutora.lia@zen.demo", name: "Lia Martins", specialty: "Massoterapia", phone: "(11) 3456-9301" },
      { email: "prof.yoga@zen.demo", name: "Paula Yoga", specialty: "Yoga e Wellness", phone: "(11) 3456-9302" },
      { email: "esteta.ra@zen.demo", name: "Raquel Esteta", specialty: "Estética Facial", phone: "(11) 3456-9303" },
    ],
    companies: [
      { name: "WellCorp Benefícios", cnpj: "44.100.200/0001-01", status: "ATIVO", sector: "Tecnologia", beneficiaries: 12, clinicalDiscount: 0.9 },
      { name: "Financeira ZenBank", cnpj: "44.200.300/0001-02", status: "ATIVO", sector: "Financeiro", beneficiaries: 10 },
      { name: "Indústria BemEstar", cnpj: "44.300.400/0001-03", status: "ATIVO", sector: "Indústria", beneficiaries: 15, clinicalDiscount: 0.88 },
      { name: "Hotelaria Azul", cnpj: "44.400.500/0001-04", status: "ATIVO", sector: "Hospitalidade", beneficiaries: 8 },
      { name: "Varejo FitLife", cnpj: "44.500.600/0001-05", status: "ATIVO", sector: "Varejo", beneficiaries: 6 },
      { name: "Startup Wellness", cnpj: "44.600.700/0001-06", status: "NEGOCIACAO", sector: "HealthTech", beneficiaries: 0 },
      { name: "EduTech Ensino", cnpj: "44.700.800/0001-07", status: "ATIVO", sector: "Educação", beneficiaries: 9 },
      { name: "Construtora Relax", cnpj: "44.800.900/0001-08", status: "PROPOSTA", sector: "Construção Civil", beneficiaries: 0 },
    ],
    appointmentReasons: [
      "Massagem relaxante — alívio de estresse",
      "Day spa — pacote completo",
      "Yoga — aula individual",
      "Drenagem linfática pós-viagem",
      "Massagem corporativa in company",
      "Tratamento facial — hidratação",
      "Reflexologia — sessão semanal",
      "Pilates — avaliação inicial",
      "Pedras quentes — sessão terapêutica",
      "Sauna + hidromassagem",
      "Aromaterapia — relaxamento",
      "Retorno — acompanhamento wellness",
    ],
    recordSnippets: [
      "Sessão realizada com boa adesão. Cliente relatou redução de tensão muscular.",
      "Massagem desportiva — foco em trapézio e lombar. Orientações de alongamento.",
      "Tratamento facial concluído. Pele hidratada, sem reações adversas.",
      "Yoga — sequência adaptada para iniciante. Prática domiciliar orientada.",
      "Day spa — pacote completo. Cliente satisfeita com experiência.",
      "Drenagem linfática — edema reduzido. Próxima sessão em 7 dias.",
      "Massagem corporativa in company — 8 colaboradores atendidos.",
      "Reflexologia — pontos de tensão identificados. Retorno agendado.",
    ],
    starPatients: [
      {
        name: "Juliana Ribeiro",
        cpf: "777.999.111-33",
        email: "cliente@zen.demo",
        birthDate: new Date(1992, 8, 25),
        phone: "(11) 92109-8765",
        companyIndex: 1,
      },
      {
        name: "Marcos Vieira",
        cpf: "888.000.222-44",
        email: "marcos.zen@zen.demo",
        birthDate: new Date(1980, 2, 14),
        phone: "(11) 91098-7654",
        companyIndex: 3,
      },
    ],
    pjEmail: "rh@wellcorp.demo",
    pjName: "RH WellCorp",
    telemedicineRatio: 0.15,
    sectorProfiles: {
      Tecnologia: { procedureCodes: ["SPA-MSG", "SPA-YOG", "SPA-FAC", "SPA-CORP"], reasons: ["Massagem relaxante — alívio de estresse", "Massagem corporativa in company"] },
      Financeiro: { procedureCodes: ["SPA-MSG", "SPA-PAC", "SPA-DREN", "SPA-HOT"], reasons: ["Day spa — pacote completo", "Drenagem linfática pós-viagem"] },
      Indústria: { procedureCodes: ["SPA-CORP", "SPA-DEP", "SPA-REF", "SPA-MSG"], reasons: ["Massagem corporativa in company", "Massagem desportiva"] },
      Hospitalidade: { procedureCodes: ["SPA-PAC", "SPA-SAUN", "SPA-FAC", "SPA-ARO"], reasons: ["Day spa — pacote completo", "Sauna + hidromassagem"] },
      Varejo: { procedureCodes: ["SPA-MSG", "SPA-MAN", "SPA-FAC", "SPA-YOG"], reasons: ["Massagem relaxante — alívio de estresse", "Tratamento facial — hidratação"] },
      Educação: { procedureCodes: ["SPA-YOG", "SPA-PIL", "SPA-MSG", "SPA-ARO"], reasons: ["Yoga — aula individual", "Pilates — avaliação inicial"] },
    },
  },
  {
    niche: "EDUCATION",
    slug: "eduprime",
    procedures: EDUCATION_PROCEDURES,
    providers: [
      { email: "prof.marcos@eduprime.demo", name: "Prof. Marcos Silva", specialty: "Matemática e Física", phone: "(11) 3456-9401" },
      { email: "prof.ana@eduprime.demo", name: "Prof. Ana Beatriz", specialty: "Inglês e Idiomas", phone: "(11) 3456-9402" },
      { email: "coach.ric@eduprime.demo", name: "Ricardo Coach", specialty: "Coaching e Mentoria", phone: "(11) 3456-9403" },
    ],
    companies: [
      { name: "EduCorp Capacitação", cnpj: "55.100.200/0001-01", status: "ATIVO", sector: "Tecnologia", beneficiaries: 20, clinicalDiscount: 0.9 },
      { name: "Financeira LearnBank", cnpj: "55.200.300/0001-02", status: "ATIVO", sector: "Financeiro", beneficiaries: 15 },
      { name: "Indústria SkillUp", cnpj: "55.300.400/0001-03", status: "ATIVO", sector: "Indústria", beneficiaries: 25, clinicalDiscount: 0.85 },
      { name: "Varejo EduMax", cnpj: "55.400.500/0001-04", status: "ATIVO", sector: "Varejo", beneficiaries: 10 },
      { name: "EduTech Ensino", cnpj: "55.500.600/0001-05", status: "ATIVO", sector: "Educação", beneficiaries: 18 },
      { name: "Logística Express", cnpj: "55.600.700/0001-06", status: "NEGOCIACAO", sector: "Logística", beneficiaries: 0 },
      { name: "AgroTech Cooperativa", cnpj: "55.700.800/0001-07", status: "ATIVO", sector: "Agronegócio", beneficiaries: 8 },
      { name: "Startup EdTech", cnpj: "55.800.900/0001-08", status: "LEAD", sector: "HealthTech", beneficiaries: 0 },
    ],
    appointmentReasons: [
      "Aula particular — reforço matemática",
      "Inglês — conversação intermediário",
      "Mentoria de carreira — transição",
      "Workshop corporativo — liderança",
      "Preparatório certificação AWS",
      "Onboarding — novos colaboradores",
      "Coaching — desenvolvimento pessoal",
      "Avaliação de nivelamento — idiomas",
      "Treinamento de equipe — vendas",
      "Webinar — compliance",
      "Curso intensivo — Excel avançado",
      "Acompanhamento pedagógico — retorno",
    ],
    recordSnippets: [
      "Aula realizada — conteúdo de equações do 2º grau. Exercícios para casa enviados.",
      "Conversação em inglês — nível B1 confirmado. Plano de estudos personalizado.",
      "Mentoria — objetivos de carreira definidos. Próxima sessão em 15 dias.",
      "Workshop corporativo concluído — 12 participantes. Material de apoio entregue.",
      "Preparatório certificação — simulado realizado. Pontos de melhoria mapeados.",
      "Onboarding — módulo 1 concluído. Feedback positivo dos participantes.",
      "Treinamento de equipe — role-play de vendas. Gravação disponível no portal.",
      "Avaliação de nivelamento — aluno encaminhado para turma intermediária.",
    ],
    starPatients: [
      {
        name: "Lucas Ferreira",
        cpf: "999.111.333-55",
        email: "aluno@eduprime.demo",
        birthDate: new Date(1995, 4, 18),
        phone: "(11) 90987-6543",
        companyIndex: 1,
      },
      {
        name: "Camila Torres",
        cpf: "000.222.444-66",
        email: "camila.edu@eduprime.demo",
        birthDate: new Date(1987, 9, 7),
        phone: "(11) 89876-5432",
        companyIndex: 3,
      },
    ],
    pjEmail: "rh@educorp.demo",
    pjName: "RH EduCorp",
    telemedicineRatio: 0.7,
    sectorProfiles: {
      Tecnologia: { procedureCodes: ["EDU-CERT", "EDU-WKS", "EDU-MEN", "EDU-AUL"], reasons: ["Preparatório certificação AWS", "Workshop corporativo — liderança"] },
      Financeiro: { procedureCodes: ["EDU-CAR", "EDU-ING", "EDU-MEN", "EDU-WEB"], reasons: ["Mentoria de carreira — transição", "Inglês — conversação intermediário"] },
      Indústria: { procedureCodes: ["EDU-TEA", "EDU-ONB", "EDU-WKS", "EDU-AUL"], reasons: ["Treinamento de equipe — vendas", "Onboarding — novos colaboradores"] },
      Varejo: { procedureCodes: ["EDU-AUL", "EDU-MAT", "EDU-RET", "EDU-CUR"], reasons: ["Aula particular — reforço matemática", "Curso intensivo — Excel avançado"] },
      Educação: { procedureCodes: ["EDU-WKS", "EDU-WEB", "EDU-ID", "EDU-MEN"], reasons: ["Workshop corporativo — liderança", "Avaliação de nivelamento — idiomas"] },
      Agronegócio: { procedureCodes: ["EDU-AUL", "EDU-CUR", "EDU-TEA", "EDU-RET"], reasons: ["Aula particular — reforço matemática", "Acompanhamento pedagógico — retorno"] },
    },
  },
  {
    niche: "CONSTRUCTION",
    slug: "build",
    procedures: CONSTRUCTION_PROCEDURES,
    providers: [
      { email: "eng.carlos@build.demo", name: "Eng. Carlos Mendes", specialty: "Engenharia Civil", councilType: "CREA", councilNumber: "123456", councilUf: "SP", phone: "(11) 3456-9501" },
      { email: "arq.maria@build.demo", name: "Arq. Maria Santos", specialty: "Arquitetura", councilType: "CAU", councilNumber: "A234567", councilUf: "SP", phone: "(11) 3456-9502" },
      { email: "eng.paulo@build.demo", name: "Eng. Paulo Ribeiro", specialty: "Estruturas", councilType: "CREA", councilNumber: "345678", councilUf: "RJ", phone: "(21) 3456-9503" },
    ],
    companies: [
      { name: "Incorp Alpha", cnpj: "66.100.200/0001-01", status: "ATIVO", sector: "Construção Civil", beneficiaries: 12, clinicalDiscount: 0.9 },
      { name: "TechBuild Corp", cnpj: "66.200.300/0001-02", status: "ATIVO", sector: "Tecnologia", beneficiaries: 8 },
      { name: "Financeira Imob", cnpj: "66.300.400/0001-03", status: "ATIVO", sector: "Financeiro", beneficiaries: 15 },
      { name: "Varejo Urbano", cnpj: "66.400.500/0001-04", status: "ATIVO", sector: "Varejo", beneficiaries: 6 },
      { name: "Indústria Steel", cnpj: "66.500.600/0001-05", status: "ATIVO", sector: "Indústria", beneficiaries: 20, clinicalDiscount: 0.85 },
      { name: "Logística Obra", cnpj: "66.600.700/0001-06", status: "NEGOCIACAO", sector: "Logística", beneficiaries: 0 },
      { name: "Hotelaria Premium", cnpj: "66.700.800/0001-07", status: "ATIVO", sector: "Hospitalidade", beneficiaries: 10 },
      { name: "Startup PropTech", cnpj: "66.800.900/0001-08", status: "PROPOSTA", sector: "HealthTech", beneficiaries: 0 },
    ],
    appointmentReasons: [
      "Vistoria técnica — reforma torre A",
      "Laudo estrutural — edifício comercial",
      "Fiscalização mensal — canteiro de obras",
      "Inspeção predial — entrega de chaves",
      "Orçamento de reforma — área comum",
      "Emissão de ART — projeto estrutural",
      "Topografia — levantamento do terreno",
      "Manutenção predial — infiltração",
      "Hora técnica — parecer de adequação",
      "Projeto arquitetônico — avaliação inicial",
      "Retorno vistoria — acompanhamento",
      "Reunião técnica — incorporadora",
    ],
    recordSnippets: [
      "Vistoria realizada. Fissuras superficiais identificadas — sem comprometimento estrutural.",
      "Laudo estrutural concluído. Recomendações de reforço documentadas.",
      "Fiscalização de obra — conformidade com projeto aprovado.",
      "Inspeção predial entregue. Pendências elétricas e hidráulicas listadas.",
      "Orçamento de reforma elaborado com composições de custo unitário.",
      "ART emitida e registrada no CREA-SP.",
      "Topografia concluída. Curvas de nível entregues em DWG/PDF.",
      "Manutenção predial — infiltração tratada com impermeabilização.",
    ],
    starPatients: [
      {
        name: "Fernando Costa",
        cpf: "661.222.333-44",
        email: "cliente@build.demo",
        birthDate: new Date(1985, 3, 12),
        phone: "(11) 98765-4321",
        companyIndex: 1,
      },
      {
        name: "Patricia Lima",
        cpf: "662.333.444-55",
        email: "patricia.build@build.demo",
        birthDate: new Date(1979, 7, 28),
        phone: "(11) 97654-3210",
        companyIndex: 3,
      },
    ],
    pjEmail: "rh@incorp.demo",
    pjName: "RH Incorp Alpha",
    telemedicineRatio: 0.05,
    sectorProfiles: {
      "Construção Civil": { procedureCodes: ["ENG-VIS", "ENG-FIS", "ENG-LAU", "ENG-ART"], reasons: ["Vistoria técnica — reforma torre A", "Fiscalização mensal — canteiro de obras"] },
      Tecnologia: { procedureCodes: ["ENG-INS", "ENG-MAN", "ENG-ORC", "ENG-HT"], reasons: ["Inspeção predial — entrega de chaves", "Manutenção predial — infiltração"] },
      Financeiro: { procedureCodes: ["ENG-PROJ", "ENG-LAU", "ENG-VIS", "ENG-TOP"], reasons: ["Projeto arquitetônico — avaliação inicial", "Laudo estrutural — edifício comercial"] },
      Indústria: { procedureCodes: ["ENG-FIS", "ENG-LAU", "ENG-ART", "ENG-VIS"], reasons: ["Fiscalização mensal — canteiro de obras", "Emissão de ART — projeto estrutural"] },
      Varejo: { procedureCodes: ["ENG-ORC", "ENG-MAN", "ENG-VIS", "ENG-INS"], reasons: ["Orçamento de reforma — área comum", "Vistoria técnica — reforma torre A"] },
      Hospitalidade: { procedureCodes: ["ENG-INS", "ENG-MAN", "ENG-ORC", "ENG-HT"], reasons: ["Inspeção predial — entrega de chaves", "Manutenção predial — infiltração"] },
    },
  },
];

export function nicheConfigBySlug(slug: string): NicheOperationalConfig | undefined {
  return NICHE_OPERATIONAL_CONFIGS.find((c) => c.slug === slug);
}

export function nicheConfigByNiche(niche: NicheId): NicheOperationalConfig | undefined {
  return NICHE_OPERATIONAL_CONFIGS.find((c) => c.niche === niche);
}

export function nicheSectorProfile(
  config: NicheOperationalConfig,
  sector: string,
): { procedureCodes: string[]; reasons: readonly string[] } {
  return config.sectorProfiles[sector] ?? {
    procedureCodes: config.procedures.slice(0, 4).map((p) => p.code),
    reasons: config.appointmentReasons,
  };
}

export function pickNicheProcedureCode(
  config: NicheOperationalConfig,
  companyIndex: number,
  companies: SeedCompany[],
  salt: number,
): string {
  const company = companies.find((c) => c.index === companyIndex);
  const profile = nicheSectorProfile(config, company?.sector ?? "");
  const codes = profile.procedureCodes.length > 0
    ? profile.procedureCodes
    : config.procedures.map((p) => p.code);
  return codes[salt % codes.length]!;
}

export function pickNicheAppointmentReason(
  config: NicheOperationalConfig,
  companyIndex: number,
  companies: SeedCompany[],
  salt: number,
): string {
  const company = companies.find((c) => c.index === companyIndex);
  const profile = nicheSectorProfile(config, company?.sector ?? "");
  const reasons = profile.reasons.length > 0 ? profile.reasons : config.appointmentReasons;
  return reasons[salt % reasons.length]!;
}

export function isNicheTelemedicine(
  config: NicheOperationalConfig,
  salt: number,
): boolean {
  return salt % 100 < config.telemedicineRatio * 100;
}

export function nicheBenefitProduct(
  niche: NicheId,
  sector: string,
  salt: number,
): { billingCycle: "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL"; amount: number; description: string } {
  const products = NICHE_BENEFIT_PRODUCTS[niche as keyof typeof NICHE_BENEFIT_PRODUCTS];
  const keys = Object.keys(products) as (keyof typeof products)[];
  if (sector === "Tecnologia" || sector === "HealthTech") {
    return products[keys[salt % keys.length]!]!;
  }
  if (sector === "Financeiro" || sector === "Educação") {
    return products[keys[(salt + 1) % keys.length]!]!;
  }
  return products[keys[0]!]!;
}
