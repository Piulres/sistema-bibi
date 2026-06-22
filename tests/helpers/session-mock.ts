import crypto from "node:crypto";
import { getTestPrisma } from "./db";

const SECRET = process.env.SESSION_SECRET ?? "test-session-secret-32-chars-min";

/** Token compartilhado pelo mock de `next/headers` nos testes autenticados. */
export const sessionMockState = { token: undefined as string | undefined };

export function signSessionToken(userId: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(userId).digest("hex");
  return `${userId}.${sig}`;
}

export async function setSessionForEmail(email: string): Promise<void> {
  const user = await getTestPrisma().user.findUniqueOrThrow({ where: { email } });
  sessionMockState.token = signSessionToken(user.id);
}

export function clearSessionMock(): void {
  sessionMockState.token = undefined;
}
