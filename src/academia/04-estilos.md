---
order: 4
title: Estilos, design tokens y fuentes
summary: Cómo Tailwind v4 convierte variables CSS en clases, por qué existen los design tokens, cómo se autoalojan las fuentes y cómo se dibuja la retícula de plano sin imágenes.
status: verificado
phase: Fase 1 — Cimientos
files:
  - src/styles/global.css
  - astro.config.mjs (bloque fonts)
quiz:
  - q: "¿Qué es un design token? Da un ejemplo de este proyecto y explica qué ganamos frente a escribir el color en cada lugar."
  - q: "Escribí por error --font-display: var(--font-display). ¿Por qué eso rompe la fuente y cómo se corrigió?"
  - q: "¿Por qué autoalojamos las fuentes en vez de enlazar Google Fonts? Menciona una razón de rendimiento y una de privacidad."
  - q: "La clase .blueprint-grid dibuja una cuadrícula sin ninguna imagen. Explica cómo lo hace."
---

## Qué es un design token

**Qué es:** una decisión de diseño con nombre propio. En lugar de "naranja `#f2611d`", decimos `accent`: "el color de las acciones".

**Qué problema resuelve:** sin tokens, el mismo naranja termina escrito 40 veces, a veces como `#f2611d`, a veces como `#f26020` porque alguien lo copió mal. Cuando la marca define su color oficial, hay que buscar y reemplazar en todo el proyecto, y siempre se escapa alguno. Con tokens, se cambia **una línea**.

## Cómo funciona en Tailwind v4

Abre `src/styles/global.css`:

```css
@import 'tailwindcss';          /* ① trae Tailwind completo */

@theme {                         /* ② define los tokens */
  --color-carbon: #16151a;
  --color-accent: #f2611d;
  --font-display: var(--font-barlow), 'Arial Narrow', sans-serif;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Lo que hace Tailwind por dentro con `@theme`:

```
--color-accent: #f2611d    ──►  crea las clases  bg-accent, text-accent, border-accent,
                                                 ring-accent, decoration-accent, ...
                           ──►  y deja la variable disponible en todo el CSS: var(--color-accent)

--font-display: ...        ──►  crea la clase  font-display
--ease-out-expo: ...       ──►  crea la clase  ease-out-expo
```

Además, Tailwind **solo genera el CSS de las clases que realmente usas**. Revisa todos tus archivos buscando nombres de clases y produce únicamente esas reglas. Por eso el CSS final pesa pocos KB aunque Tailwind "tenga" miles de clases posibles.

**Alternativas:**
- *CSS a mano con variables:* funciona, pero hay que escribir cada regla y mantener la consistencia de forma manual.
- *Tailwind v3 con `tailwind.config.js`:* la versión anterior definía los tokens en JavaScript. La v4 los define en CSS, que es más directo y estándar.

## Las capas del CSS: `@layer base` y `@layer components`

```css
@layer base {
  body { @apply bg-bone text-carbon font-body antialiased; }
  h1, h2, h3, h4 { @apply font-display uppercase; line-height: .95; }
  :focus-visible { outline: 3px solid var(--color-accent); outline-offset: 3px; }
}
```

- **`base`:** estilos por defecto de las etiquetas HTML. Todo `h1` del sitio ya sale en la fuente condensada y en mayúsculas sin que tengas que repetirlo.
- **`components`:** clases propias reutilizables (`.container-x`, `.blueprint-grid`, `.pending`).
- **`@apply`:** usa clases de Tailwind dentro del CSS.

**Por qué capas:** definen quién gana si dos reglas chocan. Las utilidades (`text-5xl`) siempre ganan sobre `base`, así que puedes sobrescribir un `h1` puntual con una clase sin pelear con la especificidad.

### Accesibilidad desde la base

```css
:focus-visible { outline: 3px solid var(--color-accent); }
```
Cuando navegas **con teclado** (Tab), el elemento activo queda rodeado de naranja. `:focus-visible` (y no `:focus`) hace que el contorno no aparezca al hacer clic con el mouse, solo cuando hace falta. **Si no lo tuviéramos:** una persona que no usa mouse no sabría dónde está parada. Es un requisito de WCAG 2.2.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```
Algunas personas configuran su sistema para reducir el movimiento (por mareo o migraña). El navegador expone esa preferencia y aquí la respetamos en todo el CSS. Las animaciones de GSAP la respetarán por su cuenta (módulo de animación, pendiente).

## La retícula de plano técnico sin imágenes

```css
.blueprint-grid {
  background-image:
    linear-gradient(to right,  rgb(140 134 126 / .14) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(140 134 126 / .14) 1px, transparent 1px);
  background-size: 48px 48px;
}
```

Paso a paso:
1. `linear-gradient(to right, color 1px, transparent 1px)` = una franja de color de 1 px y el resto transparente: una **línea vertical**.
2. El segundo degradado hace lo mismo hacia abajo: una **línea horizontal**.
3. `background-size: 48px 48px` hace que ese "azulejo" de 48×48 se repita: **una cuadrícula**.

**Por qué así y no con una imagen:** pesa cero bytes, se ve nítida en cualquier pantalla y el color se cambia en el CSS. Es el motivo visual de "plano técnico" que pide tu concepto creativo.

## Fuentes autoalojadas

En `astro.config.mjs`:

```js
fonts: [
  { provider: fontProviders.fontsource(), name: 'Barlow Condensed',
    cssVariable: '--font-barlow', weights: ['500','600','700'], subsets: ['latin'],
    fallbacks: ['Arial Narrow', 'sans-serif'] },
  { provider: fontProviders.fontsource(), name: 'Inter',
    cssVariable: '--font-inter', weights: ['400 700'], subsets: ['latin'] },
]
```

**Cómo funciona por dentro** (lo comprobé en la página de progreso):

```
 build / dev
   │  Astro pide a Fontsource los archivos de Barlow Condensed (500, 600, 700, solo latín)
   ▼
 los guarda y los sirve desde TU servidor:  /_astro/fonts/font-barlow-700-normal-latin-<hash>.woff2
   │
   ▼
 el componente <Font cssVariable="--font-barlow" preload /> inyecta en el <head>:
   • @font-face { font-family: ...; src: url(/_astro/fonts/...woff2); font-display: swap }
   • <link rel="preload" href="/_astro/fonts/...woff2" as="font">   ← empieza a descargar YA
   • --font-barlow: "Barlow Condensed", <fallback ajustado>
```

- **`subsets: ['latin']`:** solo los caracteres del alfabeto latino (incluye tildes y la ñ). No se descargan cirílico ni griego.
- **`weights: ['400 700']` en Inter:** es una fuente **variable**: un solo archivo contiene todos los grosores del 400 al 700.
- **`preload`:** sin esto, el navegador descubre que necesita la fuente solo cuando ya leyó el CSS. Con preload, empieza a descargarla de inmediato. En el sitio público precargo **solo el peso 700** (el de los titulares grandes), porque precargar todo competiría con cosas más importantes.
- **`fallbacks` y `font-display: swap`:** mientras llega la fuente, se muestra Arial Narrow ajustada a medidas parecidas. Así el texto se ve desde el primer instante y el diseño no "salta" al cambiar la fuente (eso afectaría la métrica CLS).

**Por qué no enlazar Google Fonts directamente:**
- **Privacidad:** cada visita le enviaría la IP del visitante a Google. En Europa ya hubo multas por eso, y la Ley 1581 también aplica al tratamiento de datos.
- **Rendimiento:** son dos conexiones extra a otro dominio (DNS + TLS) antes de poder descargar la fuente.

### Un error mío, corregido (y lo que enseña)

Al principio escribí:

```css
--font-display: var(--font-display), 'Arial Narrow', sans-serif;
```

Una variable que se referencia **a sí misma** es un ciclo, y el CSS la declara inválida. Resultado: ninguna fuente. La corrección fue separar dos capas con nombres distintos:

```
Astro crea   --font-barlow   (la fuente física descargada)
Tailwind usa --font-display  (el rol semántico: "fuente de titulares")  = var(--font-barlow), fallbacks
```

**Lección:** separar *qué recurso es* (Barlow) de *para qué se usa* (display) permite cambiar la fuente de titulares mañana tocando una sola línea.
