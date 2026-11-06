---
order: 8
title: Layout base, SEO y comportamiento global
summary: El esqueleto que envuelve cada página — head, canonical, Open Graph, JSON-LD —, el encabezado que se oculta, el menú móvil sin JavaScript, el banner de cookies y la decisión CSP vs. ClientRouter.
status: verificado
phase: Fase 1–2
files:
  - src/layouts/BaseLayout.astro
  - src/lib/seo.ts
  - src/components/layout/Header.astro
  - src/components/layout/Footer.astro
  - src/components/layout/CookieBanner.astro
  - src/lib/consent.ts
  - src/styles/global.css (@view-transition)
quiz:
  - q: "¿Qué es la etiqueta canonical y qué problema resuelve? ¿De dónde saca BaseLayout el dominio para construirla?"
  - q: "En Header.astro, el evento scroll usa requestAnimationFrame y una variable 'ticking'. ¿Qué pasaría sin eso?"
  - q: "El menú móvil funciona aunque falle el JavaScript. ¿Qué etiqueta HTML lo permite?"
  - q: "¿Por qué el script de analítica no está escrito en el HTML, sino que lo inyecta applyConsent()? ¿Qué ley y qué principio se respetan así?"
  - q: "Explica con tus palabras por qué no usamos el ClientRouter de Astro."
---

## El layout: resolver una vez lo que todas las páginas necesitan

**Qué es:** `BaseLayout.astro` es un componente que envuelve cada página. Cada página le pasa sus datos propios y él arma todo lo común.

```astro
<BaseLayout title="Drywall en Bogotá" description="Muros en drywall…">
  …contenido propio de la página…      ← entra por <slot />
</BaseLayout>
```

**Qué problema resuelve:** con 40 páginas, sería fácil que una se quedara sin `canonical`, sin idioma o sin JSON-LD. Al centralizarlo, **es imposible olvidarlo**.

### Lo que genera, bloque por bloque

```astro
const origin = Astro.site ?? new URL('https://www.ejemplo.com.co');   // ① el dominio de astro.config
const canonical = new URL(Astro.url.pathname, origin);                // ② URL absoluta de ESTA página
const ogSlug = ogImage ?? (Astro.url.pathname.replace(/^\/|\/$/g, '').replaceAll('/', '--') || 'inicio');
const fullTitle = Astro.url.pathname === '/' ? title : `${title} | ${site.brandName}`;
const schemas = [organizationJsonLd(origin), ...jsonLd].filter(Boolean);
```

1. **`Astro.site`** es el `site` de `astro.config.mjs`. Así se conectan la configuración y cada página.
2. **`canonical`** le dice a Google cuál es "la URL oficial" de la página, por si llega con parámetros (`?utm_source=…`) o por otra ruta. Sin ella, Google podría indexar versiones duplicadas.
3. **Imagen Open Graph:** `/servicios/drywall/` se convierte en `og/servicios--drywall.png`. Esas imágenes se generarán en una fase posterior. **Hoy esa URL todavía no existe** (lo dejo dicho para no darlo por hecho).
4. El título lleva la marca al final, excepto en el inicio, que ya la tiene al principio.
5. Todas las páginas incluyen el JSON-LD de la organización, y cada página puede agregar el suyo (Service, FAQPage, BreadcrumbList).

### JSON-LD: hablarle a Google en su idioma

```html
<script type="application/ld+json">
{ "@context": "https://schema.org", "@type": ["Organization","GeneralContractor"],
  "name": "Nombre Empresa", "address": { "@type":"PostalAddress", "addressLocality":"Bogotá D.C." }, … }
</script>
```

Es un bloque de **datos**, no de código: el navegador no lo ejecuta (por eso no choca con la CSP). Google lo lee para entender sin ambigüedad que esto es un contratista en Bogotá con tal horario. Ayuda en la búsqueda local y en Maps. Recuerda del módulo 5: los campos pendientes se **omiten**.

### Accesibilidad global

```astro
<html lang="es-CO">
<a href="#contenido" class="sr-only focus:not-sr-only …">Saltar al contenido</a>
<main id="contenido" tabindex="-1">
```

- **`lang="es-CO"`**: el lector de pantalla pronuncia en español; Google sabe el idioma y la región.
- **"Saltar al contenido"**: es invisible hasta que alguien pulsa Tab. Permite a quien navega con teclado saltarse el menú (7 enlaces) en cada página. Es un requisito WCAG.
- **`tabindex="-1"`** en `<main>`: permite que el salto mueva el foco al contenido.

## `Header.astro`: el encabezado que se oculta

```js
let last = window.scrollY;
let ticking = false;
const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 24);                       // ① fondo al bajar
  header.classList.toggle('is-hidden', !menuOpen && y > last && y > 240); // ② ocultar al bajar
  last = y;
  ticking = false;
};
window.addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }    // ③
}, { passive: true });                                                   // ④
```

1. Después de 24 px de scroll, el encabezado gana fondo y desenfoque, para que el texto no se pierda sobre el contenido.
2. Si el usuario baja (`y > last`) se oculta; si sube, aparece. Nunca se oculta con el menú abierto.
3. **El problema del scroll:** el evento `scroll` puede dispararse decenas de veces por fotograma. Si cada vez tocáramos el DOM, el navegador haría trabajo inútil y el scroll se sentiría trabado (*jank*). Con `requestAnimationFrame` + `ticking`, el trabajo se agenda **una sola vez por fotograma**, justo antes de pintar.
4. **`passive: true`** promete que no llamaremos `preventDefault()`. Así el navegador puede desplazar sin esperar a nuestro código.

La animación de ocultar usa `transform: translateY(-100%)`. **Por qué `transform` y no `top`:** cambiar `top` obliga a recalcular el layout; `transform` lo resuelve la GPU en la etapa de composición. Es la regla 7.4 de tu prompt.

### El menú móvil sin JavaScript

```html
<details class="mobile-menu">
  <summary aria-label="Abrir menú">☰</summary>
  <nav>…enlaces…</nav>
</details>
```

`<details>`/`<summary>` es un elemento HTML nativo que **abre y cierra sin JavaScript**. Si el JS falla o tarda, el menú funciona igual. Con CSS (`.mobile-menu[open]`) cambiamos el ícono de hamburguesa por la X. El único JS es un extra: cerrar con Escape.

## El banner de cookies: consentimiento real

```
 carga la página
     │
     ▼
 readConsent() ── lee localStorage['cookie-consent']
     │
     ├── hay decisión vigente (misma versión) ──► applyConsent(decisión) ──► (carga analítica solo si dijo sí)
     │
     └── no hay ──► muestra el banner
                       │ Aceptar / Rechazar / Configurar → Guardar
                       ▼
                 writeConsent({analytics, marketing}) ──► applyConsent()
```

- **Nada no esencial se carga antes del consentimiento.** El script de analítica no está en el HTML; `applyConsent()` lo crea solo si `analytics === true` y existe el token (`PUBLIC_CF_ANALYTICS_TOKEN`, todavía no configurado).
- **"Rechazar" es igual de visible que "Aceptar".** Esconderlo sería un *dark pattern*, contrario al consentimiento libre que exige la Ley 1581.
- **`version`**: si la política cambia, se sube `CONSENT_VERSION` y el banner vuelve a preguntar.
- **Se puede cambiar después:** el botón del footer `[data-cookie-settings]` reabre el panel.

## La decisión de arquitectura: CSP estricta vs. transiciones

Tu prompt pide dos cosas que en Astro 7 chocan:
1. **CSP estricta:** una cabecera que le dice al navegador "solo ejecuta scripts de mi dominio". Si alguien lograra inyectar un `<script>`, el navegador lo bloquearía.
2. **Transiciones entre páginas** con el `<ClientRouter />` de Astro.

Leí la documentación de la versión instalada (`node_modules/astro/dist/types/public/config.d.ts`). Dice textualmente que el CSP de Astro no es compatible con `<ClientRouter />`.

**Lo que elegí:**

```css
@view-transition { navigation: auto; }
@media (prefers-reduced-motion: reduce) { @view-transition { navigation: none; } }
```

Son las **View Transitions nativas entre documentos**: el navegador anima el paso de una página a otra **sin JavaScript**. Donde no hay soporte, la navegación es normal (mejora progresiva).

**Ventaja extra:** cada navegación carga una página nueva, así que las animaciones de GSAP de la página anterior desaparecen solas. Se elimina el riesgo de *ScrollTriggers* huérfanos que menciona la sección 7.4 de tu prompt.

**Lo que falta (honestamente):** las cabeceras de seguridad (`_headers`) aún no están escritas. Se verán en el módulo 14.
