"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LoadingState from "@/components/ui/LoadingState";
import ScheduleTimeline from "@/components/projects/ScheduleTimeline";
import { projectStatusLabel } from "@/lib/project/constants";

export default function BeneficiarioObraDetailView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<{
    code: string;
    name: string;
    status: string;
    progressPercent: number;
    startDate: string | null;
    endDate: string | null;
    tasks: { id: string; name: string; phase: string; phaseLabel: string; status: string; statusLabel: string; startDate: string | null; endDate: string | null; progressPercent: number }[];
    contracts: { title: string; consolidatedValue: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/beneficiario/projects/${projectId}`);
      const json = await res.json();
      if (active && res.ok) setProject(json.project);
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading) return <LoadingState message="Carregando acompanhamento da obra…" />;
  if (!project) return <p className="text-sm text-[var(--text-muted)]">Obra não encontrada.</p>;

  return (
    <div className="space-y-6">
      <Link href="/beneficiario/obras" className="text-sm text-[var(--text-muted)]">← Minhas obras</Link>
      <div>
        <h2 className="text-xl font-semibold">{project.code} — {project.name}</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {projectStatusLabel(project.status)} · {project.progressPercent}% · cronograma somente leitura
        </p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-orange-500" style={{ width: `${project.progressPercent}%` }} />
      </div>
      <ScheduleTimeline
        tasks={project.tasks.map((t) => ({
          id: t.id,
          name: t.name,
          startDate: t.startDate,
          endDate: t.endDate,
          progressPercent: t.progressPercent,
        }))}
      />
      {project.contracts.length > 0 && (
        <section className="rounded-xl border p-4 text-sm">
          <h3 className="font-medium">Contrato consolidado</h3>
          {project.contracts.map((c) => (
            <p key={c.title} className="mt-2">
              {c.title}: {c.consolidatedValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
