import { site, isPending } from '../config/site';

type JsonLd = Record<string, unknown>;

const opt = <T>(v: T | symbol): T | undefined => (typeof v === 'symbol' ? undefined : v);

export function organizationJsonLd(origin: URL): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'GeneralContractor'],
    '@id': new URL('/#organization', origin).href,
    name: site.brandName,
    legalName: opt(site.legalName),
    taxID: opt(site.nit),
    url: origin.href,
    logo: new URL('/logo.svg', origin).href,
    image: new URL('/og/default.png', origin).href,
    telephone: opt(site.phone),
    email: opt(site.email),
    address: isPending(site.address)
      ? { '@type': 'PostalAddress', addressLocality: site.city, addressRegion: site.region, addressCountry: site.country }
      : { '@type': 'PostalAddress', streetAddress: site.address, addressLocality: site.city, addressRegion: site.region, addressCountry: site.country },
    areaServed: [
      { '@type': 'City', name: 'Bogotá' },
      { '@type': 'AdministrativeArea', name: 'Cundinamarca' },
    ],
    openingHours: site.openingHoursSchema,
    sameAs: site.social.map((s) => s.url),
  };
}

export function serviceJsonLd(args: { name: string; description: string; url: URL; origin: URL; category: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: args.name,
    description: args.description,
    url: args.url.href,
    serviceType: args.category,
    provider: { '@id': new URL('/#organization', args.origin).href },
    areaServed: { '@type': 'City', name: 'Bogotá' },
  };
}

export function breadcrumbJsonLd(items: { href: string; label: string }[], origin: URL): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: new URL(c.href, origin).href,
    })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]): JsonLd | null {
  const clean = faqs.filter((f) => !f.a.includes('[[PENDIENTE'));
  if (!clean.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: clean.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export function articleJsonLd(args: { title: string; description: string; url: URL; origin: URL; published: Date; modified?: Date }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: args.title,
    description: args.description,
    mainEntityOfPage: args.url.href,
    datePublished: args.published.toISOString(),
    dateModified: (args.modified ?? args.published).toISOString(),
    author: { '@id': new URL('/#organization', args.origin).href },
    publisher: { '@id': new URL('/#organization', args.origin).href },
  };
}
