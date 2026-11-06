import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap-index.xml', site).href;
  return new Response(['User-agent: *', 'Allow: /', 'Disallow: /sistema-de-diseno/', 'Disallow: /cotizar/gracias/', '', `Sitemap: ${sitemap}`, ''].join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
