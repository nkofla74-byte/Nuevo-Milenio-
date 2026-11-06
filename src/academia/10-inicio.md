---
order: 10
title: La página de inicio y el scroll narrativo
summary: Cómo se compone el inicio a partir de secciones, cómo funciona por dentro cada experiencia (hero, capa por capa, proyectos horizontales, pestañas, proceso), qué falló al probarlo y cómo se verificó en escritorio, móvil y reduced-motion.
status: verificado
phase: Fase 3 — Inicio
files:
  - src/pages/index.astro
  - src/components/sections/HeroTransformation.astro
  - src/components/sections/LayerByLayer.astro
  - src/components/sections/ServicesGrid.astro
  - src/components/sections/SectorTabs.astro
  - src/components/sections/ProjectsShowcase.astro
  - src/components/sections/ProcessTimeline.astro
  - src/components/sections/SectionIndex.astro
quiz:
  - q: "El hero empieza en 'obra negra' y termina 'terminado'. ¿Qué propiedad CSS revela la capa terminada y por qué esa y no 'height'?"
  - q: "Sin JavaScript, ¿qué se ve en el hero y en las pestañas de sectores? ¿Por qué eso es importante para Google?"
  - q: "En SectorTabs, ¿qué hacen aria-selected y tabindex=-1? ¿Qué teclas funcionan y quién las programó?"
  - q: "Durante las pruebas, los servicios y proyectos aparecían vacíos. ¿Cuál fue la causa y qué lección deja sobre el servidor de desarrollo?"
---

## Composición: la página como lista de secciones

```astro
<BaseLayout title=… description=… headerTone="light">
  <HeroTransformation />
  <TrustStats />
  <LayerByLayer />
  <ServicesGrid />
  <SectorTabs />
  <ProjectsShowcase />
  {site.authorizedClients.length > 0 && <section aria-label="Clientes" />}
  <ProcessTimeline />
  <Differentiators />
  <SafetyBacking />
  {site.testimonials.length > 0 && <section aria-label="Testimonios" />}
  <FinalCta />
  <SectionIndex items={index} />
</BaseLayout>
```

`index.astro` casi no tiene lógica: **orquesta** secciones. Cada una es independiente y se podría reutilizar (por ejemplo, `ProcessTimeline` en la página `/proceso/`).

**Las secciones condicionales:** clientes y testimonios **no se renderizan** mientras las listas en `site.ts` estén vacías. Tu prompt es explícito: nada de logos sin autorización escrita ni testimonios inventados. La condición `length > 0` hace cumplir esa regla en el código: no hay forma de que aparezca una sección de testimonios vacía o de relleno.

## Hero "La transformación" — plan B vectorial

**Problema:** la experiencia ideal es una secuencia de fotos de un *timelapse* real (estilo Apple). Ese material no existe todavía.

**Plan B implementado:** una escena SVG en tres capas:

```
┌─ capa 1: OBRA NEGRA ──────── concreto con ruido (feTurbulence), cables colgando, trazos punteados
├─ capa 2: TERMINADO [data-hero-after] ── muros, luminarias, piso con perspectiva, panel naranja
├─ capa 3: COTAS [data-hero-line] ──── líneas de medida naranjas, como en un plano
├─ retícula de plano + degradados de legibilidad (scrim)
└─ texto real (h1, párrafo, botones) ── HTML encima de todo
```

**Cómo se mueve con el scroll** (`sections.ts`, handler `hero`):

```ts
tl.fromTo('[data-hero-after]', { clipPath: 'inset(100% 0% 0% 0%)' },
                               { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, 0)
  .from('[data-hero-line]', { drawSVG: '0%', stagger: 0.04, ease: 'none' }, 0)
  .fromTo('[data-hero-stage]:not(:first-child)', { opacity: 0.35 }, { opacity: 1, stagger: 0.25 }, 0)
  .to('[data-hero-progress]', { scaleX: 1, ease: 'none' }, 0);
```

- **`clip-path: inset(100% 0 0 0)`** recorta la capa terminada desde arriba hasta dejarla invisible. Al bajar, el recorte se reduce y la obra terminada "sube" sobre la obra negra. **Por qué `clip-path` y no `height`:** cambiar la altura obliga a recalcular el layout en cada fotograma; `clip-path` solo vuelve a pintar.
- **`drawSVG: '0%'`** (plugin DrawSVG) anima el trazo de las cotas como si se dibujaran a mano. Por dentro usa `stroke-dasharray` y `stroke-dashoffset`.
- El `0` al final de cada línea significa "todas empiezan en el segundo 0 de la línea de tiempo": suceden **a la vez**, coordinadas con el scroll.

**Sin JS o con reduced-motion:** no se aplica el `clip-path` inicial, así que se ve directamente la obra terminada. El texto siempre es HTML real, legible para Google y para lectores de pantalla. El SVG decorativo lleva `aria-hidden="true"`.

**Un fallo que corregí al verificarlo:** en la captura del estado final, el párrafo blanco quedaba **encima del panel naranja**, con un contraste de ≈2,9:1. WCAG AA exige 4,5:1 para texto normal. Moví el panel a la derecha y agregué un *scrim* (degradado oscuro detrás del texto):

```html
<div class="absolute inset-0 bg-gradient-to-r from-carbon/85 via-carbon/45 to-transparent"></div>
```

Así el texto se lee igual sobre cualquier estado de la escena.

**Cómo se cambiará al timelapse real:** el contenedor `data-motion="hero"` y el texto se quedan. Solo se reemplaza `.hero-scene` por un `<canvas>` que dibuja el fotograma `n` según el progreso del scroll.

## "Capa por capa" — el catálogo como un muro en corte

```ts
gsap.set(layers.slice(1), { xPercent: 105 });              // capas 2–5 fuera del cuadro, a la derecha
const tl = gsap.timeline({ scrollTrigger: {
  trigger: el, start: 'top top', end: `+=${layers.length * 70}%`,
  scrub: 0.5, pin: true,
  snap: { snapTo: 1 / (layers.length - 1) },               // se "acomoda" en cada capa
  onUpdate: (self) => {
    const active = Math.round(self.progress * (layers.length - 1));
    items.forEach((it, i) => it.toggleAttribute('data-active', i === active));
  },
}});
layers.slice(1).forEach((layer, i) => tl.to(layer, { xPercent: 0 }, i));   // una tras otra
```

- La sección queda **fijada** y el scroll ya no baja la página: **construye el muro**.
- `snap` hace que, al soltar, el scroll se acomode en una capa completa y no quede a mitad de camino.
- `onUpdate` traduce el progreso (de 0 a 1) a "capa activa" (de 0 a 4) y marca el ítem de la lista con `data-active`. El **CSS** decide cómo se ve el ítem activo (borde naranja, descripción expandida). El JavaScript solo cambia el estado.
- Cada capa enlaza a su servicio: esta animación también es **navegación**, no solo decoración (regla 10 de tu prompt: intención narrativa).

## Servicios con filtro — ver módulo 9

El catálogo sale de `getCollection('servicios')` en el frontmatter (al construir la página). Cada tarjeta lleva `data-category`. El filtro cambia `hidden` en las tarjetas y `aria-pressed` en los botones. `aria-pressed` es lo que hace que un lector de pantalla diga "botón Acabados, presionado".

## Sectores — el patrón de pestañas accesible

Sigue el patrón oficial **WAI-ARIA Tabs**:

```html
<div role="tablist">
  <button role="tab" aria-selected="true"  tabindex="0"  aria-controls="panel-retail">…</button>
  <button role="tab" aria-selected="false" tabindex="-1" aria-controls="panel-oficinas">…</button>
</div>
<div role="tabpanel" id="panel-retail" aria-labelledby="tab-retail">…</div>
```

- **`tabindex="-1"`** en las pestañas inactivas: con Tab se entra a la lista de pestañas **una sola vez** (en la activa), y entre pestañas se navega con **← →, Inicio y Fin**. Esas teclas las programé yo en el `<script>`, porque un `<button>` no las trae.
- **Sin JavaScript:** la lista de pestañas está oculta y **todos los paneles se ven apilados**. Google indexa el contenido de los 7 sectores y nadie pierde información. Cuando el JS carga, marca `data-ready` y entonces muestra las pestañas y oculta los paneles inactivos.

## Proyectos — scroll horizontal fijado

```ts
const distance = () => track.scrollWidth - window.innerWidth + 64;
gsap.to(track, { x: () => -distance(), ease: 'none',
  scrollTrigger: { trigger: el, start: 'top top', end: () => `+=${distance()}`,
                   scrub: 0.6, pin: true, invalidateOnRefresh: true } });
```

El scroll **vertical** del usuario se convierte en desplazamiento **horizontal** del carril. `end: +=distance` hace que bajar 1 px mueva el carril 1 px: la velocidad se siente natural. `distance` es una **función** (no un número) e `invalidateOnRefresh` hace que se recalcule si cambia el tamaño de la ventana. En móvil no se fija: las tarjetas van en columna.

## El índice lateral `01 · 02 · 03…`

Usa **IntersectionObserver**, una API del navegador que avisa cuando un elemento entra o sale de una zona de la pantalla, **sin escuchar el scroll**:

```ts
new IntersectionObserver(callback, { rootMargin: '-45% 0px -50% 0px' });
```

El `rootMargin` reduce la "zona de detección" a una franja en el centro de la pantalla. La sección que cruza esa franja se marca con `aria-current="true"`. Es más eficiente que calcular posiciones en cada evento de scroll.

## Cómo se verificó (y qué falló)

No basta con que compile: hay que **verlo**. Usé **Playwright** (un navegador Chromium controlado por código) para tomar capturas en varios puntos del scroll:

```
escritorio 1440×900  → scroll 0, 900, 2100 … 11600
móvil 390×844        → scroll 0, 900, 2600, 6000
reduced-motion       → scroll 0, 2400
+ registro de errores de consola: 0 errores
```

**Falla 1: las secciones de servicios, sectores y proyectos aparecían vacías.** Medí el carril de proyectos desde el navegador: `arts: []`, cero tarjetas. Era un problema de **datos**, no de animación. El log decía `The collection "servicios" does not exist or is empty`. **Causa:** arranqué el servidor de desarrollo *antes* de crear `src/content.config.ts`, y el servidor no recarga ese archivo en caliente. **Solución:** reiniciarlo.

> **Lección:** cuando algo "no aparece", mide antes de adivinar. Distingue si el problema es de datos (no llegó nada), de estructura (llegó pero mal) o de presentación (llegó pero no se ve). Y lee los *warnings*, no solo los errores.

**Falla 2: el contraste del hero** (explicada arriba).

**Lo que comprobé que funciona en reduced-motion:** la página mide 9.732 px en lugar de 15.663 px, porque desaparecen los espacios de los *pins*. El hero se muestra terminado y el contenido completo queda accesible.
