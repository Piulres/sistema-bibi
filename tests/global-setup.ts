import { ensureTestDatabase } from "./helpers/db";

/** Roda antes dos workers — cria prisma/test.db antes de importar rotas API. */
export default async function globalSetup(): Promise<void> {
  await ensureTestDatabase();
}
