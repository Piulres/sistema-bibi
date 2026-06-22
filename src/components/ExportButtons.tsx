"use client";

import Button from "@/components/ui/Button";
import type { ExportFormat } from "@/lib/exports/format";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: "PDF",
  xlsx: "Excel",
  csv: "CSV",
  json: "JSON",
};

type Props = {
  baseUrl: string;
  query?: Record<string, string | undefined>;
  formats?: ExportFormat[];
  size?: "sm" | "md";
  variant?: "portal" | "secondary" | "ghost";
};

export default function ExportButtons({
  baseUrl,
  query = {},
  formats = ["pdf", "xlsx"],
  size = "sm",
  variant = "secondary",
}: Props) {
  const buildUrl = (format: ExportFormat) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    params.set("format", format);
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : `${baseUrl}?format=${format}`;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {formats.map((format) => (
        <a key={format} href={buildUrl(format)} download>
          <Button variant={variant} size={size} type="button">
            {FORMAT_LABELS[format]}
          </Button>
        </a>
      ))}
    </div>
  );
}
