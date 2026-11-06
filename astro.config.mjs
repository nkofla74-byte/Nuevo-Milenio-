// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// Pages that must never appear in the sitemap (also carry noindex).
const PRIVATE_ROUTES = ['/sistema-de-diseno/', '/progreso/', '/academia/', '/cotizar/gracias/', '/404/', '/500/'];
// Placeholder case studies (noindex) stay out of the sitemap until replaced by real projects.
const PLACEHOLDER_PREFIX = '/proyectos/ejemplo-';

// https://astro.build/config
export default defineConfig({
  // [[PENDIENTE: dominio real]] — update before launch; canonical URLs and the sitemap depend on it.
  site: 'https://www.ejemplo.com.co',
  trailingSlash: 'always',
  output: 'static',
  adapter: cloudflare({ imageService: 'compile' }),
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    sitemap({
      filter: (page) => !PRIVATE_ROUTES.some((route) => page.includes(route)) && !page.includes(PLACEHOLDER_PREFIX),
    }),
  ],
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Barlow Condensed',
      cssVariable: '--font-barlow',
      weights: ['500', '600', '700'],
      subsets: ['latin'],
      fallbacks: ['Arial Narrow', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: ['400 700'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
