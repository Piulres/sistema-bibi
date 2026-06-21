import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Garante que o SQLite seedado e o schema entram no bundle serverless da Netlify.
  outputFileTracingIncludes: {
    "/*": ["./prisma/**/*"],
  },
};

export default nextConfig;
