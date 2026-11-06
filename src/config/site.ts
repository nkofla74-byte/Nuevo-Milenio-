/**
 * Single source of truth for business data.
 * Every value marked `PENDING` renders as a visible `[[PENDIENTE: …]]` marker — never replace it with invented data.
 * Track open items in CONTENT_TODO.md.
 */

export const PENDING = Symbol('pending');
export type Maybe<T> = T | typeof PENDING;

export const isPending = <T>(v: Maybe<T>): v is typeof PENDING => v === PENDING;

export const site = {
  /** Short form of the legal name; `brandPending` flags it until the client confirms the commercial name. */
  brandName: 'Nuevo Milenio',
  brandPending: true,
  legalName: 'Construcciones y Acabados Nuevo Milenio S.A.S.' as Maybe<string>,
  nit: '901.081.765-0' as Maybe<string>,
  companyType: 'S.A.S.' as Maybe<string>,
  /** CIIU 4330 (terminación y acabado de edificios) y 4390 (otras actividades especializadas de construcción). */
  economicActivities: ['4330', '4390'],
  address: 'Calle 38 B Sur No. 88F-19' as Maybe<string>,
  city: 'Bogotá D.C.',
  region: 'Bogotá D.C.',
  country: 'CO',
  coverage: 'Bogotá D.C. y Sabana de Bogotá; proyectos en otras ciudades bajo evaluación', // [[PENDIENTE: confirmar]]
  phone: '+57 312 640 7862' as Maybe<string>,
  /** WhatsApp number in international format without "+" or spaces, e.g. 573001234567. */
  whatsapp: PENDING as Maybe<string>,
  email: PENDING as Maybe<string>,
  privacyEmail: PENDING as Maybe<string>,
  domain: PENDING as Maybe<string>,
  yearsExperience: PENDING as Maybe<number>,
  openingHours: 'Lunes a viernes 7:00 a. m. – 5:00 p. m.; sábados 8:00 a. m. – 12:00 m.', // [[PENDIENTE: confirmar]]
  openingHoursSchema: ['Mo-Fr 07:00-17:00', 'Sa 08:00-12:00'],
  social: [] as { name: string; url: string }[],
  /** Real, verifiable figures only. */
  stats: [
    { label: 'm² intervenidos', value: PENDING as Maybe<number>, suffix: '+' },
    { label: 'proyectos entregados', value: PENDING as Maybe<number>, suffix: '+' },
    { label: 'años de experiencia', value: PENDING as Maybe<number>, suffix: '' },
    { label: 'ciudades', value: PENDING as Maybe<number>, suffix: '' },
  ],
  /** Clients with written authorization to show their logo. Section stays hidden while empty. */
  authorizedClients: [] as { name: string; logo: string }[],
  /** Real testimonials only. Section stays hidden while empty. */
  testimonials: [] as { quote: string; author: string; role: string; company?: string }[],
  certifications: [
    { name: 'SG-SST (Decreto 1072 de 2015)', status: PENDING as Maybe<string> },
    { name: 'Trabajo seguro en alturas (Res. 4272 de 2021)', status: PENDING as Maybe<string> },
    { name: 'Póliza de responsabilidad civil extracontractual', status: PENDING as Maybe<string> },
    { name: 'Afiliación del personal a ARL y seguridad social', status: PENDING as Maybe<string> },
  ],
  /** Policy version shown in consent records. Bump whenever the data policy text changes. */
  privacyPolicyVersion: '0.1-borrador',
  /** Months to keep quote requests before deletion/anonymization. */
  retentionMonths: PENDING as Maybe<number>,
  /** Claims the company still has to confirm before they can appear as facts. */
  confirmNightShifts: false,
} as const;

export const display = (v: Maybe<string | number>, label: string): string => (isPending(v) ? `[[PENDIENTE: ${label}]]` : String(v));

export const whatsappUrl = (message: string): string | null =>
  isPending(site.whatsapp) ? null : `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;

export const nav = [
  { href: '/servicios/', label: 'Servicios' },
  { href: '/sectores/', label: 'Sectores' },
  { href: '/proyectos/', label: 'Proyectos' },
  { href: '/proceso/', label: 'Proceso' },
  { href: '/nosotros/', label: 'Nosotros' },
  { href: '/blog/', label: 'Blog' },
  { href: '/contacto/', label: 'Contacto' },
];

export const legalNav = [
  { href: '/legal/politica-de-tratamiento-de-datos/', label: 'Política de tratamiento de datos' },
  { href: '/legal/aviso-de-privacidad/', label: 'Aviso de privacidad' },
  { href: '/legal/politica-de-cookies/', label: 'Política de cookies' },
  { href: '/legal/terminos-y-condiciones/', label: 'Términos y condiciones' },
];
