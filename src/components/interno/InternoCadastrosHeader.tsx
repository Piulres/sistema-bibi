"use client";

import PageHeader from "@/components/layout/PageHeader";
import { useLabels } from "@/hooks/useLabels";
import { cadastrosPageDescription } from "@/lib/navigation/niche-nav";

/** Cabeçalho de cadastros com descrição dinâmica por nicho. */
export default function InternoCadastrosHeader() {
  const { labels } = useLabels();
  return (
    <PageHeader
      title="Cadastros"
      description={cadastrosPageDescription(labels)}
    />
  );
}
