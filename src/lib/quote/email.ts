/** Builds the notification emails. Every user value is HTML-escaped; header values are single-line. */
import type { QuoteRequest } from './schema';

export const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Header-safe: no CR/LF (prevents header injection), bounded length. */
export const headerSafe = (s: string, max = 120): string => s.replace(/[\r\n]+/g, ' ').slice(0, max);

/** 203.0.113.42 → 203.0.113.0 ; IPv6 keeps the first 3 groups. Data minimization (Ley 1581). */
export function truncateIp(ip: string | null | undefined): string {
  if (!ip) return 'desconocida';
  if (ip.includes('.')) return ip.split('.').slice(0, 3).concat('0').join('.');
  return ip.split(':').slice(0, 3).join(':') + '::';
}

export interface ConsentRecord {
  acceptedAt: string;
  policyVersion: string;
  ipTruncated: string;
  userAgent: string;
}

export interface Labels {
  sector: string;
  services: string[];
  urgency: string;
  channel: string;
}

export function buildCompanyEmail(q: QuoteRequest, labels: Labels, consent: ConsentRecord, brand: string) {
  const rows: [string, string | undefined][] = [
    ['Nombre', q.name],
    ['Empresa / copropiedad', q.company],
    ['Cargo', q.role],
    ['Teléfono', q.phone],
    ['Correo', q.email],
    ['Canal preferido', labels.channel],
    ['Tipo de inmueble', labels.sector],
    ['Servicios', labels.services.join(', ')],
    ['Área aproximada', q.area ? `${q.area} m²` : undefined],
    ['Ciudad / barrio', [q.city, q.neighborhood].filter(Boolean).join(' · ')],
    ['Urgencia', labels.urgency],
  ];
  const table = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><th align="left" style="padding:6px 12px;background:#f5f1ea">${escapeHtml(k)}</th><td style="padding:6px 12px">${escapeHtml(v!)}</td></tr>`,
    )
    .join('');
  const html = `<h1 style="font-family:Arial,sans-serif">Nueva solicitud de cotización</h1>
<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${table}</table>
<h2 style="font-family:Arial,sans-serif">Descripción</h2>
<p style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(q.description)}</p>
<hr><p style="font-family:Arial,sans-serif;font-size:12px;color:#5e5953">
Prueba de autorización de tratamiento de datos (Ley 1581 de 2012): aceptada el ${escapeHtml(consent.acceptedAt)},
versión de la política ${escapeHtml(consent.policyVersion)}, IP ${escapeHtml(consent.ipTruncated)}.
Conserve este correo como soporte. Contacto comercial solo por el canal autorizado y en los horarios de la Ley 2300 de 2023.</p>`;
  const text = [
    'Nueva solicitud de cotización',
    ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    '',
    'Descripción:',
    q.description,
    '',
    `Autorización de datos: ${consent.acceptedAt} · política ${consent.policyVersion} · IP ${consent.ipTruncated}`,
  ].join('\n');
  return { subject: headerSafe(`Cotización: ${labels.services[0] ?? 'servicio'} — ${q.name} (${brand})`), html, text };
}

export function buildUserEmail(q: QuoteRequest, brand: string) {
  const html = `<p style="font-family:Arial,sans-serif">Hola ${escapeHtml(q.name)},</p>
<p style="font-family:Arial,sans-serif">Recibimos su solicitud de cotización. Nuestro equipo la revisará y lo contactará por el canal que eligió para agendar la visita técnica.</p>
<p style="font-family:Arial,sans-serif">Gracias por confiar en ${escapeHtml(brand)}.</p>`;
  const text = `Hola ${q.name},\n\nRecibimos su solicitud de cotización. Nuestro equipo la revisará y lo contactará por el canal que eligió.\n\n${brand}`;
  return { subject: headerSafe(`Recibimos su solicitud — ${brand}`), html, text };
}
