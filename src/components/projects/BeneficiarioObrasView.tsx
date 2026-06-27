"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LoadingState from "@/components/ui/LoadingState";
import { projectStatusLabel } from "@/lib/project/constants";

type ProjectRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  progressPercent: number;
};

export default function BeneficiarioObrasView() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/beneficiario/projects");
      const json = await res.json();
      if (active && res.ok) setProjects(json.projects as ProjectRow[]);
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingState message="Carregando suas obras…" />;

  if (projects.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">Nenhuma obra vinculada ao seu cadastro.</p>;
  }

  return (
    <ul className="space-y-3">
      {projects.map((p) => (
        <li key={p.id}>
          <Link
            href={`/beneficiario/obras/${p.id}`}
            className="block rounded-xl border border-[var(--border-default)] p-4 transition hover:border-[var(--border-accent)]"
          >
            <p className="text-xs font-medium uppercase text-[var(--text-muted)]">{p.code}</p>
            <p className="font-medium">{p.name}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {projectStatusLabel(p.status)} · {p.progressPercent}% concluído
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
