import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const CATEGORIES = {
  'obra-civil': 'Obra civil y demolición',
  remodelaciones: 'Remodelaciones y adecuaciones',
  acabados: 'Acabados',
  'sistemas-livianos': 'Sistemas livianos',
  instalaciones: 'Instalaciones técnicas',
  metalmecanica: 'Metalmecánica',
  'cubiertas-fachadas': 'Cubiertas y fachadas',
  mantenimiento: 'Mantenimiento',
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

const faq = z.object({ q: z.string(), a: z.string() });

const servicios = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/servicios' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().max(60),
    description: z.string().max(155),
    category: z.enum(Object.keys(CATEGORIES) as [CategoryKey, ...CategoryKey[]]),
    summary: z.string(),
    icon: z.string(),
    order: z.number(),
    /** Service the company has not confirmed yet; shown with a pending badge. */
    needsConfirmation: z.boolean().default(false),
    includes: z.array(z.string()),
    process: z.array(z.string()),
    materials: z.array(z.string()).default([]),
    typicalTimes: z.string(),
    faqs: z.array(faq).default([]),
    sectors: z.array(z.string()).default([]),
    whatsappMessage: z.string(),
  }),
});

const sectores = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sectores' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().max(60),
    description: z.string().max(155),
    headline: z.string(),
    audience: z.string(),
    icon: z.string(),
    order: z.number(),
    pains: z.array(z.string()),
    benefits: z.array(z.object({ title: z.string(), text: z.string() })),
    services: z.array(z.string()),
    faqs: z.array(faq).default([]),
  }),
});

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/proyectos' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(155),
    /** Placeholder case study: excluded from sitemap and marked noindex until real data replaces it. */
    placeholder: z.boolean().default(false),
    sector: z.string(),
    services: z.array(z.string()),
    city: z.string(),
    year: z.number().optional(),
    duration: z.string().optional(),
    area: z.string().optional(),
    challenge: z.string(),
    solution: z.string(),
    result: z.string(),
    palette: z.tuple([z.string(), z.string()]),
    featured: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().max(60),
    description: z.string().max(155),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    relatedServices: z.array(z.string()).default([]),
  }),
});

export const collections = { servicios, sectores, proyectos, blog };
