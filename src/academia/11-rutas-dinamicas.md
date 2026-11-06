---
order: 11
title: Rutas dinámicas y páginas internas
summary: Cómo un archivo [slug].astro genera 20 páginas de servicio con getStaticPaths, getCollection y render; cómo se construye el enlazado interno; y el error de build que encontramos con workerd y cómo se aisló por bisección.
status: verificado
phase: Fase 4 — Páginas internas
files:
  - src/pages/servicios/[slug].astro
  - src/pages/sectores/[slug].astro
  - src/pages/proyectos/[slug].astro
  - src/pages/blog/[slug].astro
  - src/config/categories.ts
  - src/pages/robots.txt.ts
  - src/pages/llms.txt.ts
quiz:
  - q: "¿Qué devuelve getStaticPaths en servicios/[slug].astro y qué hace Astro con esa lista?"
  - q: "Si agrego el archivo src/content/servicios/instalacion-de-vidrios.md, ¿qué partes del sitio cambian sin tocar código? Nombra al menos tres."
  - q: "¿Qué es 'enlazado interno' y por qué la página de un servicio enlaza a sectores, servicios relacionados y proyectos?"
  - q: "El build fallaba con 'Failed to get static paths'. Explica qué es la bisección y cómo nos llevó a la causa."
---

## De un Markdown a una página

**Qué problema resuelve:** tenemos 20 servicios. Escribir 20 páginas a mano significaría 20 copias del mismo diseño, y cambiar el diseño exigiría editar las 20.

**Cómo funciona** (`src/pages/servicios/[slug].astro`):

```astro
export async function getStaticPaths() {
  const services = await getCollection('servicios');            // ① lee los 20 .md validados
  return services.map((service) => ({
    params: { slug: service.id },                               // ② la URL: /servicios/<id>/
    props: { service },                                          // ③ los datos que recibirá la página
  }));
}
const { service } = Astro.props;
const { Content } = await render(service);                       // ④ Markdown → componente HTML
```

```
 BUILD
 getStaticPaths() ──► [ {slug:'drywall-y-superboard', service}, {slug:'estuco-y-pintura', …}, … ×20 ]
        │
        └─► por cada elemento, Astro ejecuta la plantilla con esas props
                 └─► dist/servicios/drywall-y-superboard/index.html
                     dist/servicios/estuco-y-pintura/index.html   …
```

1. `getCollection` devuelve las entradas **ya validadas** por el esquema Zod (módulo 5).
2. `params.slug` llena el `[slug]` del nombre del archivo.
3. `props` pasa la entrada completa a la plantilla, para no tener que buscarla otra vez.
4. `render()` convierte el cuerpo Markdown en un componente `<Content />`.

**Qué pasa al agregar un servicio:** se crea su página, aparece en el catálogo con su filtro, en el cotizador (paso 2), en el sitemap, en `llms.txt`, en las FAQ generales (si tiene preguntas) y en el JSON-LD. **Todo sin tocar código.**

## Enlazado interno: servicio ↔ sector ↔ proyecto

```ts
const sectors = (await getCollection('sectores')).filter((s) => d.sectors.includes(s.id));
const related = (await getCollection('servicios')).filter((s) => s.id !== service.id && s.data.category === d.category).slice(0, 3);
const projects = (await getCollection('proyectos')).filter((p) => p.data.services.includes(service.id));
```

Los datos del frontmatter (`sectors: [...]` en el servicio, `services: [...]` en el proyecto) funcionan como **relaciones**, igual que las claves foráneas de una base de datos, pero en archivos. Con eso cada página enlaza a las relacionadas.

**Por qué importa para SEO:** Google descubre y entiende las páginas siguiendo enlaces. Una página sin enlaces que apunten a ella (*huérfana*) cuesta indexarla. Además, el texto del enlace ("Drywall y superboard") le dice a Google de qué trata la página destino. Para el usuario, es el camino natural: "vi drywall, ¿lo hacen en oficinas? ¿Tienen un caso?".

## Endpoints que generan texto: `robots.txt` y `llms.txt`

```ts
export const GET: APIRoute = ({ site }) => new Response(`…Sitemap: ${new URL('/sitemap-index.xml', site)}`);
```

Un archivo `.ts` en `pages/` que exporta `GET` no genera HTML: genera **cualquier respuesta**. Como el sitio es estático, se ejecuta en el build y produce el archivo `robots.txt`. La ventaja frente a escribirlo a mano en `public/` es que usa el `site` de la configuración: cuando cambie el dominio, la URL del sitemap se actualiza sola.

## El error del build y la bisección (una lección de depuración)

**Síntoma:** `npm run build` fallaba con `Failed to get static paths from the Cloudflare prerender server … The argument 'path' must be … Received 'undefined'`. El mensaje no decía qué página fallaba.

**Contexto clave:** el adaptador de Cloudflare 14 **prerenderiza dentro de workerd**, el runtime de Workers, no en Node. En workerd no existe el sistema de archivos de Node.

**Bisección** (búsqueda binaria de la causa):

```
todas las páginas ............................. FALLA
sin academia/progreso ......................... FALLA   → no son ellas
solo 404 (usa BaseLayout completo) ............ OK      → el layout está bien
+ robots, llms ................................ OK
+ índices con getCollection ................... OK
+ servicios/[slug] ............................ FALLA   → ¡aquí!
ruta dinámica mínima .......................... OK
  + getCollection ............................. OK
  + render() .................................. OK
ruta mínima + import { CATEGORIES } from content.config … FALLA  ✔ causa
```

**Causa:** `content.config.ts` importa `glob` de `astro/loaders`, que usa el sistema de archivos de Node. Al importarlo desde una página, ese código terminaba dentro de workerd.

**Solución:** mover `CATEGORIES` a `src/config/categories.ts`. Ahora `content.config.ts` lo importa desde ahí, nunca al revés. Quedó documentado en `docs/adr/0003` y en un comentario dentro del archivo, para que nadie lo "simplifique" de vuelta.

> **Lecciones:** (1) cuando el error no dice dónde está, **divide el problema a la mitad** hasta encontrarlo; (2) sepa en qué entorno corre cada parte de su código (Node en el build, workerd en el prerender, navegador en el cliente); (3) los archivos de configuración no son módulos de utilidades: no los importe desde cualquier lado.
