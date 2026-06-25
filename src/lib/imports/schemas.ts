import type { InterchangeColumn } from "@/lib/imports/interchange";

export const IMPORT_ENTITIES = ["patients", "companies", "procedures"] as const;

export type ImportEntity = (typeof IMPORT_ENTITIES)[number];

const ENTITY_SET = new Set<string>(IMPORT_ENTITIES);

export function isImportEntity(value: string): value is ImportEntity {
  return ENTITY_SET.has(value);
}

export type ImportFieldSpec = {
  key: string;
  header: string;
  required?: boolean;
  example?: string;
};

export type ImportEntitySchema = {
  entity: ImportEntity;
  label: string;
  fields: ImportFieldSpec[];
};

export const IMPORT_ENTITY_SCHEMAS: Record<ImportEntity, ImportEntitySchema> = {
  patients: {
    entity: "patients",
    label: "Beneficiários",
    fields: [
      { key: "name", header: "nome", required: true, example: "Maria Silva" },
      { key: "cpf", header: "cpf", required: true, example: "529.982.247-25" },
      { key: "birthDate", header: "data_nascimento", required: true, example: "1990-05-15" },
      { key: "phone", header: "telefone", example: "(11) 98765-4321" },
      { key: "email", header: "email", example: "maria@email.com" },
      { key: "gender", header: "genero", example: "F" },
      { key: "motherName", header: "nome_mae", example: "Ana Silva" },
      { key: "employeeId", header: "matricula", example: "EMP-001" },
      { key: "bondType", header: "vinculo", example: "TITULAR" },
      { key: "companyCnpj", header: "empresa_cnpj", example: "11.222.333/0001-81" },
    ],
  },
  companies: {
    entity: "companies",
    label: "Empresas PJ",
    fields: [
      { key: "name", header: "razao_social", required: true, example: "TechCorp Ltda" },
      { key: "cnpj", header: "cnpj", required: true, example: "11.222.333/0001-81" },
      { key: "tradeName", header: "nome_fantasia", example: "TechCorp" },
      { key: "email", header: "email", example: "rh@techcorp.com" },
      { key: "phone", header: "telefone", example: "(11) 3000-0000" },
      { key: "contactName", header: "contato_nome", example: "João RH" },
      { key: "contactEmail", header: "contato_email", example: "joao@techcorp.com" },
      { key: "contactPhone", header: "contato_telefone", example: "(11) 3000-0001" },
      { key: "status", header: "status", example: "ATIVO" },
      { key: "addressStreet", header: "endereco", example: "Rua das Flores, 100" },
      { key: "addressCity", header: "cidade", example: "São Paulo" },
      { key: "addressState", header: "uf", example: "SP" },
      { key: "addressZip", header: "cep", example: "01310-100" },
    ],
  },
  procedures: {
    entity: "procedures",
    label: "Procedimentos",
    fields: [
      { key: "code", header: "codigo", required: true, example: "CONS-GERAL" },
      { key: "name", header: "nome", required: true, example: "Consulta geral" },
      { key: "category", header: "categoria", required: true, example: "CONSULTA" },
      { key: "basePrice", header: "preco_base", required: true, example: "150.00" },
      { key: "serviceType", header: "tipo_servico", example: "CLINICA" },
      { key: "tissCode", header: "codigo_tiss", example: "10101012" },
    ],
  },
};

export function getImportColumns(entity: ImportEntity): InterchangeColumn[] {
  return IMPORT_ENTITY_SCHEMAS[entity].fields.map((field) => ({
    key: field.key,
    header: field.header,
  }));
}

export function getImportEntityLabel(entity: ImportEntity): string {
  return IMPORT_ENTITY_SCHEMAS[entity].label;
}

/** Linha de exemplo para template de importação. */
export function buildTemplateExampleRow(entity: ImportEntity): Record<string, string> {
  const row: Record<string, string> = {};
  for (const field of IMPORT_ENTITY_SCHEMAS[entity].fields) {
    row[field.key] = field.example ?? "";
  }
  return row;
}
