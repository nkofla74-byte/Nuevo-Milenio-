---
order: 9
title: El motor de animación
summary: Cómo se carga GSAP solo cuando hace falta (import dinámico), el contrato de atributos data-*, cómo se sincronizan Lenis y ScrollTrigger, y cómo cada animación respeta prefers-reduced-motion.
status: verificado
phase: Fase 3 — Inicio
files:
  - src/lib/motion/index.ts
  - src/lib/motion/primitives.ts
  - src/lib/motion/sections.ts
quiz:
  - q: "¿Qué diferencia hay entre 'import { gsap } from \"gsap\"' arriba del archivo y 'await import(\"gsap\")' dentro de una función? ¿Cuál usamos y qué gana el visitante?"
  - q: "Si un usuario tiene activado 'reducir movimiento' en su sistema, ¿se descarga GSAP? ¿Qué ve en el hero?"
  - q: "¿Por qué el filtro de servicios NO vive en sections.ts sino en el componente ServicesGrid? (Encontramos ese problema durante el desarrollo.)"
  - q: "Lenis y ScrollTrigger tienen cada uno su idea de 'dónde está el scroll'. ¿Cómo se sincronizan en index.ts?"
---

## El problema: animaciones ricas sin castigar la carga

Tu prompt pide un sitio "nivel Awwwards" con scroll narrativo, pero también **≤ 120 KB de JS inicial** y que **nada de la animación bloquee el primer render**. GSAP con sus plugins pesa decenas de KB. ¿Cómo se concilian las dos cosas?

## El contrato: atributos `data-*`

**Decisión de diseño:** los componentes **no importan GSAP**. Solo se *marcan* con atributos que describen la intención:

| Atributo | Intención | Dónde se usa |
|---|---|---|
| `data-reveal` | aparecer al entrar en pantalla | tarjetas de diferenciales |
| `data-split` | titular que se revela palabra por palabra | todos los `SectionHeading` |
| `data-draw-line` | línea que se "dibuja" | la rayita de las etiquetas `02 —— CAPA POR CAPA` |
| `data-count` | número que cuenta hacia arriba | cifras (cuando existan cifras reales) |
| `data-magnetic` | botón que sigue al cursor | CTA principales |
| `data-motion="hero"` | coreografía propia de una sección | hero, capas, proyectos, proceso |

**Qué gana el proyecto:** el HTML es el mismo con o sin animación. El contenido **siempre está visible por defecto**. La animación lo esconde y lo muestra solo cuando ya cargó. Si el JS falla, el usuario ve todo y no una página en blanco (regla 8 de tu prompt).

## `index.ts`: cargar solo si hace falta

```ts
export async function initMotion() {
  const root = document.documentElement;
  if (prefersReducedMotion()) {           // ① respeta la preferencia del sistema
    root.dataset.motion = 'reduced';
    return;                               //    → GSAP NUNCA se descarga
  }
  if (!document.querySelector(ANIMATED)) return;   // ② página sin animaciones → tampoco

  const [{ gsap }, { ScrollTrigger }, { SplitText }, { DrawSVGPlugin }] = await Promise.all([
    import('gsap'), import('gsap/ScrollTrigger'), import('gsap/SplitText'), import('gsap/DrawSVGPlugin'),
  ]);                                     // ③ import DINÁMICO, en paralelo
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
  root.dataset.motion = 'on';             // ④ el CSS sabe que la animación está activa
  ...
}
```

1. `matchMedia('(prefers-reduced-motion: reduce)')` consulta la preferencia del sistema operativo. Si está activa, salimos **antes** de descargar nada.
2. Si la página no tiene ningún elemento animado (por ejemplo, una política legal), tampoco se descarga GSAP.
3. **`import()` dinámico** vs. `import` normal:
   ```
   import { gsap } from 'gsap'      → va en el paquete inicial; se descarga SIEMPRE, antes de ejecutar nada
   await import('gsap')             → Vite lo separa en otro archivo (chunk); se descarga SOLO al llegar a esta línea
   ```
   `Promise.all` descarga los cuatro módulos **en paralelo** y no uno tras otro.
4. `data-motion="on"` en `<html>` permite que el CSS se adapte. Por ejemplo, las etapas del hero solo se atenúan si hay animación; sin ella se ven completas.

**El flujo en la línea de tiempo de carga:**

```
 0 ms   llega el HTML → el navegador pinta el titular, el texto y los botones   ← LCP rápido
 ~      se ejecuta el script pequeño del layout → initMotion()
 ~      import('gsap'…) en paralelo (no bloquea lo que ya se pintó)
 +X ms  GSAP listo → arranca la animación de entrada del hero
```

## Lenis + ScrollTrigger: dos relojes sincronizados

```ts
if (!window.matchMedia('(pointer: fine) and (min-width: 1024px)').matches) return;  // ①
const lenis = new Lenis({ lerp: 0.12, anchors: true });
lenis.on('scroll', ScrollTrigger.update);               // ②
gsap.ticker.add((time) => lenis.raf(time * 1000));     // ③
gsap.ticker.lagSmoothing(0);                            // ④
```

1. **Solo en escritorio con mouse.** En pantallas táctiles, el scroll nativo del sistema es mejor y el usuario espera su inercia. Un scroll "suave" artificial ahí se siente raro.
2. Cada vez que Lenis mueve el scroll, le avisa a ScrollTrigger para que recalcule las animaciones.
3. **Un solo reloj:** Lenis necesita actualizarse en cada fotograma. En lugar de crear su propio bucle, se cuelga del *ticker* de GSAP. Así ambos avanzan en el mismo fotograma y no se desfasan.
4. `lagSmoothing(0)` desactiva una compensación de GSAP que, combinada con Lenis, producía saltos tras una pausa.

`lerp: 0.12` (interpolación lineal): en cada fotograma, el scroll avanza el 12% de lo que le falta para llegar al destino. Eso produce la suavidad.

## `primitives.ts`: animaciones genéricas

```ts
gsap.utils.toArray('[data-reveal]').forEach((el) => {
  gsap.from(el, { y: 40, autoAlpha: 0, duration: 0.9, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
});
```

- **`gsap.from`** anima *desde* un estado (40 px más abajo e invisible) *hacia* el estado actual del CSS. Por eso el estado final es siempre el del HTML: visible.
- **`autoAlpha`** = `opacity` + `visibility: hidden` cuando llega a 0, así los elementos invisibles no reciben clics ni foco.
- **`start: 'top 85%'`**: dispara cuando el borde superior del elemento toca el 85% de la altura de la ventana.
- **`once: true`**: anima una vez y libera el ScrollTrigger (menos trabajo en cada scroll).

**SplitText con máscara:**
```ts
SplitText.create(el, { type: 'words', mask: 'words', autoSplit: true, onSplit: (self) =>
  gsap.from(self.words, { yPercent: 110, stagger: 0.06, … }) });
```
Envuelve cada palabra en un contenedor con `overflow: hidden` (la máscara) y anima la palabra desde abajo (`yPercent: 110`). El efecto es que cada palabra "sube" desde detrás de una línea. `autoSplit` vuelve a partir el texto si cambia el ancho (por ejemplo, al girar el celular), porque las líneas cambian.

**Botón magnético** (solo `pointer: fine`):
```ts
const x = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect();
  x((e.clientX - r.left - r.width / 2) * 0.25); … });
```
`quickTo` crea una función optimizada para actualizar la misma propiedad muchas veces por segundo sin crear una animación nueva en cada movimiento. El botón se desplaza un 25% de la distancia del cursor a su centro.

## `sections.ts` y `gsap.matchMedia()`

```ts
const mm = gsap.matchMedia();
mm.add({ desktop: '(min-width: 1024px)', mobile: '(max-width: 1023px)' }, (ctx) => {
  const { desktop } = ctx.conditions;
  gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top',
    end: desktop ? '+=140%' : '+=80%', scrub: 0.6, pin: desktop } }) …
});
```

`matchMedia` de GSAP ejecuta una función distinta según el tamaño de pantalla y **deshace automáticamente** las animaciones cuando la condición deja de cumplirse (si giras la tablet, por ejemplo). Así el hero queda **fijado** (`pin`) solo en escritorio. En móvil fijar secciones largas es incómodo y costoso.

- **`scrub: 0.6`**: la animación no tiene duración propia. Su progreso **es** el progreso del scroll, con 0,6 s de suavizado.
- **`pin: true`**: la sección queda fija en pantalla mientras dura la animación. GSAP inserta un *pin-spacer* (un espacio vacío) para que el resto de la página no salte.

## Un error de diseño que corregí

Al principio, el **filtro de servicios** (con la animación Flip) estaba en `sections.ts`. El problema: con *reduced motion*, `initMotion()` sale en el paso ① y `sections.ts` nunca se ejecuta, así que **los botones del filtro no hacían nada**. Una preferencia de accesibilidad terminaba rompiendo una funcionalidad.

**Corrección:** la lógica del filtro (mostrar u ocultar tarjetas, `aria-pressed`) quedó en el propio `ServicesGrid.astro`. Flip se carga ahí **solo como mejora** si el usuario no pidió reducir el movimiento.

> **Lección:** la animación debe ser una capa **encima** de la funcionalidad, nunca una dependencia de ella. Pregúntate siempre: "si esta capa no carga, ¿esto sigue funcionando?"
