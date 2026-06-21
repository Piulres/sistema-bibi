import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const clientes = pgTable("clientes", {
  id: serial().primaryKey(),
  nome: text("nome").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  cpf: text("cpf"),
  endereco: text("endereco"),
  cidade: text("cidade"),
  observacoes: text("observacoes"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});
