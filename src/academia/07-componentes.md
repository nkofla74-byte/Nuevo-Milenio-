---
order: 7
title: Componentes de interfaz
summary: Props, slots y composición con los componentes reales del sitio — Button, Icon, Placeholder, BeforeAfter y SectionHeading — y las decisiones de accesibilidad de cada uno.
status: verificado
phase: Fase 2 — Sistema de diseño
files:
  - src/components/ui/Button.astro
  - src/components/ui/Icon.astro
  - src/components/ui/Placeholder.astro
  - src/components/ui/BeforeAfter.astro
  - src/components/ui/SectionHeading.astro
  - src/lib/pending.ts
quiz:
  - q: "En Button.astro, ¿por qué el componente decide entre <a> y <button> según si recibe href? ¿Qué problema tendría un lector de pantalla si usáramos siempre <button>?"
  - q: "¿Qué es un slot? Explica cómo BeforeAfter usa dos slots con nombre (before y after) y por qué eso lo hace reutilizable."
  - q: "El comparador antes/después funciona con teclado sin que yo haya programado las flechas. ¿Por qué?"
  - q: "markPending() escapa el texto antes de insertar el <span>. ¿Qué ataque evita ese escape cuando usamos set:html?"
    hint: "Piensa qué pasaría si un texto del contenido trajera <script>."
---

## Qué es un componente y por qué existen

**Qué es:** un archivo `.astro` que encapsula una pieza de interfaz (HTML + estilos + comportamiento opcional) y se puede usar muchas veces con distintos datos.

**Qué problema resuelve:** el botón "Solicitar cotización" aparece en el hero, el CTA final, el encabezado y las páginas de servicio. Sin componente, copiaríamos su HTML en cada lugar, y el día que cambie el diseño habría que editarlo en todos (y siempre se olvida alguno).

**Cómo se comunica con el resto:** un componente recibe datos por **props** (como los parámetros de una función) y contenido por **slots** (huecos donde va HTML que decide quien lo usa).

```
        quien lo usa                                 el componente
<Button href="/cotizar/" size="lg">       ──►   interface Props { href?, size? ... }
   Solicitar cotización                   ──►   <slot />  ← aquí aparece este texto
</Button>
```

## `Button.astro`: una regla de accesibilidad convertida en código

```astro
---
interface Props {
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'light';
  size?: 'md' | 'lg';
  icon?: IconName;
  magnetic?: boolean;
  [key: string]: unknown;          // ① deja pasar atributos extra (target, rel…)
}
const { href, variant = 'primary', size = 'md', icon = 'arrow-right', magnetic = false, class: className, ...rest } = Astro.props;
const Tag = href ? 'a' : 'button'; // ② enlace o acción
---
<Tag href={href} class:list={[base, variants[variant], sizes[size], className]}
     data-magnetic={magnetic ? '' : undefined} {...rest}>
  <span><slot /></span>
  <Icon name={icon} size={20} class="transition-transform group-hover:translate-x-1" />
</Tag>
```

Por bloques:

1. **`interface Props`** documenta qué acepta el componente. Si alguien escribe `variant="naranja"`, TypeScript lo marca como error porque no está en la lista. Los valores por defecto (`= 'primary'`) hacen que el uso más común sea el más corto.
2. **`const Tag = href ? 'a' : 'button'`** aplica la regla semántica más importante de la web:
   - Si **lleva a otra página**, es un enlace `<a>`. El lector de pantalla dice "enlace", se puede abrir en otra pestaña y Google lo sigue.
   - Si **ejecuta una acción** (enviar, abrir, filtrar), es un `<button>`.
   - **Qué pasaría si fuera siempre `<button>`:** el lector de pantalla anunciaría "botón" para algo que navega, no se podría abrir con clic central y Google no descubriría la página destino.
3. **`class:list`** es una utilidad de Astro: recibe una lista (con valores `false` o `undefined` incluidos) y arma el atributo `class` ignorando los vacíos.
4. **`{...rest}`** pasa cualquier atributo adicional. Así el CTA final puede dar `target="_blank" rel="noopener noreferrer"` al botón de WhatsApp sin que `Button` tenga que conocer esos atributos.
5. **`data-magnetic`**: el botón no sabe animarse. Solo se **marca**, y el motor de animación (módulo 9) busca esa marca. Es una separación entre *presentación* y *comportamiento*.

## `Icon.astro`: íconos propios en lugar de una librería

```ts
const icons = {
  hammer: '<path d="M14 4l6 6-2 2-6-6z"/><path d="M13 7l-9 9 4 4 9-9"/>',
  ...
} as const;
export type IconName = keyof typeof icons;   // 'hammer' | 'truck' | ...
```

- **`as const` + `keyof typeof`**: TypeScript deduce automáticamente la lista de nombres válidos. Si escribes `<Icon name="hamer" />`, el editor te avisa.
- **Por qué no una librería** (Lucide, Heroicons): son excelentes, pero traen un estilo ajeno a la marca, y tu prompt pide un set coherente y autoalojado. Aquí los 40 íconos usan el mismo trazo cuadrado de plano técnico.
- **Accesibilidad:**
  ```astro
  aria-hidden={label ? undefined : 'true'}
  role={label ? 'img' : undefined}
  aria-label={label}
  ```
  Un ícono decorativo (al lado de un texto que ya dice lo mismo) se oculta para lectores de pantalla, porque si no se oiría "imagen, imagen, imagen". Un ícono que comunica algo solo, sin texto, recibe un nombre.

## `Placeholder.astro`: arte generado, sin derechos de terceros

**Problema:** tu prompt prohíbe imágenes con derechos de terceros y todavía no hay fotos reales.

**Solución:** el componente **dibuja** una escena SVG:

```ts
let h = 0;
for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;   // ① texto → número (hash)
const rnd = () => ((h = (h * 1664525 + 1013904223) >>> 0) / 2 ** 32); // ② generador pseudoaleatorio
const panels = Array.from({ length: 5 }, () => ({ x: 40 + rnd() * 500, ... }));
```

1. Convierte la **semilla** (por ejemplo, el id del proyecto) en un número.
2. Usa un *generador congruencial lineal*, una fórmula clásica que produce números "aleatorios" **reproducibles**: la misma semilla da siempre la misma secuencia.

**Por qué reproducible y no `Math.random()`:** con `Math.random()`, cada build dibujaría una imagen distinta, y las pruebas visuales de regresión (Fase 6) detectarían "cambios" falsos en cada ejecución.

**Cómo se reemplaza:** cuando lleguen las fotos, en `ProjectsShowcase.astro` se cambia `<Placeholder slot="before" …/>` por `<Picture src={foto} …/>`. El comparador no se toca.

## `BeforeAfter.astro`: apoyarse en el navegador

```
┌───────────────────────────────────────────────┐
│ .ba-before  (slot "before", flujo normal)     │
│ .ba-after   (slot "after", position:absolute, │
│              clip-path: inset(0 0 0 var(--pos)))
│ .ba-handle  (la línea y el círculo, decorativos, aria-hidden)
│ <input type="range"> transparente, ocupa TODO │  ← recibe mouse, dedo y teclado
└───────────────────────────────────────────────┘
```

```js
range.addEventListener('input', () => {
  root.style.setProperty('--pos', `${range.value}%`);                          // ①
  range.setAttribute('aria-valuetext', `${100 - Number(range.value)}% después`); // ②
});
```

**Qué pasa cuando el usuario interactúa:**
1. Arrastra (o pulsa →): el `<input type="range">` nativo cambia su valor de 50 a 51.
2. Se dispara el evento `input`.
3. ① se escribe la variable CSS `--pos: 51%` en el contenedor.
4. El CSS usa esa variable en dos lugares: `clip-path: inset(0 0 0 51%)` (recorta la capa "después") y `left: 51%` (mueve la manija).
5. ② el lector de pantalla anuncia "49% después".

**Por qué un `input range` invisible y no un `div` arrastrable programado a mano:** el control nativo trae **gratis** el arrastre con mouse y dedo, las flechas, Inicio/Fin, el foco con Tab y el anuncio en lectores de pantalla. Programar todo eso a mano son cientos de líneas y es fácil olvidar algún caso.

**Por qué `clip-path`:** recortar no cambia el tamaño de ningún elemento, así que el navegador no tiene que recalcular el layout de la página (*reflow*), solo volver a pintar. Por eso va fluido incluso en celulares modestos.

**Detalle real:** el `id` del input se genera con `Math.random()` en el build. Al principio usaba el título del proyecto como id, pero los títulos tienen espacios y corchetes, que no sirven como id HTML.

## Slots con nombre: cómo se compone

```astro
<BeforeAfter label={p.data.title}>
  <Placeholder slot="before" seed={p.id} state="before" />
  <Placeholder slot="after"  seed={p.id} state="after" />
</BeforeAfter>
```

`BeforeAfter` no sabe *qué* va a comparar: una imagen generada, una foto o un video. Solo define **dónde** va cada cosa (`<slot name="before" />`). Esto es **composición**: piezas pequeñas que se combinan, en lugar de componentes gigantes llenos de opciones.

## `markPending()` y la seguridad de `set:html`

```ts
const escape = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', ... })[c]);
export const markPending = (text) =>
  escape(text).replace(/\[\[(PENDIENTE[^\]]*)\]\]/g, '<span class="pending">[[$1]]</span>');
```

Para resaltar `[[PENDIENTE: …]]` necesitamos insertar HTML (`<span>`) dentro de un texto, y eso exige `set:html`, que **no escapa nada**. Si un texto del contenido trajera `<script>…</script>`, se ejecutaría: eso es un **XSS** (*Cross-Site Scripting*). Por eso primero se escapan los caracteres peligrosos (`<` pasa a ser `&lt;`) y **después** se inserta solo el `<span>` que controlamos.

> **Regla de oro:** nunca pases a `set:html` un texto que no hayas escapado o que no controles por completo.
