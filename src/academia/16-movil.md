---
order: 16
title: Diseño y animación para móviles
summary: Cómo se auditó el sitio en celulares, por qué el scroll narrativo necesita otra coreografía en pantalla vertical, los errores que solo aparecían en móvil (y uno que también estaba en escritorio) y cómo se protegió el rendimiento.
status: verificado
phase: Mejora móvil
files:
  - src/lib/motion/sections.ts
  - src/lib/motion/index.ts
  - src/components/sections/LayerByLayer.astro
  - src/components/sections/ProjectsShowcase.astro
  - src/components/sections/ServicesGrid.astro
  - src/styles/global.css (.chip-row)
  - src/components/ui/BeforeAfter.astro
  - tests/e2e/mobile.spec.ts
quiz:
  - q: "¿Qué hace ScrollTrigger.config({ ignoreMobileResize: true }) y qué problema del celular resuelve?"
  - q: "La capa negra del muro aparecía antes de tiempo. ¿Por qué xPercent: 105 no la sacaba del muro y cómo se corrigió?"
  - q: "¿Por qué una tabla con overflow-x: auto seguía desbordando la página? ¿Qué hace min-w-0 en un elemento de grid?"
  - q: "Explica touch-action: pan-y en el comparador. ¿Qué pasaría sin esa línea en el carril de proyectos?"
  - q: "El TBT bajó de 149 ms a 0 ms sin quitar ninguna animación. ¿Qué cambió?"
    hint: "Piensa en tareas largas vs. tareas cortas en el hilo principal."
---

## Paso 1: medir antes de cambiar

Antes de tocar código, hice un **script de auditoría** que abre las 20 páginas en un celular simulado de 360 px y busca automáticamente:

- **Desborde horizontal:** `document.documentElement.scrollWidth - clientWidth > 0`. Es el error número uno en móvil: la página "baila" de lado a lado.
- **Objetivos táctiles menores de 24×24 px** (WCAG 2.2, criterio 2.5.8).
- **Texto menor de 11 px.**

Y luego **capturas reales** a lo largo del scroll en un iPhone de 390 px. La auditoría numérica encuentra lo medible; las capturas encuentran lo que se ve mal, aunque "mida bien".

| Hallazgo | Tipo |
|---|---|
| Hero sin fijar: la transformación ocurría mientras la escena se iba de la pantalla | experiencia |
| Capa por capa sin animación; etiquetas cortadas ("NTURA", "YWALL") | experiencia + legibilidad |
| Filtros (9) y pestañas (7) apiladas en 5 filas | espacio |
| 20 servicios en columna ≈ 5.000 px de scroll | espacio |
| Proyectos en columna, sin recorrido horizontal | experiencia |
| Textos de 10 px; tabla de cookies desbordando 41 px | legibilidad / desborde |

## Paso 2: una coreografía distinta, no una versión recortada

Antes, en móvil, simplemente **apagaba** los *pins*. Era la opción "segura", pero el celular se quedaba sin la historia, y es donde llega la mayoría de visitas. El enfoque correcto es **rediseñar la coreografía para una pantalla vertical**:

```ts
mm.add({ desktop: DESKTOP, mobile: MOBILE }, (ctx) => {
  const { desktop } = ctx.conditions;
  gsap.timeline({ scrollTrigger: {
    pin: true,                                  // ahora también en móvil
    end: desktop ? '+=140%' : '+=100%',         // recorrido más corto: menos trabajo para el pulgar
    scrub: desktop ? 0.6 : 0.3,                 // respuesta más directa al dedo
    anticipatePin: 1,                           // evita el "salto" al empezar a fijar
  }}) …
```

- **Recorrido más corto:** en escritorio, la rueda del mouse avanza poco a poco; en el celular, un deslizamiento recorre mucha distancia. Si el *pin* dura demasiado, el usuario siente que "la página se trabó".
- **`scrub` más bajo:** el suavizado de 0,6 s se siente bien con la rueda, pero con el dedo da sensación de retraso. Con 0,3 la animación sigue al pulgar.
- **`anticipatePin`:** GSAP aplica el *pin* un instante antes. Así se evita el pequeño salto que se nota sobre todo con scroll táctil rápido.

### El problema de la barra de direcciones

En un celular, al hacer scroll, la barra de direcciones del navegador se esconde y aparece. Eso **cambia la altura de la ventana** decenas de veces. ScrollTrigger, por defecto, recalcula todos los *pins* en cada cambio, y las secciones fijadas "saltan".

```ts
ScrollTrigger.config({ ignoreMobileResize: true });
```

Le dice a ScrollTrigger que ignore esos cambios de altura en dispositivos táctiles. Junto con las alturas en `svh` (*small viewport height*: la altura con la barra visible), las secciones fijadas quedan estables.

## "Capa por capa" en vertical

En escritorio hay espacio para dos columnas (texto y muro). En un celular de 390×844 no caben el título, el párrafo, cinco capas con su texto y el muro. **Decisión de diseño:** con la animación activa, en móvil la sección ocupa exactamente una pantalla (`100svh`) y muestra:

```
┌─────────────────────┐
│ 02 —— CAPA POR CAPA │
│ UN SOLO PROVEEDOR…  │  ← título (más pequeño)
│ ┌─────────────────┐ │
│ │  muro (36svh)   │ │  ← se construye capa a capa
│ └─────────────────┘ │
│ ▬ ▬ ▬ ▭ ▭           │  ← indicador de pasos (nuevo)
│ 03 ESTUCO           │  ← SOLO la capa activa
│ Superficies…        │
└─────────────────────┘
```

Se logra **solo con CSS**, sin duplicar el HTML:

```css
@media (max-width: 1023px) {
  html[data-motion='on'] .layers-copy  { display: contents; }   /* "disuelve" el contenedor */
  html[data-motion='on'] .layers-wall  { order: 2; height: 36svh; }
  html[data-motion='on'] .layers-dots  { order: 3; display: flex; }
  html[data-motion='on'] .layers-list  { order: 4; }
  html[data-motion='on'] .layer-item:not([data-active]) { display: none; }
}
```

**`display: contents`** hace que un contenedor desaparezca de la maquetación y sus hijos pasen a ser hijos directos del flex de afuera. Gracias a eso, `order` puede intercalar el muro **entre** el título y la lista, aunque en el HTML estén en otro orden. El HTML sigue siendo uno solo (bueno para SEO y lectores de pantalla) y solo cambia la presentación.

**Sin animación** (reduced-motion), la regla `html[data-motion='on']` no aplica y se ve la versión completa: todas las capas con su texto.

## Un error que también estaba en escritorio

En las capturas móviles vi la capa negra "05 Acabado final" en el paso 02, antes de su turno. Volví a mirar las capturas de escritorio de días anteriores: **el error ya estaba ahí** y no lo había notado.

```ts
gsap.set(layers.slice(1), { xPercent: 105 });   // ✘ antes
```

`xPercent` es un porcentaje del **ancho del propio elemento**. Las capas tienen anchos decrecientes (100%, 86%, 72%, 58%, 44% del muro). Mover 105% su propio ancho a la capa de 44% la desplaza solo un 46% del muro, así que **sigue adentro**.

```ts
const wall = layers[0].parentElement!;
const offstage = () => wall.clientWidth + 8;                                  // ✔ ancho del MURO
tl.fromTo(layer, { x: offstage }, { x: 0, immediateRender: true }, i);
// + invalidateOnRefresh: true → si gira el celular, se recalcula
```

> **Lección:** probar en otro tamaño de pantalla no solo encuentra errores de ese tamaño; a veces revela errores que siempre estuvieron.

## Proyectos: un carril que funciona con o sin animación

```css
.projects-track { overflow-x: auto; scroll-snap-type: x mandatory; }        /* base: carrusel nativo */
html[data-motion='on'] .projects-section { height: 100svh; overflow: hidden; } /* con GSAP: se fija */
html[data-motion='on'] .projects-track { overflow: visible; }                 /* y el scroll lo mueve */
```

- **Con animación:** el scroll vertical mueve el carril, igual que en escritorio. Las tarjetas miden 82vw para que se asome la siguiente y el usuario entienda que hay más.
- **Sin animación:** es un carrusel con *scroll snap* que se desliza con el dedo y se acomoda en cada tarjeta. Esto también arregló un problema de escritorio con reduced-motion: las tarjetas que no cabían quedaban ocultas sin forma de verlas.
- **Imágenes 4:5 en celular** (en lugar de 16:10): en una pantalla vertical, una imagen apaisada deja la mitad de la pantalla vacía.

### El gesto táctil sobre el comparador

```css
.ba-range { touch-action: pan-y; }
```

En el carril de proyectos, el dedo cae casi siempre **sobre** un comparador. Sin esta línea, el `<input type="range">` capturaría todos los gestos y el usuario quedaría "atrapado" sin poder hacer scroll. `touch-action: pan-y` le dice al navegador: los deslizamientos verticales son scroll de página y los horizontales son del control.

## Menos scroll: filas en lugar de tarjetas

**Filtros y pestañas** (`.chip-row` en `global.css`): en el celular son una sola fila que se desliza horizontalmente, con un desvanecido a la derecha (`mask-image`) que **sugiere** que hay más opciones. Desde 640 px vuelven a ser filas que se ajustan con `flex-wrap`. Al navegar las pestañas con las flechas del teclado, `scrollIntoView({ inline: 'nearest' })` mantiene visible la pestaña activa. Esa llamada se ejecuta **solo** cuando el usuario navega, porque en la carga inicial movería la página hasta las pestañas.

**Servicios:** en el celular son **filas compactas** (ícono, categoría, título, resumen de 2 líneas con `line-clamp-2` y flecha). Pasan de 1,5 a unas 5 por pantalla. Toda la fila es el enlace: un objetivo táctil grande.

## Dos errores de CSS que vale la pena entender

**1. `scale` vs. `transform` (Tailwind v4).** La barra de progreso del cotizador nunca se llenaba:

```html
<span class="scale-x-0 …">   <!-- Tailwind v4 genera:  scale: 0 1;  (propiedad CSS "scale") -->
```
```css
.step-pill[data-current] span { transform: scaleX(1); }   /* propiedad distinta: "transform" */
```

`scale` y `transform` son **dos propiedades independientes** que el navegador **multiplica**: 0 × 1 = 0. La solución fue usar la misma propiedad en todas partes: `[transform:scaleX(0)]`. Lo mismo afectaba a la barra de lectura del blog.

**2. Por qué la tabla seguía desbordando.** Tenía `overflow-x: auto`, pero el artículo que la contiene es un elemento de *grid*, y por defecto `min-width: auto`: **nunca se encoge por debajo de su contenido más ancho**. La tabla agrandaba el artículo y el artículo la página. Con `min-w-0`, el artículo puede ser más angosto que la tabla y el scroll interno se activa. La prueba automática de móvil detectó que mi primer arreglo (solo el overflow) no bastaba.

## Rendimiento: animar más sin bloquear más

Fijar tres secciones en móvil subió el **TBT** del inicio de 20 a 149 ms (rendimiento 95, justo en el límite). La causa: crear un *pin* mide el layout de la página, y las tres se creaban **en una sola tarea larga** del hilo principal. Mientras tanto, el navegador no podía responder a un toque.

```ts
for (const el of sections) {
  mod.runSection(el, kit);
  await yieldToMain();          // ← deja respirar al navegador entre sección y sección
}
function yieldToMain() {
  return globalThis.scheduler?.yield?.() ?? new Promise((r) => setTimeout(r, 0));
}
```

```
antes:  [████████████████ 1 tarea de ~200 ms ████████████████]   ← un toque aquí espera
después:[███] · [████] · [███] · [██]                              ← entre tareas, el navegador responde
```

El TBT solo cuenta la parte de cada tarea que pasa de 50 ms. Con tareas cortas, ese exceso desaparece. Resultado medido dos veces: **TBT 0 ms, rendimiento 97**, sin quitar ninguna animación. `scheduler.yield()` es la API moderna para esto; donde no existe, `setTimeout(0)` cumple la misma función.

## Por qué no hay scroll suave (Lenis) en el celular

Es una decisión deliberada. En pantallas táctiles, el sistema operativo ya da un scroll con inercia física que el usuario conoce "en los dedos". Reemplazarlo por uno artificial se siente extraño y gasta batería. Lenis queda solo para escritorio con mouse, donde la rueda sí produce saltos bruscos.

## Cómo quedó protegido

`tests/e2e/mobile.spec.ts` (corre en cada cambio) verifica: 0 desborde en 13 páginas a 360 px, que hero, capas y proyectos estén fijados con animación, que la capa activa cambie al hacer scroll, que sin animación el carril sea un carrusel nativo, que el comparador use `pan-y`, que filtros y pestañas sean una sola fila, que el menú móvil funcione y que la barra del cotizador se llene. **70 de 70 pruebas pasan.**
