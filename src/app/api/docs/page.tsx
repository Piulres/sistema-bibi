import type { Metadata } from "next";
import SwaggerUi from "@/components/api-docs/SwaggerUi";

export const metadata: Metadata = {
  title: "API — Sistema Bibi - ServiceOS",
  description:
    "Documentação interativa OpenAPI 3.0 do Sistema Bibi - ServiceOS. Explore e teste os endpoints REST.",
};

export default function ApiDocsPage() {
  return <SwaggerUi />;
}
