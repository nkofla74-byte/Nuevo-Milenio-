/**
 * POST /api/cotizar/ — the only server-side code of the site.
 * Flow: origin check → size limit → rate limit → honeypot → Zod validation → Turnstile → emails.
 * Users only ever see generic messages; details go to server logs without personal data.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { RESEND_API_KEY, TURNSTILE_SECRET_KEY, QUOTE_TO_EMAIL, QUOTE_FROM_EMAIL } from 'astro:env/server';
import { env as cfEnv } from 'cloudflare:workers';
import { createQuoteSchema, formDataToObject } from '../../lib/quote/schema';
import { buildCompanyEmail, buildUserEmail, truncateIp, type ConsentRecord } from '../../lib/quote/email';
import { checkRateLimit, verifyTurnstile, isSameOrigin, type KVLike } from '../../lib/quote/guards';
import { URGENCY_LABELS, CHANNEL_LABELS } from '../../lib/quote/labels';
import { site } from '../../config/site';

export const prerender = false;

const MAX_BODY_BYTES = 20_000;
// Cloudflare's official always-passing test secret, used only in local development.
const DEV_TURNSTILE_SECRET = '1x0000000000000000000000000000000AA';

type Outcome = { ok: true } | { ok: false; status: number; message: string; fields?: Record<string, string> };

function respond(request: Request, outcome: Outcome): Response {
  const wantsJson = request.headers.get('accept')?.includes('application/json');
  if (wantsJson) {
    return new Response(JSON.stringify(outcome), {
      status: outcome.ok ? 200 : outcome.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  // No-JS fallback: classic form post → redirect (PRG pattern).
  const target = outcome.ok ? '/cotizar/gracias/' : `/cotizar/?error=${outcome.status === 429 ? 'limite' : 'validacion'}`;
  return new Response(null, { status: 303, headers: { Location: target, 'Cache-Control': 'no-store' } });
}

const log = (event: string, extra: Record<string, unknown> = {}) =>
  console.info(JSON.stringify({ at: new Date().toISOString(), scope: 'api/cotizar', event, ...extra }));

async function sendEmail(payload: { from: string; to: string; reply_to?: string; subject: string; html: string; text: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`resend ${res.status}`);
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isSameOrigin(request)) {
    log('rejected', { reason: 'origin' });
    return respond(request, { ok: false, status: 403, message: 'Solicitud no permitida.' });
  }
  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > MAX_BODY_BYTES) {
    return respond(request, { ok: false, status: 413, message: 'La solicitud es demasiado grande.' });
  }

  const ip = clientAddress ?? null;
  const kv = (cfEnv as Record<string, unknown>).RATE_LIMIT_KV as KVLike | undefined;
  if (!(await checkRateLimit(ip ?? 'unknown', kv))) {
    log('rate_limited');
    return respond(request, { ok: false, status: 429, message: 'Recibimos varias solicitudes seguidas. Intente de nuevo en unos minutos.' });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return respond(request, { ok: false, status: 400, message: 'No pudimos leer el formulario.' });
  }
  const raw = formDataToObject(form);

  // Honeypot filled → bot. Pretend success so it does not learn anything.
  if (typeof raw.website === 'string' && raw.website.length > 0) {
    log('honeypot');
    return respond(request, { ok: true });
  }

  const [sectors, services] = await Promise.all([getCollection('sectores'), getCollection('servicios')]);
  const schema = createQuoteSchema({ sectors: sectors.map((s) => s.id), services: services.map((s) => s.id) });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fields[key] ??= issue.message;
    }
    log('invalid', { fields: Object.keys(fields) });
    return respond(request, { ok: false, status: 400, message: 'Revise los campos marcados.', fields });
  }
  const q = parsed.data;

  const secret = TURNSTILE_SECRET_KEY ?? (import.meta.env.DEV ? DEV_TURNSTILE_SECRET : undefined);
  if (!secret) {
    log('misconfigured', { missing: 'TURNSTILE_SECRET_KEY' });
    return respond(request, { ok: false, status: 503, message: 'El formulario no está disponible en este momento. Escríbanos por WhatsApp o correo.' });
  }
  if (!(await verifyTurnstile(q['cf-turnstile-response'], secret, ip))) {
    log('turnstile_failed');
    return respond(request, { ok: false, status: 400, message: 'No pudimos verificar que no es un robot. Intente de nuevo.' });
  }

  const consent: ConsentRecord = {
    acceptedAt: new Date().toISOString(),
    policyVersion: q.policyVersion,
    ipTruncated: truncateIp(ip),
    userAgent: (request.headers.get('user-agent') ?? '').slice(0, 200),
  };
  const labels = {
    sector: sectors.find((s) => s.id === q.sector)?.data.title ?? 'Otro',
    services: q.services.map((id) => services.find((s) => s.id === id)?.data.title ?? id),
    urgency: URGENCY_LABELS[q.urgency],
    channel: CHANNEL_LABELS[q.channel],
  };

  if (!RESEND_API_KEY || !QUOTE_TO_EMAIL || !QUOTE_FROM_EMAIL) {
    if (import.meta.env.DEV) {
      // Local development without email credentials: log a summary without personal data.
      log('dev_received', { services: q.services, sector: q.sector, consentVersion: consent.policyVersion });
      return respond(request, { ok: true });
    }
    log('misconfigured', { missing: 'email' });
    return respond(request, { ok: false, status: 503, message: 'El formulario no está disponible en este momento. Escríbanos por WhatsApp o correo.' });
  }

  try {
    const company = buildCompanyEmail(q, labels, consent, site.brandName);
    await sendEmail({ from: QUOTE_FROM_EMAIL, to: QUOTE_TO_EMAIL, reply_to: q.email, ...company });
    const user = buildUserEmail(q, site.brandName);
    await sendEmail({ from: QUOTE_FROM_EMAIL, to: q.email, ...user }).catch(() => log('user_email_failed'));
    log('sent', { services: q.services.length });
    return respond(request, { ok: true });
  } catch (err) {
    log('send_failed', { error: err instanceof Error ? err.message : 'unknown' });
    return respond(request, { ok: false, status: 502, message: 'No pudimos enviar su solicitud. Intente de nuevo o escríbanos por WhatsApp.' });
  }
};

export const ALL: APIRoute = () => new Response(null, { status: 405, headers: { Allow: 'POST' } });
