import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/session";
import {
  hasInternoPermission,
  type InternoModule,
} from "@/lib/interno-permissions";

/** Protege páginas do portal interno (sessão + módulo opcional). */
export async function requireInternoPage(module?: InternoModule): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNO") {
    redirect("/interno/login");
  }
  if (module && !hasInternoPermission(user.role, user.internoProfile, module)) {
    redirect("/interno/dashboard");
  }
  return user;
}
