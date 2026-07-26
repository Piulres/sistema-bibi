/**
 * Registro de cobertura CRUD — cada entidade do mapa canônico aponta para
 * ao menos um arquivo de teste que exercita Create/Read/Update/Delete
 * (conforme a entidade suporte).
 *
 * Manutenção: ao adicionar entidade em `CRUD_OPERATIONS_MAP`, incluir aqui.
 * Validado por `tests/lib/crud-coverage.test.ts`.
 */
export type CrudCoverageEntry = {
  entity: string;
  /** Arquivos de teste (API / E2E / unit) que cobrem mutações ou reads críticos. */
  tests: string[];
};

export const CRUD_COVERAGE_REGISTRY: CrudCoverageEntry[] = [
  {
    entity: "Beneficiário / paciente",
    tests: ["tests/api/cadastros-crud.test.ts", "e2e/cadastros-crud.spec.ts"],
  },
  {
    entity: "Empresa (PJ)",
    tests: ["tests/api/cadastros-crud.test.ts", "e2e/cadastros-crud.spec.ts"],
  },
  {
    entity: "Procedimento (catálogo)",
    tests: ["tests/api/cadastros-crud.test.ts", "e2e/cadastros-crud.spec.ts"],
  },
  {
    entity: "Usuário",
    tests: ["tests/api/cadastros-crud.test.ts", "e2e/cadastros-crud.spec.ts"],
  },
  {
    entity: "Pet (VET)",
    tests: ["tests/api/system-crud-matrix.test.ts"],
  },
  {
    entity: "Regra de precificação",
    tests: ["tests/api/system-crud-matrix.test.ts", "tests/api/audit-pricing.test.ts"],
  },
  {
    entity: "Protocolo clínico",
    tests: ["tests/api/system-crud-matrix.test.ts"],
  },
  {
    entity: "Protocolo de exames",
    tests: ["tests/api/system-crud-matrix.test.ts"],
  },
  {
    entity: "Produto de estoque",
    tests: ["tests/api/stock.test.ts", "tests/api/system-crud-matrix.test.ts"],
  },
  {
    entity: "Lançamento clínico (CEDIG)",
    tests: [
      "tests/api/system-crud-matrix.test.ts",
      "tests/unit/clinic-finance-bridge-integration.test.ts",
      "e2e/cedig-gestao.spec.ts",
    ],
  },
  {
    entity: "Despesa clínica (CEDIG)",
    tests: ["tests/api/system-crud-matrix.test.ts"],
  },
  {
    entity: "Agendamento",
    tests: ["tests/api/pay-per-use-flow.test.ts", "e2e/walkin-particular.spec.ts"],
  },
  {
    entity: "Fatura Pay Per Use",
    tests: ["tests/api/pay-per-use-flow.test.ts", "tests/api/change-management.test.ts"],
  },
  {
    entity: "Pagamento PIX",
    tests: ["tests/api/pay-per-use-flow.test.ts", "tests/integration/mock-pix.test.ts"],
  },
  {
    entity: "Assinatura recorrente",
    tests: ["tests/api/system-crud-matrix.test.ts", "tests/api/audit-pricing.test.ts"],
  },
  {
    entity: "Cobrança de assinatura",
    tests: ["tests/api/audit-pricing.test.ts"],
  },
  {
    entity: "Mensagem / campanha",
    tests: ["tests/api/system-crud-matrix.test.ts"],
  },
  {
    entity: "Lembretes automáticos",
    tests: ["tests/api/auth-and-cron.test.ts"],
  },
  {
    entity: "Webhook B2B",
    tests: ["tests/api/system-crud-matrix.test.ts"],
  },
  {
    entity: "Entrega de webhook",
    tests: ["tests/api/system-crud-matrix.test.ts"],
  },
  {
    entity: "Branding white label",
    tests: ["tests/api/system-crud-matrix.test.ts"],
  },
  {
    entity: "Relatórios e exportações",
    tests: ["tests/api/exports.test.ts"],
  },
  {
    entity: "Change management (reversibilidade)",
    tests: ["tests/api/change-management.test.ts", "tests/api/system-crud-matrix.test.ts"],
  },
  {
    entity: "Dashboard executivo",
    tests: ["tests/api/portal-flows.test.ts"],
  },
  {
    entity: "MFA (TOTP)",
    tests: ["tests/security/mfa-tokens.test.ts"],
  },
  {
    entity: "Reset modo demo",
    tests: ["tests/unit/demo-reset.test.ts"],
  },
  {
    entity: "Agendamento (prestador)",
    tests: ["tests/api/portal-flows.test.ts", "e2e/flow-improvements.spec.ts"],
  },
  {
    entity: "Disponibilidade (prestador)",
    tests: ["tests/lib/slot-grid.test.ts", "tests/unit/scheduling-flex.test.ts"],
  },
  {
    entity: "Uso de procedimento (PPU)",
    tests: ["tests/api/pay-per-use-flow.test.ts", "tests/api/stock.test.ts"],
  },
  {
    entity: "Prontuário (PEP)",
    tests: ["tests/api/exports.test.ts"],
  },
  {
    entity: "Agendamento (self-service)",
    tests: ["tests/api/portal-flows.test.ts", "e2e/flows.spec.ts"],
  },
  {
    entity: "Pagamento PIX (beneficiário)",
    tests: ["tests/api/portal-flows.test.ts", "tests/integration/mock-pix.test.ts"],
  },
  {
    entity: "Visão corporativa",
    tests: ["tests/api/portal-flows.test.ts"],
  },
  {
    entity: "Relatório corporativo",
    tests: ["tests/api/portal-flows.test.ts", "tests/api/exports.test.ts"],
  },
  {
    entity: "Autenticação",
    tests: ["tests/api/auth-and-cron.test.ts", "e2e/smoke.spec.ts"],
  },
];
