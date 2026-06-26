import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "@/lib/security/headers";

const nextConfig: NextConfig = {
  // Garante que o SQLite seedado e o schema entram no bundle serverless da Netlify.
  outputFileTracingIncludes: {
    "/*": ["./prisma/**/*"],
  },
  async redirects() {
    return [
      {
        source: "/api-docs.html",
        destination: "/api/docs",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },
};

export default nextConfig;
