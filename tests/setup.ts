import { beforeAll } from "vitest";
import { ensureTestDatabase } from "./helpers/db";

beforeAll(async () => {
  await ensureTestDatabase();
});
