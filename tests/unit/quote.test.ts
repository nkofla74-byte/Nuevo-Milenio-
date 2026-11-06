import { describe, it, expect, beforeEach } from 'vitest';
import { createQuoteSchema, formDataToObject } from '../../src/lib/quote/schema';
import { escapeHtml, headerSafe, truncateIp, buildCompanyEmail } from '../../src/lib/quote/email';
import { checkRateLimit, resetMemoryRateLimit, verifyTurnstile, isSameOrigin, RATE_LIMIT, type KVLike } from '../../src/lib/quote/guards';

const schema = createQuoteSchema({ sectors: ['retail', 'oficinas'], services: ['drywall-y-superboard', 'estuco-y-pintura'] });

const valid = {
  sector: 'retail',
  services: ['drywall-y-superboard'],
  area: '80',
  city: 'Bogotá',
  urgency: '1-mes',
  description: 'Necesito dividir una oficina de 80 m2 con drywall.',
  name: 'Ana Prueba',
  phone: '300 123 4567',
  email: 'ana@example.com',
  channel: 'correo',
  consent: 'on',
  policyVersion: '0.1',
  website: '',
};

describe('quote schema (server-side source of truth)', () => {
  it('accepts a valid request and normalizes values', () => {
    const r = schema.parse(valid);
    expect(r.phone).toBe('3001234567');
    expect(r.area).toBe(80);
  });

  it('rejects unknown sectors and services', () => {
    expect(schema.safeParse({ ...valid, sector: 'hackeo' }).success).toBe(false);
    expect(schema.safeParse({ ...valid, services: ['<script>'] }).success).toBe(false);
  });

  it('requires at least one service', () => {
    expect(schema.safeParse({ ...valid, services: [] }).success).toBe(false);
  });

  it('enforces length limits (e.g. 10,000-character email)', () => {
    expect(schema.safeParse({ ...valid, email: `${'a'.repeat(10_000)}@x.co` }).success).toBe(false);
    expect(schema.safeParse({ ...valid, description: 'x'.repeat(1501) }).success).toBe(false);
  });

  it('requires explicit consent (unchecked box is rejected)', () => {
    expect(schema.safeParse({ ...valid, consent: undefined }).success).toBe(false);
    expect(schema.safeParse({ ...valid, consent: 'true' }).success).toBe(false);
  });

  it('strips CR/LF from single-line fields (header injection)', () => {
    const r = schema.parse({ ...valid, name: 'Ana\r\nBcc: victima@x.com' });
    expect(r.name).not.toMatch(/[\r\n]/);
  });

  it('rejects a filled honeypot', () => {
    expect(schema.safeParse({ ...valid, website: 'spam.com' }).success).toBe(false);
  });

  it('gives Spanish messages', () => {
    const r = schema.safeParse({});
    expect(r.success).toBe(false);
    const messages = r.error!.issues.map((i) => i.message).join(' ');
    expect(messages).not.toMatch(/Invalid input|expected/);
  });
});

describe('formDataToObject', () => {
  it('turns repeated services into an array', () => {
    const fd = new FormData();
    fd.append('services', 'a');
    fd.append('services', 'b');
    fd.append('name', 'Ana');
    expect(formDataToObject(fd)).toEqual({ services: ['a', 'b'], name: 'Ana' });
  });
});

describe('email building', () => {
  it('escapes HTML in user values', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
    const q = schema.parse({ ...valid, description: '<script>alert(1)</script> quiero cotizar' });
    const mail = buildCompanyEmail(q, { sector: 'Retail', services: ['Drywall'], urgency: 'Mes', channel: 'Correo' }, { acceptedAt: 'x', policyVersion: '0.1', ipTruncated: '1.2.3.0', userAgent: '' }, 'Marca');
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
  });

  it('keeps headers on one line', () => {
    expect(headerSafe('a\r\nBcc: x')).toBe('a Bcc: x');
  });

  it('truncates IPs (data minimization)', () => {
    expect(truncateIp('203.0.113.42')).toBe('203.0.113.0');
    expect(truncateIp('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe('2001:db8:85a3::');
    expect(truncateIp(null)).toBe('desconocida');
  });
});

describe('guards', () => {
  beforeEach(() => resetMemoryRateLimit());

  it('allows RATE_LIMIT.max requests per window, then blocks', async () => {
    for (let i = 0; i < RATE_LIMIT.max; i++) expect(await checkRateLimit('1.1.1.1', undefined, 0)).toBe(true);
    expect(await checkRateLimit('1.1.1.1', undefined, 0)).toBe(false);
    expect(await checkRateLimit('2.2.2.2', undefined, 0)).toBe(true);
    expect(await checkRateLimit('1.1.1.1', undefined, RATE_LIMIT.windowSeconds * 1000 + 1)).toBe(true);
  });

  it('uses KV when available', async () => {
    const store = new Map<string, string>();
    const kv: KVLike = { get: async (k) => store.get(k) ?? null, put: async (k, v) => void store.set(k, v) };
    for (let i = 0; i < RATE_LIMIT.max; i++) await checkRateLimit('9.9.9.9', kv);
    expect(await checkRateLimit('9.9.9.9', kv)).toBe(false);
  });

  it('turnstile fails closed', async () => {
    expect(await verifyTurnstile(undefined, 's', null)).toBe(false);
    const broken = (async () => { throw new Error('network'); }) as unknown as typeof fetch;
    expect(await verifyTurnstile('t', 's', null, broken)).toBe(false);
    const ok = (async () => new Response(JSON.stringify({ success: true }))) as unknown as typeof fetch;
    expect(await verifyTurnstile('t', 's', null, ok)).toBe(true);
  });

  it('checks same origin', () => {
    const req = (origin?: string) => new Request('https://a.co/api/cotizar/', { method: 'POST', headers: origin ? { origin } : {} });
    expect(isSameOrigin(req('https://a.co'))).toBe(true);
    expect(isSameOrigin(req('https://evil.co'))).toBe(false);
    expect(isSameOrigin(req())).toBe(false);
  });
});
