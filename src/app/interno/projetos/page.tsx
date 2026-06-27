import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import ProjectsView from "@/components/projects/ProjectsView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoProjetosPage() {
  await requireInternoPage("projetos");

  return (
    <>
      <PageHeader
        title="Obras e projetos"
        description="Status, orçamentos, cronogramas e documentação técnica."
      />
      <ProjectsView />
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/interno/projetos/pipeline" className="text-[var(--brand-accent)] hover:underline">
          Pipeline comercial →
        </Link>
        <Link href="/interno/projetos/financeiro" className="text-[var(--brand-accent)] hover:underline">
          Financeiro da empresa →
        </Link>
      </div>
    </>
  );
}
