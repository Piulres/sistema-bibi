import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "@/lib/security/headers";

const nextConfig: NextConfig = {
  // Garante que o SQLite seedado e o schema entram no bundle serverless da Netlify.
  outputFileTracingIncludes: {
    "/*": ["./prisma/**/*"],
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
