---
order: 5
title: Contenido como datos
summary: La configuración única del negocio (site.ts), el truco del Symbol PENDING para no publicar datos inventados, y las Content Collections con esquemas Zod que validan los 33 archivos de contenido.
status: verificado
phase: Fase 1 — Cimientos
files:
  - src/config/site.ts
  - src/content.config.ts
  - src/content/servicios/*.md
  - src/content/sectores/*.md
  - src/content/proyectos/*.md
  - src/content/blog/*.md
quiz:
  - q: "¿Por qué usamos un Symbol (PENDING) en vez de un texto como 'PENDIENTE' para los datos que faltan? ¿Qué error evita?"
  - q: "Si alguien edita un servicio y pone un seoTitle de 80 caracteres, ¿qué pasa y en qué momento? ¿Por qué es mejor que falle ahí?"
  - q: "Quiero agregar un servicio nuevo, 'Instalación de vidrios'. ¿Qué archivo crearías y qué debe tener para que el sistema lo acepte?"
  - q: "¿Qué significa 'una sola fuente de verdad'? Da un ejemplo de este proyecto donde varias partes leen el mismo dato."
---

> **Estado: verificado.** Los esquemas validaron los 33 archivos (`npx astro sync`), y en las capturas del inicio se ve el contenido real: los 20 servicios en el catálogo, los 7 sectores en las pestañas y los marcadores `[[PENDIENTE]]` de `site.ts` en el footer y en las cifras.

## Una sola fuente de verdad: `src/config/site.ts`

**Qué es:** un archivo TypeScript con **todos** los datos del negocio: nombre, NIT, teléfono, dirección, horarios, cifras, certificaciones, clientes autorizados.

**Por qué existe:** el teléfono, por ejemplo, va a aparecer en el footer, en la página de contacto, en el JSON-LD para Google, en la política de datos y en los correos. Si estuviera escrito en cinco lugares, algún día alguien lo cambiaría en cuatro. Con una sola fuente de verdad, se cambia una vez.

```
                        src/config/site.ts
                       ┌───────────────────┐
                       │ phone, nit, city… │
                       └─────────┬─────────┘
       ┌──────────────┬──────────┼────────────┬───────────────────┐
       ▼              ▼          ▼            ▼                   ▼
   Footer.astro   seo.ts     Contacto     Política de       WhatsAppFab
   (lo muestra)   (JSON-LD)  (pendiente)  datos (pendiente) (arma el enlace)
```

### El problema de los datos que aún no existen

Tu prompt exige: **no inventar nada**. Pero el sitio necesita mostrar algo donde irá el NIT. ¿Qué ponemos mientras tanto?

**Opción ingenua:** `nit: 'PENDIENTE'`. El problema es que es un texto como cualquier otro: puede terminar enviado a Google en los datos estructurados o pasar una revisión sin que nadie lo note.

**Lo que hice:**

```ts
export const PENDING = Symbol('pending');          // ① un valor único que NO es texto
export type Maybe<T> = T | typeof PENDING;        // ② "un T, o pendiente"
export const isPending = (v) => v === PENDING;    // ③ la forma de preguntarlo

nit: PENDING as Maybe<string>,                    // ④ el NIT todavía no existe

export const display = (v, label) =>              // ⑤ para mostrarlo en pantalla
  isPending(v) ? `[[PENDIENTE: ${label}]]` : String(v);
```

Línea por línea:
1. `Symbol('pending')` crea un valor **único en todo el programa**. No es igual a ningún texto ni a ningún otro símbolo.
2. `Maybe<string>` le dice a TypeScript: "esto puede ser un texto **o** el símbolo pendiente".
3. Como TypeScript sabe que puede ser el símbolo, **te obliga a revisarlo** con `isPending()` antes de usarlo como texto. Si intentas hacer `site.nit.toUpperCase()`, el editor te marca error.
4. El NIT queda declarado como pendiente.
5. `display()` es lo que usan las plantillas: si falta el dato, muestra un marcador visible `[[PENDIENTE: NIT]]`, que nadie confunde con un NIT real.

Y en `src/lib/seo.ts`, para Google:

```ts
const opt = (v) => (typeof v === 'symbol' ? undefined : v);
taxID: opt(site.nit),        // si es pendiente → undefined → JSON.stringify OMITE el campo
```

Para Google, **es mejor no decir nada que decir algo falso**. `JSON.stringify` descarta las propiedades con valor `undefined`, así que el campo simplemente no aparece.

**Qué pasaría sin esto:** un NIT o un teléfono inventados en el sitio, o enviados a Google, son un problema legal (Estatuto del Consumidor: información veraz) y de confianza. Aquí la regla del prompt **está convertida en código**: es imposible publicar un dato pendiente sin que se note.

## Content Collections: el contenido como datos estructurados

**Qué es:** la forma en que Astro organiza contenido en archivos (Markdown, JSON) con un **esquema** que valida su forma.

Abre `src/content/servicios/drywall-y-superboard.md`:

```markdown
---                                  ← frontmatter YAML: DATOS ESTRUCTURADOS
title: "Drywall y superboard"
seoTitle: "Drywall en Bogotá | Muros y superboard"
category: "sistemas-livianos"
includes:
  - "Muros divisorios en drywall"
  - "Superboard para zonas húmedas y exteriores"
faqs:
  - q: "¿El drywall es resistente?"
    a: "Bien instalado y con los refuerzos correctos…"
---
El drywall permite crear o cambiar espacios en días…   ← cuerpo Markdown: TEXTO LIBRE
```

**Por qué dividirlo así:** la plantilla de la página de servicio (pendiente, Fase 4) necesita saber qué es una lista de "qué incluye" para dibujarla como lista con íconos, y qué es una pregunta frecuente para generar el acordeón y el JSON-LD `FAQPage`. Si todo fuera texto libre, no podría distinguirlos.

### El esquema: `src/content.config.ts`

```ts
const servicios = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/servicios' }),   // ① dónde están
  schema: z.object({                                                        // ② qué forma deben tener
    title: z.string(),
    seoTitle: z.string().max(60),           // Google corta los títulos de más de ~60 caracteres
    description: z.string().max(155),       // y las descripciones de más de ~155
    category: z.enum(Object.keys(CATEGORIES)),   // solo categorías que existen
    needsConfirmation: z.boolean().default(false),
    includes: z.array(z.string()),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});
```

1. **El loader** `glob` busca todos los `.md` de la carpeta.
2. **Zod** describe la forma exacta de los datos. Es una librería de validación: `z.string().max(60)` significa "texto de máximo 60 caracteres".

**Cómo funciona por dentro:**

```
 npx astro sync   (también corre en cada dev y build)
   │
   ├─► lee los 20 .md de servicios, extrae el frontmatter YAML
   ├─► pasa cada uno por el esquema Zod
   │      ✔ válido      → lo guarda en la "data store" de contenido
   │      ✘ inválido    → ERROR con archivo, campo y motivo; el build se detiene
   └─► genera tipos TypeScript (.astro/types.d.ts) a partir del esquema
```

**Ejemplo de lo que pasa si alguien se equivoca:** si un editor pone `category: "acabado"` (sin la "s"), el build falla con un mensaje que nombra el archivo y el campo `category`. **Es mucho mejor que falle en el build que publicar una página rota** que nadie revisó. El esquema es un **contrato** entre el contenido y el diseño.

**Bonus — los tipos:** como Astro genera tipos desde el esquema, cuando una plantilla escriba `servicio.data.includes`, el editor sabrá que es `string[]` y autocompletará. Si escribe `servicio.data.incluye` (mal escrito), lo marcará en rojo.

**Alternativas:**
- *Contenido escrito directamente en los componentes:* el cliente tendría que editar código para cambiar un texto.
- *Un CMS headless (Sanity, Strapi, Decap):* sirve si el cliente quiere editar desde un panel web. Las colecciones de Astro aceptan *loaders* de CMS, así que el cambio futuro sería en el loader, no en las páginas. Por eso tu prompt dice "preparado para un CMS headless en el futuro".

### `needsConfirmation` y los marcadores en el texto

Hidrosanitario y fachadas tienen `needsConfirmation: true` porque tu prompt los marca como "[confirmar]". Dentro de los textos, cada afirmación que la empresa debe validar lleva `[[PENDIENTE: …]]` (por ejemplo, los turnos nocturnos). Al final del proyecto, un `grep "PENDIENTE"` dará la lista exacta de lo que falta, que también estará en `CONTENT_TODO.md`.

## Por qué generé el contenido con un script

Escribir 33 archivos YAML a mano tiene riesgos: una comilla mal cerrada, una sangría incorrecta o un título de 61 caracteres. Escribí un script de Python temporal que:
1. Tiene los datos en estructuras de Python (listas y diccionarios).
2. **Valida con `assert`** que cada `seoTitle` tenga ≤ 60 caracteres y cada `description` ≤ 155, antes de escribir.
3. Genera YAML siempre con comillas dobles (para que caracteres como `:` o `¿` no rompan nada).

El script vivió en una carpeta temporal porque se usa una sola vez. **Lo que queda en el proyecto son los `.md`**, que son lo que el equipo va a editar de ahora en adelante.

> **Principio:** automatiza lo repetitivo y propenso a errores, y deja como "fuente" el formato que la persona que mantiene el proyecto puede editar.
