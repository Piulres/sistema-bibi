import { ensureTestDatabase, resetTestDatabaseMarker } from "./helpers/db";

/**
 * Roda antes dos workers — cria prisma/test.db antes de importar rotas API.
 * Remove o marker para rodar o caminho completo (db push + staleness + seed)
 * uma vez; os `beforeAll` por arquivo caem no caminho rápido via marker.
 */
export default async function globalSetup(): Promise<void> {
  resetTestDatabaseMarker();
  await ensureTestDatabase();
}
