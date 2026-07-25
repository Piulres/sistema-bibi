import { Suspense } from "react";
import InternoCadastrosHeader from "@/components/interno/InternoCadastrosHeader";
import CadastrosView from "@/components/CadastrosView";
import LoadingState from "@/components/ui/LoadingState";
import { requireInternoPage } from "@/lib/interno-guard";
import { isInternoAdmin } from "@/lib/interno-permissions";

export default async function InternoCadastrosPage() {
  const user = await requireInternoPage("cadastros");
  const canManageUsers = isInternoAdmin(user.role, user.internoProfile);

  return (
    <>
      <InternoCadastrosHeader />
      <Suspense fallback={<LoadingState message="Carregando cadastros..." />}>
        <CadastrosView canManageUsers={canManageUsers} />
      </Suspense>
    </>
  );
}
