/** Rate limit em memória por chave (IP + ação). Adequado a serverless com janela curta. */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 10_000;

function pruneExpired(now: number): void {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/** Desliga rate limit em CI, testes e quando explicitamente desabilitado. */
export function shouldApplyRateLimit(): boolean {
  if (process.env.CI === "true") return false;
  if (process.env.NODE_ENV === "test") return false;
  if (process.env.DISABLE_RATE_LIMIT === "true") return false;
  return true;
}

function getBucket(key: string, windowMs: number, now: number): Bucket {
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return fresh;
  }
  return existing;
}

/** Verifica limite sem incrementar (usar antes de processar auth). */
export function peekRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);
  const bucket = getBucket(key, options.windowMs, now);
  if (bucket.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { allowed: true };
}

/** Incrementa contador após falha de autenticação. */
export function recordRateLimitHit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);
  const bucket = getBucket(key, options.windowMs, now);
  bucket.count += 1;
  if (bucket.count > options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { allowed: true };
}

/** @deprecated Prefer peekRateLimit + recordRateLimitHit para auth. */
export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  return recordRateLimitHit(key, options);
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimitResponse(retryAfterSeconds: number): Response {
  return new Response(JSON.stringify({ error: "Muitas tentativas. Aguarde e tente novamente." }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSeconds),
    },
  });
}

/** Helper para rotas de auth: bloqueia se já excedeu; registra só em falha. */
export function enforceAuthRateLimit(
  request: Request,
  scope: "login" | "mfa",
  failed: boolean,
): Response | null {
  if (!shouldApplyRateLimit()) return null;

  const key = `${scope}:${clientIpFromRequest(request)}`;
  const options = { limit: 10, windowMs: 15 * 60 * 1000 };

  const blocked = peekRateLimit(key, options);
  if (!blocked.allowed) {
    return rateLimitResponse(blocked.retryAfterSeconds);
  }

  if (failed) {
    recordRateLimitHit(key, options);
  }

  return null;
}
