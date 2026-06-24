import { NextResponse } from "next/server";
import { ensureDataStoreForSegmentAccess } from "@/lib/data-store/ensure-data-store-for-segment";
import { resolveSegmentFromHeaders } from "@/lib/segment/resolve";
import { persistSegmentCookie } from "@/lib/segment/cookie";

type Body = {
  tenant?: string | null;
  niche?: string | null;
};

/** Persiste cookie `bibi_segment` — só em Route Handler (Next.js 16). */
export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    // body vazio — usa só cookie/headers atuais
  }

  await ensureDataStoreForSegmentAccess({
    tenantSlug: body.tenant ?? null,
    nicheParam: body.niche ?? null,
  });

  const segment = await resolveSegmentFromHeaders({
    tenantSlug: body.tenant ?? null,
    nicheParam: body.niche ?? null,
  });

  await persistSegmentCookie(segment);
  return NextResponse.json({ ok: true, segment });
}
