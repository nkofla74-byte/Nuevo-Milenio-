---
order: 3
title: Estructura del proyecto y configuración
summary: Qué hace cada carpeta y archivo, cómo funciona un componente .astro (build vs. navegador), cómo las rutas salen de los archivos y qué hace cada línea de astro.config.mjs.
status: verificado
phase: Fase 1 — Cimientos
files:
  - astro.config.mjs
  - tsconfig.json
  - src/pages/
  - src/components/
  - src/layouts/
  - src/lib/
  - src/config/
  - public/
quiz:
  - q: "En un archivo .astro, ¿qué diferencia hay entre el código entre los '---' y el código dentro de una etiqueta <script>? ¿Cuál llega al navegador del visitante?"
  - q: "Si creo el archivo src/pages/contacto.astro, ¿qué URL se genera? ¿Y con src/pages/servicios/[slug].astro?"
  - q: "¿Por qué configuramos trailingSlash: 'always'? ¿Qué problema de SEO evita?"
  - q: "output es 'static', pero el formulario necesita un servidor. ¿Cómo conviven las dos cosas en este proyecto?"
---

## El esqueleto: qué hace cada carpeta

Así está organizado el proyecto ahora mismo (lo que existe de verdad):

```
contruccion/
├── PLAN.md                    ← Fase 0: el plan aprobado
├── astro.config.mjs           ← configuración central de Astro
├── package.json / package-lock.json
├── tsconfig.json              ← reglas de TypeScript (modo estricto)
├── public/                    ← archivos que se copian TAL CUAL (favicon, robots…)
└── src/
    ├── pages/                 ← CADA ARCHIVO ES UNA URL
    ├── layouts/               ← esqueletos de página (head, header, footer)
    ├── components/
    │   ├── ui/                ← piezas pequeñas: Button, Icon, BeforeAfter…
    │   ├── layout/            ← Header, Footer, banner de cookies…
    │   └── internal/          ← panel de Progreso y Academia (solo desarrollo)
    ├── content/               ← servicios, sectores, proyectos, blog (Markdown)
    ├── content.config.ts      ← los "esquemas" que validan ese contenido
    ├── config/site.ts         ← datos del negocio (una sola fuente de verdad)
    ├── lib/                   ← lógica sin interfaz: SEO, consentimiento, animación
    ├── styles/global.css      ← tokens de diseño y estilos base
    ├── data/                  ← progress.json (panel de progreso)
    └── academia/              ← los módulos de esta academia
```

**Por qué esta separación:** cada carpeta tiene **una sola responsabilidad**. Cuando algo falle en el SEO, sabes que está en `src/lib/seo.ts`. Cuando cambie el teléfono, sabes que está en `src/config/site.ts`. En un proyecto donde todo está mezclado, cada cambio obliga a buscar por todas partes.

**La regla `ui` vs. `sections` vs. `layout`:**
- `ui/`: piezas genéricas que no saben nada del negocio (un botón no sabe qué es "drywall").
- `layout/`: piezas que aparecen en todas las páginas.
- `sections/` (aún no existe; llegará en la Fase 3): bloques grandes de una página concreta, como el hero.

## Cómo funciona un archivo `.astro`

Este es el concepto más importante del frontend de este proyecto. Mira `src/pages/progreso/[...index].astro`:

```astro
---
// ① FRONTMATTER: corre en Node, DURANTE EL BUILD (o en el servidor de desarrollo)
import progress from '../../data/progress.json';
const done = progress.phases.filter((p) => p.status === 'done').length;
---
<!-- ② PLANTILLA: HTML con expresiones { } -->
<p>{done} de {progress.phases.length} fases</p>
```

```
           BUILD (en tu máquina o en el servidor de CI)                 NAVEGADOR
┌──────────────────────────────────────────────────────┐
│ ① se ejecuta el frontmatter: lee el JSON, calcula done│
│ ② se rellena la plantilla: {done} → 1                 │ ─────►  <p>1 de 8 fases</p>
│ ③ resultado: texto HTML puro                          │         (no hay JS, solo HTML)
└──────────────────────────────────────────────────────┘
```

**El código del frontmatter nunca llega al visitante.** Lee archivos, calcula y desaparece. Por eso ahí se puede usar cualquier cosa de Node (leer archivos, por ejemplo) sin que pese en el navegador.

¿Y si quieres que algo **reaccione** en el navegador (un clic, el scroll)? Usas una etiqueta `<script>`:

```astro
<script>
  // Esto SÍ llega al navegador. Astro lo empaqueta, lo minifica y lo sirve como archivo .js
  window.addEventListener('scroll', ...);
</script>
```

| | Frontmatter `---` | `<script>` |
|---|---|---|
| ¿Dónde corre? | Node, en el build | Navegador del visitante |
| ¿Cuándo? | Una vez, al generar la página | Cada vez que alguien abre la página |
| ¿Pesa para el visitante? | No | Sí (por eso usamos poco) |
| Para qué | Leer datos, construir HTML | Interactividad, animaciones |

**Comparado con React:** en React, por defecto, todo el componente se envía al navegador como JavaScript y se vuelve a ejecutar allí ("hidratación"). Astro invierte esa lógica: **todo es HTML salvo lo que pidas explícitamente**. A esto se le llama *arquitectura de islas*: un mar de HTML estático con pequeñas islas interactivas.

## Rutas basadas en archivos

| Archivo | URL que genera |
|---|---|
| `src/pages/index.astro` | `/` |
| `src/pages/contacto.astro` | `/contacto/` |
| `src/pages/servicios/[slug].astro` | `/servicios/drywall-y-superboard/`, `/servicios/estuco-y-pintura/`… (una por cada servicio) |
| `src/pages/academia/[...modulo].astro` | `/academia/` y `/academia/01-arquitectura/`… |

Los corchetes `[slug]` indican una **ruta dinámica**: un solo archivo genera muchas páginas. El archivo exporta una función `getStaticPaths()` que le dice a Astro qué páginas generar. Lo verás en detalle en el módulo de páginas internas, cuando lo construya.

**Nota:** Astro ignora los archivos que empiezan por `_`. Por eso la página interna de componentes que pide tu prompt (`/_design`) no puede llamarse así; quedó planeada como `/sistema-de-diseno/` (anotado en `PLAN.md`).

## `astro.config.mjs`, línea por línea

```js
site: 'https://www.ejemplo.com.co',
```
**Qué hace:** declara el dominio definitivo. Astro lo usa para armar URLs absolutas: el `canonical`, el sitemap y la imagen que aparece al compartir un enlace.
**Si no estuviera:** el sitemap no se podría generar y las etiquetas `canonical` quedarían relativas, cosa que Google desaconseja. Hoy es un marcador hasta tener el dominio real.

```js
trailingSlash: 'always',
```
**Qué hace:** todas las URLs terminan en `/`.
**Qué problema resuelve:** si `/servicios` y `/servicios/` respondieran las dos, Google las vería como **dos páginas con el mismo contenido** (contenido duplicado) y repartiría la relevancia entre ambas. Con una sola forma de URL, eso no pasa.

```js
output: 'static',
adapter: cloudflare({ imageService: 'compile' }),
```
**Qué hace:** `static` = por defecto, todas las páginas se generan como HTML en el build. El **adaptador** de Cloudflare permite que una ruta concreta se marque con `export const prerender = false` y se convierta en una función que corre en el servidor de Cloudflare cuando llega una petición. Así funcionará `/api/cotizar` (pendiente).
**Alternativa:** `output: 'server'` haría que todas las páginas se generen en cada visita. Es más lento y más caro, y no lo necesitamos.
`imageService: 'compile'`: las imágenes se optimizan durante el build y no en cada visita.

```js
prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
```
**Qué hace:** cuando el usuario pasa el mouse sobre un enlace marcado, el navegador descarga esa página por adelantado. Al hacer clic, la página ya está ahí y la navegación se siente instantánea.

```js
integrations: [sitemap({ filter: (page) => !PRIVATE_ROUTES.some(...) })],
```
**Qué hace:** genera `sitemap-index.xml`, la lista de URLs que le entregamos a Google. El filtro excluye las páginas internas que no deben indexarse.

```js
fonts: [{ provider: fontProviders.fontsource(), name: 'Barlow Condensed', cssVariable: '--font-barlow', ... }]
```
Se explica en el módulo 4 (estilos).

```js
vite: { plugins: [tailwindcss()] },
```
**Qué hace:** Astro usa **Vite** por debajo (el empaquetador y servidor de desarrollo). Aquí le añadimos el plugin de Tailwind, que lee tus clases y genera el CSS.

## El servidor de desarrollo y la recarga en vivo

```bash
npx astro dev --background
```

Arranca Vite en `http://localhost:4321`. Así se actualiza en vivo la pestaña de Progreso:

```
 yo edito src/data/progress.json
            │
            ▼
 Vite vigila el disco ── detecta el cambio ──► sabe qué páginas importan ese JSON
                                                      │
                                                      ▼
                     regenera la página ── avisa al navegador por WebSocket ──► recarga
```

El WebSocket es una conexión que queda abierta entre Vite y tu navegador. Por ahí el servidor puede "empujar" un aviso ("hubo un cambio") sin que el navegador pregunte. Esto se llama *HMR* (*Hot Module Replacement*).
