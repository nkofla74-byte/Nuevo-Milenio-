/**
 * Generates one 1200×630 Open Graph PNG per public page into public/og/.
 * Runs in Node before `astro build` (sharp is a native module and cannot run inside
 * the Workers runtime that prerenders pages). File names mirror BaseLayout's ogSlug.
 */
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public', 'og');
const BRAND = 'Nuevo Milenio'; // keep in sync with site.brandName in src/config/site.ts

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Reads `title:` from a Markdown file's frontmatter. */
async function titleOf(file) {
  const src = await readFile(file, 'utf8');
  const m = src.match(/^title:\s*"(.*)"\s*$/m);
  return m ? JSON.parse(`"${m[1]}"`) : path.basename(file, '.md');
}

/** Greedy word wrap for the SVG title (no text measurement available in SVG). */
function wrap(text, max = 19) {
  const lines = [];
  let line = '';
  for (const word of text.toUpperCase().split(/\s+/)) {
    if ((line + ' ' + word).trim().length > max && line) {
      lines.push(line);
      line = word;
    } else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function svg(title, eyebrow) {
  const lines = wrap(title);
  const size = lines.length > 3 ? 74 : 88;
  const grid =
    Array.from({ length: 26 }, (_, i) => `<path d="M${i * 48} 0V630" />`).join('') +
    Array.from({ length: 14 }, (_, i) => `<path d="M0 ${i * 48}H1200" />`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#16151a"/>
  <g stroke="#f5f1ea" stroke-opacity="0.06">${grid}</g>
  <rect x="0" y="606" width="1200" height="24" fill="#f2611d"/>
  <text x="72" y="110" font-family="DejaVu Sans Mono, monospace" font-size="22" letter-spacing="5" fill="#c4beb5">${esc(eyebrow.toUpperCase())}</text>
  <path d="M72 140H160" stroke="#f2611d" stroke-width="3"/>
  ${lines.map((l, i) => `<text x="72" y="${240 + i * (size + 6)}" font-family="Barlow Condensed, Arial Narrow, DejaVu Sans Condensed, sans-serif" font-weight="700" font-size="${size}" fill="#f5f1ea">${esc(l)}</text>`).join('\n  ')}
  <text x="72" y="560" font-family="DejaVu Sans, sans-serif" font-size="26" font-weight="700" fill="#f5f1ea">${esc(BRAND.toUpperCase())}</text>
  <text x="1128" y="560" text-anchor="end" font-family="DejaVu Sans, sans-serif" font-size="22" fill="#f2611d">De obra negra a obra terminada</text>
</svg>`;
}

async function collection(name, prefix, eyebrow) {
  const dir = path.join(ROOT, 'src', 'content', name);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md'));
  return Promise.all(files.map(async (f) => ({ slug: `${prefix}--${f.replace(/\.md$/, '')}`, title: await titleOf(path.join(dir, f)), eyebrow })));
}

const pages = [
  { slug: 'inicio', title: 'Transformamos espacios. Construimos soluciones.', eyebrow: 'Construcción y remodelación integral' },
  { slug: 'default', title: 'Un solo proveedor en lugar de diez.', eyebrow: 'Construcción y remodelación integral' },
  { slug: 'servicios', title: 'Servicios', eyebrow: 'Catálogo' },
  { slug: 'sectores', title: 'Sectores que atendemos', eyebrow: 'Sectores' },
  { slug: 'proyectos', title: 'Proyectos', eyebrow: 'Portafolio' },
  { slug: 'proceso', title: 'Cómo trabajamos', eyebrow: 'Método' },
  { slug: 'nosotros', title: 'Nosotros', eyebrow: 'Quiénes somos' },
  { slug: 'proveedores', title: 'Kit de proveedor', eyebrow: 'Para áreas de compras' },
  { slug: 'blog', title: 'Guías de remodelación y mantenimiento', eyebrow: 'Blog' },
  { slug: 'cotizar', title: 'Solicitar cotización', eyebrow: 'Cotizador' },
  { slug: 'contacto', title: 'Contacto', eyebrow: 'Contacto' },
  { slug: 'preguntas-frecuentes', title: 'Preguntas frecuentes', eyebrow: 'Ayuda' },
  { slug: 'legal--politica-de-tratamiento-de-datos', title: 'Política de tratamiento de datos', eyebrow: 'Legal' },
  { slug: 'legal--aviso-de-privacidad', title: 'Aviso de privacidad', eyebrow: 'Legal' },
  { slug: 'legal--politica-de-cookies', title: 'Política de cookies', eyebrow: 'Legal' },
  { slug: 'legal--terminos-y-condiciones', title: 'Términos y condiciones', eyebrow: 'Legal' },
  ...(await collection('servicios', 'servicios', 'Servicio')),
  ...(await collection('sectores', 'sectores', 'Sector')),
  ...(await collection('proyectos', 'proyectos', 'Proyecto')),
  ...(await collection('blog', 'blog', 'Blog')),
];

await mkdir(OUT, { recursive: true });
await Promise.all(
  pages.map((p) =>
    sharp(Buffer.from(svg(p.title, p.eyebrow)))
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT, `${p.slug}.png`)),
  ),
);

// Placeholder wordmark logo referenced by the Organization JSON-LD. [[PENDIENTE: logo real]]
await writeFile(
  path.join(ROOT, 'public', 'logo.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#16151a"/><path d="M5 27V14l11-8 11 8v13" fill="none" stroke="#f5f1ea" stroke-width="2.5"/><path d="M11 27v-9h10v9" fill="none" stroke="#f2611d" stroke-width="2.5"/></svg>\n`,
);
console.log(`OG images: ${pages.length} generated in public/og/`);
