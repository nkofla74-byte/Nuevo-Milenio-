/** Anti-abuse checks for the quote endpoint: rate limiting and Turnstile verification. */

export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export const RATE_LIMIT = { max: 5, windowSeconds: 600 } as const;

// Per-isolate fallback when no KV binding is configured. Not shared across Cloudflare
// instances, so production should bind RATE_LIMIT_KV or add a WAF rate-limiting rule.
const memory = new Map<string, { count: number; resetAt: number }>();

/** Returns true when the request is allowed. Fixed window of RATE_LIMIT.windowSeconds per IP. */
export async function checkRateLimit(ip: string, kv: KVLike | undefined, now = Date.now()): Promise<boolean> {
  const key = `rl:quote:${ip}`;
  if (kv) {
    const current = Number((await kv.get(key)) ?? '0');
    if (current >= RATE_LIMIT.max) return false;
    await kv.put(key, String(current + 1), { expirationTtl: RATE_LIMIT.windowSeconds });
    return true;
  }
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + RATE_LIMIT.windowSeconds * 1000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT.max) return false;
  entry.count++;
  return true;
}

/** Test helper. */
export const resetMemoryRateLimit = () => memory.clear();

/** Server-side Turnstile verification. Fails closed on network errors. */
export async function verifyTurnstile(token: string | undefined, secret: string, ip: string | null, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/** Same-origin check for POSTs (CSRF defense in depth; the form has no cookies/session to steal). */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  return origin === new URL(request.url).origin;
}
