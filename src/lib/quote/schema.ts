/**
 * Server-side validation for quote requests (the source of truth).
 * The browser form only mirrors these limits with native HTML attributes to help the user.
 */
import { z } from 'zod';
import { es } from 'zod/locales';

// Default validation messages in Spanish for any field without a custom message.
z.config(es());

export const URGENCY = ['inmediata', '1-mes', '1-3-meses', 'planeando'] as const;
export const CHANNELS = ['correo', 'llamada', 'whatsapp'] as const;

export const LIMITS = {
  name: 80,
  company: 120,
  role: 80,
  city: 80,
  neighborhood: 80,
  description: 1500,
  email: 120,
  maxServices: 25,
  maxArea: 1_000_000,
} as const;

/** Collapses whitespace and strips control characters (incl. CR/LF, used for header injection). */
const clean = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim())
    .pipe(z.string().max(max));

/** Keeps line breaks for the free-text description but removes other control characters. */
const multiline = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000B-\u001F\u007F]+/g, ' ').trim())
    .pipe(z.string().min(10, 'Cuéntenos un poco más (mínimo 10 caracteres).').max(max));

const optionalClean = (max: number) =>
  z
    .string()
    .optional()
    .transform((s) => (s ?? '').replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim())
    .pipe(z.string().max(max))
    .transform((s) => (s === '' ? undefined : s));

export function createQuoteSchema(valid: { sectors: string[]; services: string[] }) {
  return z.object({
    sector: z.enum(['otro', ...valid.sectors] as [string, ...string[]], { error: 'Seleccione el tipo de inmueble.' }),
    services: z
      .array(z.enum(valid.services as [string, ...string[]]))
      .min(1, 'Seleccione al menos un servicio.')
      .max(LIMITS.maxServices),
    area: z.coerce.number().int().positive().max(LIMITS.maxArea).optional().catch(undefined),
    city: clean(LIMITS.city).pipe(z.string().min(2, 'Indique la ciudad.')),
    neighborhood: optionalClean(LIMITS.neighborhood),
    urgency: z.enum(URGENCY, { error: 'Seleccione la urgencia.' }),
    description: multiline(LIMITS.description),
    name: clean(LIMITS.name).pipe(z.string().min(2, 'Escriba su nombre.')),
    company: optionalClean(LIMITS.company),
    role: optionalClean(LIMITS.role),
    phone: z
      .string()
      .transform((s) => s.replace(/[^\d+]/g, ''))
      .pipe(z.string().regex(/^\+?\d{7,15}$/, 'Escriba un teléfono válido (7 a 15 dígitos).')),
    email: clean(LIMITS.email).pipe(z.email('Escriba un correo válido.')),
    channel: z.enum(CHANNELS, { error: 'Elija cómo prefiere que lo contactemos.' }),
    consent: z.literal('on', { error: 'Debe autorizar el tratamiento de datos para continuar.' }),
    policyVersion: z.string().max(20),
    /** Honeypot: humans never see this field, so it must arrive empty. */
    website: z.string().max(0).optional(),
    'cf-turnstile-response': z.string().max(2048).optional(),
  });
}

export type QuoteRequest = z.infer<ReturnType<typeof createQuoteSchema>>;

/** FormData → plain object (multi-value "services" becomes an array). */
export function formDataToObject(form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(form.keys())) {
    const values = form.getAll(key).filter((v): v is string => typeof v === 'string');
    out[key] = key === 'services' ? values : values[0];
  }
  return out;
}
