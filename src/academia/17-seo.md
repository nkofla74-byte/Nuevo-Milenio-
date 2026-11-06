---
order: 17
title: SEO — cómo Google encuentra y entiende el sitio
summary: Rastreo, indexación y posicionamiento explicados con el código real del sitio — title, description, canonical, h1, JSON-LD, sitemap, robots, enlazado interno, SEO local — y qué falta para que empiece a dar resultados.
status: verificado
phase: Transversal (Fases 1, 4 y 7)
files:
  - src/layouts/BaseLayout.astro
  - src/lib/seo.ts
  - src/content.config.ts (seoTitle ≤ 60, description ≤ 155)
  - src/pages/robots.txt.ts
  - astro.config.mjs (site, trailingSlash, sitemap)
  - public/_headers (X-Robots-Tag temporal)
  - docs/seo-keywords.md
  - docs/launch-checklist.md
quiz:
  - q: "Explica las tres etapas: rastreo, indexación y posicionamiento. ¿En cuál influye el sitemap y en cuál el contenido?"
  - q: "Hoy el canonical apunta a www.ejemplo.com.co. ¿Por qué eso impide que el SEO funcione y qué hay que cambiar cuando compres el dominio?"
  - q: "¿Por qué la URL temporal workers.dev tiene la cabecera X-Robots-Tag: noindex? ¿Qué pasaría si Google la indexara?"
  - q: "Para la búsqueda 'drywall Bogotá', ¿qué página del sitio debería aparecer y qué elementos del código la hacen relevante? Nombra al menos cuatro."
  - q: "¿Qué es Google Business Profile y por qué para un negocio local puede pesar más que el sitio web?"
---

## Las tres etapas: de no existir a aparecer en Google

```
 1. RASTREO            2. INDEXACIÓN              3. POSICIONAMIENTO
 (crawling)            (indexing)                 (ranking)
 Googlebot descarga    Google entiende la página  Ante una búsqueda, Google
 tus páginas           y decide si la guarda      ordena las páginas guardadas
       ▲                       ▲                            ▲
 sitemap, robots.txt,    HTML real, title, h1,      relevancia del contenido,
 enlaces internos,       canonical, JSON-LD,        calidad, enlaces externos,
 velocidad del servidor  sin noindex                velocidad, ubicación (local)
```

**Idea clave:** el SEO técnico (lo que construimos) asegura las etapas 1 y 2. Sin eso, el mejor contenido no aparece. Pero la etapa 3 depende también del **contenido**, de la **reputación** (otros sitios que te enlazan, reseñas) y del **tiempo**. Por eso el checklist dice: nadie puede garantizar primeras posiciones.

## Etapa 1 — que Google encuentre todo

### `sitemap-index.xml` (45 URLs)
Lo genera `@astrojs/sitemap` en cada build a partir de las páginas que existen. Es la lista que le entregaremos a Google en Search Console. El filtro de `astro.config.mjs` **excluye** las páginas que no deben indexarse:

```js
filter: (page) => !PRIVATE_ROUTES.some((r) => page.includes(r)) && !page.includes('/proyectos/ejemplo-')
```
Los proyectos de ejemplo están fuera del sitemap y con `noindex`: no queremos que Google posicione contenido de relleno.

### `robots.txt`
```
User-agent: *
Allow: /
Disallow: /sistema-de-diseno/
Disallow: /cotizar/gracias/
Sitemap: https://www.ejemplo.com.co/sitemap-index.xml
```
Le dice a los buscadores qué pueden rastrear y dónde está el sitemap. Ojo: `Disallow` **no** oculta una página (cualquiera puede abrirla); solo pide no rastrearla. Para no indexarla se usa `noindex`.

### Enlazado interno
Cada servicio enlaza a sus sectores, a servicios relacionados y a proyectos (módulo 11), y el footer enlaza a todo. Google descubre páginas siguiendo enlaces. Una página sin enlaces que apunten a ella se rastrea poco.

## Etapa 2 — que Google entienda cada página

Mira el `<head>` real de `/servicios/drywall-y-superboard/` (Ctrl+U en el navegador):

```html
<html lang="es-CO">
<title>Drywall en Bogotá | Muros y superboard | Nuevo Milenio</title>
<meta name="description" content="Muros en drywall y superboard para divisiones, fachadas livianas…">
<link rel="canonical" href="https://www.ejemplo.com.co/servicios/drywall-y-superboard/">
```

| Elemento | Qué hace | Dónde se controla |
|---|---|---|
| `title` | El título azul del resultado. Es la señal on-page más fuerte. Lleva la **palabra clave + ciudad** al inicio. | `seoTitle` del `.md` (Zod exige ≤ 60) |
| `description` | El texto bajo el título. No posiciona directamente, pero decide si la gente hace clic. | `description` del `.md` (≤ 155) |
| `h1` único | El tema principal de la página. | `PageHeader` con `title` |
| `lang="es-CO"` | Idioma y país. | `BaseLayout` |
| `canonical` | "Esta es la URL oficial". Concentra la relevancia en una sola URL. | `BaseLayout` + `site` |
| HTML real | Google lee texto, no canvas. Por eso el hero animado tiene el titular en HTML. | Toda la arquitectura (Astro) |

**Por qué Zod valida las longitudes:** si alguien escribe un `seoTitle` de 80 caracteres, Google lo corta con "…" y se pierde el final. El build falla antes de publicar ese error.

### Datos estructurados (JSON-LD)
En la misma página hay cuatro bloques, generados por `src/lib/seo.ts`:

```
Organization + GeneralContractor → quién eres: nombre, NIT, dirección, teléfono, horario
Service                          → qué es esta página: el servicio "Drywall y superboard"
FAQPage                          → las preguntas frecuentes (solo las que no tienen [[PENDIENTE]])
BreadcrumbList                   → dónde está: Inicio › Servicios › Drywall
```

Es vocabulario de schema.org: un idioma estándar que Google entiende sin ambigüedad. `GeneralContractor` es un subtipo de `LocalBusiness`; ayuda a que Google conecte el sitio con búsquedas locales y con el perfil de Maps. **Regla que cumplimos:** nunca marcar reseñas ni calificaciones que no existan. Google penaliza los datos estructurados falsos.

Se validan en la **Prueba de resultados enriquecidos** de Google (search.google.com/test/rich-results) cuando el sitio esté en el dominio real.

## Etapa 3 — relevancia: palabras clave y contenido

`docs/seo-keywords.md` tiene la tabla de **una palabra clave principal por página**:

```
/servicios/drywall-y-superboard/            → "drywall Bogotá"
/servicios/adecuacion-de-locales-comerciales/ → "adecuación de locales comerciales Bogotá"
/sectores/propiedad-horizontal/             → "mantenimiento propiedad horizontal"
```

**Por qué una por página:** si dos páginas apuntan a la misma búsqueda, compiten entre sí (*canibalización*). Cada servicio tiene su página propia justamente para poder posicionar cada búsqueda por separado.

**El blog** ataca las búsquedas de *información* ("drywall vs. mampostería", "cuánto cuesta remodelar un local"). Quien busca eso todavía no va a contratar, pero lo hará pronto. El artículo lo atrae y lo enlaza al servicio.

**Honestidad sobre los datos:** la tabla no tiene volúmenes de búsqueda porque no los inventé. Se miden con datos reales en Search Console o Keyword Planner, después del lanzamiento.

## SEO local: lo que más pesa para una constructora

Para "drywall Bogotá", Google muestra primero un **mapa con 3 negocios** (el *local pack*) y después los resultados normales. Ese mapa sale de **Google Business Profile**, no del sitio web. Factores:

1. **Perfil completo:** categoría correcta ("Contratista general"), horario, área de servicio, fotos reales de obras.
2. **NAP consistente** (*Name, Address, Phone*): el mismo nombre, dirección y teléfono en el perfil, en el sitio (footer y JSON-LD, que salen de `site.ts`) y en directorios. Por eso `site.ts` es la única fuente de verdad: si el teléfono cambia, cambia igual en todas partes.
3. **Reseñas reales** de clientes. Nunca falsas.
4. **El sitio web** como respaldo: el perfil enlaza al sitio, y el sitio refuerza con JSON-LD.

## El estado actual (con honestidad)

```
✔ SEO técnico en 45 páginas         ✔ sitemap, robots, JSON-LD, OG
✔ Lighthouse SEO = 100              ✔ publicado en workers.dev
✘ dominio real                      → canonical y sitemap apuntan a www.ejemplo.com.co
✘ Search Console / Business Profile → Google aún no sabe que existimos
⚠ noindex en workers.dev            → a propósito (ver abajo)
```

### Por qué la URL temporal tiene `noindex`

```
# public/_headers
https://:project.:account.workers.dev/*
  X-Robots-Tag: noindex, nofollow
```

Esa regla solo aplica cuando el sitio se sirve desde `*.workers.dev`. Si Google indexara la URL temporal, tendría **dos copias del sitio** (la temporal y la del dominio). Las dos competirían, y la temporal podría quedarse con la relevancia que debería ir al dominio. Cuando el dominio esté conectado, esa regla no le afecta (no coincide con el host) y el dominio sí se indexa.

### Qué haremos cuando compres el dominio
1. Cambiar `site` en `astro.config.mjs` → el canonical, el sitemap, robots y OG se actualizan solos en el build.
2. Conectar el dominio en Cloudflare y volver a publicar.
3. Search Console: verificar por DNS, enviar el sitemap, solicitar indexación de las páginas clave.
4. Crear el perfil de Google Business con el mismo NAP.
5. Medir: a las 2–4 semanas, en Search Console → Rendimiento, ves las búsquedas reales por las que apareces, las impresiones, los clics y la posición. Con eso se ajustan títulos y contenido.
