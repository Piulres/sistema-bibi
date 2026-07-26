"use client";

import Button from "@/components/ui/Button";
import type { ExportFormat } from "@/lib/exports/format";
import { LIST_EXPORT_FORMATS } from "@/lib/exports/format";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: "PDF",
  xlsx: "Excel",
  csv: "CSV",
  json: "JSON",
  txt: "TXT",
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
  formats = LIST_EXPORT_FORMATS,
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
        <a
          key={format}
          href={buildUrl(format)}
          download
          className="inline-flex min-h-10"
        >
          <Button variant={variant} size={size} type="button" className="w-full">
            {FORMAT_LABELS[format]}
          </Button>
        </a>
      ))}
    </div>
  );
}
