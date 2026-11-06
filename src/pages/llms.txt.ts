import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../config/site';

/** Plain-text business summary for AI search engines (llms.txt convention). */
export const GET: APIRoute = async ({ site: origin }) => {
  const services = (await getCollection('servicios')).filter((s) => !s.data.needsConfirmation).sort((a, b) => a.data.order - b.data.order);
  const sectors = (await getCollection('sectores')).sort((a, b) => a.data.order - b.data.order);
  const url = (p: string) => new URL(p, origin).href;
  const body = [
    `# ${site.brandName}`,
    '',
    `> Empresa colombiana de soluciones integrales para la intervención de inmuebles, de la demolición a la entrega llave en mano. Un solo proveedor para todas las especialidades. Sede: ${site.city}.`,
    '',
    '## Servicios',
    ...services.map((s) => `- [${s.data.title}](${url(`/servicios/${s.id}/`)}): ${s.data.summary}`),
    '',
    '## Sectores',
    ...sectors.map((s) => `- [${s.data.title}](${url(`/sectores/${s.id}/`)}): ${s.data.headline}`),
    '',
    '## Contacto',
    `- [Solicitar cotización](${url('/cotizar/')})`,
    `- [Contacto](${url('/contacto/')})`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
