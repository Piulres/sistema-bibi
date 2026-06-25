import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { NicheId } from "@/lib/niche/types";
import { isNicheId } from "@/lib/niche/types";
import type { ResolvedSegment } from "@/lib/segment/types";
import { getSessionSecret, isProductionRuntime } from "@/lib/security/config";

const COOKIE_NAME = "bibi_segment";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 dias

type SegmentPayload = {
  niche: NicheId;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
};

function sign(value: string): string {
  const sig = crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
  return `${value}.${sig}`;
}

function verify(token: string | undefined): SegmentPayload | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(value) as SegmentPayload;
    if (!parsed.niche || !isNicheId(parsed.niche)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persiste o segmento ativo entre landing → login → portais (cookie assinado). */
export async function persistSegmentCookie(segment: ResolvedSegment): Promise<void> {
  const payload: SegmentPayload = {
    niche: segment.niche,
    tenantId: segment.tenantId,
    tenantSlug: segment.tenantSlug,
    tenantName: segment.tenantName,
  };
  const store = await cookies();
  store.set(COOKIE_NAME, sign(JSON.stringify(payload)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
    secure: isProductionRuntime(),
  });
}

export async function readSegmentCookie(): Promise<ResolvedSegment | null> {
  const store = await cookies();
  const payload = verify(store.get(COOKIE_NAME)?.value);
  if (!payload) return null;
  return {
    niche: payload.niche,
    tenantId: payload.tenantId,
    tenantSlug: payload.tenantSlug,
    tenantName: payload.tenantName,
  };
}

export function readSegmentCookieFromRequest(request: Request): ResolvedSegment | null {
  const header = request.headers.get("cookie") ?? "";
  const match = header.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const payload = verify(match?.[1] ? decodeURIComponent(match[1]) : undefined);
  if (!payload) return null;
  return {
    niche: payload.niche,
    tenantId: payload.tenantId,
    tenantSlug: payload.tenantSlug,
    tenantName: payload.tenantName,
  };
}
