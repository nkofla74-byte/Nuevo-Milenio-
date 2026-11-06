---
order: 6
title: El panel interno (Progreso y Academia)
summary: Cómo se construyeron estas dos pestañas sin afectar el sitio público, la ruta dinámica que solo existe en desarrollo, import.meta.glob y por qué las respuestas de la evaluación se guardan solo en tu navegador.
status: verificado
phase: Herramienta de desarrollo
files:
  - src/components/internal/InternalShell.astro
  - src/pages/progreso/[...index].astro
  - src/pages/academia/[...modulo].astro
  - src/components/internal/Quiz.astro
  - src/academia/*.md
  - src/data/progress.json
quiz:
  - q: "Estas páginas no aparecerán en el sitio publicado. ¿Qué línea de código lo garantiza y cómo funciona?"
    hint: "Busca getStaticPaths en src/pages/academia/[...modulo].astro."
  - q: "¿Qué hace import.meta.glob('../../academia/*.md', { eager: true })? ¿Qué pasa cuando agrego un archivo 07-algo.md?"
  - q: "Tus respuestas se guardan en localStorage. ¿Dónde está físicamente esa información, quién más puede verla y qué pasa si abres la Academia en otro navegador?"
---

Este módulo explica la herramienta que estás usando ahora mismo. Es un buen ejemplo de un requisito que me pusiste: **agregar algo sin interferir con la arquitectura del producto**.

## La restricción: que no se publique

**El problema:** las páginas de Progreso y Academia describen el código interno. No tienen sentido para un cliente de la constructora y no deben aparecer en Google ni en el sitio publicado.

**Opciones que había:**

| Opción | Problema |
|---|---|
| Poner `noindex` y listo | La página existiría en producción; cualquiera con el enlace podría verla. |
| Un proyecto aparte | Tendría que leer los archivos de este proyecto desde fuera: más complejo. |
| **Ruta que solo genera páginas en modo desarrollo** | Ninguno importante: en el build de producción la ruta no produce ninguna página. |

**Cómo funciona.** En `src/pages/academia/[...modulo].astro`:

```ts
export function getStaticPaths() {
  if (!import.meta.env.DEV) return [];   // ← en producción: cero páginas
  ...
  return [
    { params: { modulo: undefined }, props: { modules, current: null } },  // /academia/
    ...modules.map((m) => ({ params: { modulo: m.slug }, props: {...} })), // /academia/01-arquitectura/ …
  ];
}
```

- `import.meta.env.DEV` es una variable que Vite reemplaza **durante la compilación**: vale `true` con `astro dev` y `false` con `astro build`.
- `getStaticPaths()` es la función con la que una ruta dinámica le dice a Astro **qué páginas generar**. Si devuelve una lista vacía, el archivo no produce ninguna página.
- `[...modulo]` (con tres puntos) es una ruta *rest*: acepta `/academia/` (modulo = `undefined`) y `/academia/01-arquitectura/` con el mismo archivo.

**Qué pasaría sin esto:** las lecciones quedarían públicas en tu dominio. Se verificará en la Fase 6 revisando que la carpeta `dist/` no contenga `academia/` ni `progreso/`.

## Cómo se leen los módulos: `import.meta.glob`

```ts
const files = Object.values(import.meta.glob('../../academia/*.md', { eager: true }));
```

**Qué hace:** es una función de Vite que, **al compilar**, busca todos los archivos que coinciden con el patrón y los importa. Con `eager: true` los carga de inmediato, no bajo demanda.

Cada archivo Markdown importado entrega:

```
{
  frontmatter: { order, title, status, quiz, ... },   ← los datos del encabezado YAML
  Content:     <componente que renderiza el cuerpo>,
  getHeadings: () => [{ depth: 2, slug: 'la-restriccion…', text: 'La restricción…' }, ...],
  file:        '/home/.../src/academia/06-panel-interno.md'
}
```

Con eso, la página arma el índice de la izquierda (ordenado por `order`), la tabla de contenido (`getHeadings`), el estado y la evaluación.

**Qué pasa cuando agrego una lección:** creo `src/academia/07-algo.md` → Vite detecta un archivo nuevo que coincide con el patrón → vuelve a ejecutar el glob → aparece en el índice sin tocar el código de la página.

**¿Por qué no una Content Collection como los servicios?** Funcionaría igual de bien, pero tendría que agregar una colección en `src/content.config.ts`, que es parte de la arquitectura del producto. Me pediste no modificarla por la academia, así que elegí un mecanismo que vive solo dentro de las páginas internas.

## Las pestañas: `InternalShell.astro`

Es un **layout** propio de las páginas internas. Recibe `active` (`'progreso'` o `'academia'`) y marca la pestaña activa con `aria-current="page"`. Ese atributo le dice a un lector de pantalla "estás aquí", no solo lo pinta de otro color. Usa los mismos tokens y fuentes del sitio (`global.css`), así que también sirve de prueba visual del sistema de diseño.

## La evaluación: `Quiz.astro`

```
 escribes en un <textarea>
        │  evento 'input'
        ▼
 localStorage.setItem('academia-quiz-02-entorno', ["resp1","resp2",...])
        │
 pulsas «Copiar mis respuestas»
        ▼
 navigator.clipboard.writeText("Evaluación — El entorno…\n1. … Mi respuesta: …")
        │
        ▼
 lo pegas en el chat ──► yo lo evalúo
```

- **`localStorage`:** un pequeño almacén clave-valor **dentro de tu navegador**, separado por sitio (`localhost:4321`). Nadie más lo ve y no viaja a ningún servidor. Si abres la Academia en otro navegador, empiezas en blanco.
- **Todo va dentro de `try/catch`:** en modo privado o con almacenamiento bloqueado, `localStorage` lanza errores. Sin el `try`, la evaluación dejaría de funcionar. Con él, solo no se guarda, y te lo dice.
- **`aria-live="polite"`:** el mensaje "Copiado" se anuncia en lectores de pantalla sin interrumpir lo que estén leyendo.
- **Por qué no hay respuestas en la página:** me pediste responder primero y que yo evaluara después. Si el código tuviera las respuestas, bastaría con mirar el código fuente.
- **Por qué no se envía a un servidor:** necesitaría un backend y almacenamiento solo para esto, justo lo que me pediste evitar. Copiar y pegar en el chat resuelve el objetivo sin agregar infraestructura.
