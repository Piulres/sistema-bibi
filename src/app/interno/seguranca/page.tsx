import PageHeader from "@/components/layout/PageHeader";
import SecurityView from "@/components/SecurityView";
import DemoResetCard from "@/components/DemoResetCard";
import { requireInternoPage } from "@/lib/interno-guard";
import { isInternoAdmin } from "@/lib/interno-permissions";
import { isDemoResetEnabled } from "@/lib/demo-reset";

export default async function SegurancaPage() {
  const user = await requireInternoPage("seguranca");

  return (
    <>
      <PageHeader
        title="Segurança"
        description="MFA TOTP e políticas de acesso da sua conta interna."
      />
      <div className="space-y-6">
        <SecurityView />
        {isDemoResetEnabled() && isInternoAdmin(user.role, user.internoProfile) && (
          <DemoResetCard isAdmin />
        )}
      </div>
    </>
  );
}
