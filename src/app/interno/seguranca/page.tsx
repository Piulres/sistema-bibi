import PageHeader from "@/components/layout/PageHeader";
import SecurityView from "@/components/SecurityView";
import DemoResetCard from "@/components/DemoResetCard";
import DataStoreCard from "@/components/DataStoreCard";
import { requireInternoPage } from "@/lib/interno-guard";
import { isInternoAdmin } from "@/lib/interno-permissions";
import { isDemoResetEnabled } from "@/lib/demo-reset";
import { isDualDataStoreEnabled } from "@/lib/data-store-mode";

export default async function SegurancaPage() {
  const user = await requireInternoPage("seguranca");
  const isAdmin = isInternoAdmin(user.role, user.internoProfile);
  const showDemoReset = isAdmin && (await isDemoResetEnabled());
  const showDataStore = isAdmin && isDualDataStoreEnabled();

  return (
    <>
      <PageHeader
        title="Segurança"
        description="MFA TOTP e políticas de acesso da sua conta interna."
      />
      <div className="space-y-6">
        <SecurityView />
        {showDataStore && <DataStoreCard isAdmin />}
        {showDemoReset && <DemoResetCard isAdmin />}
      </div>
    </>
  );
}
