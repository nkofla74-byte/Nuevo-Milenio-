---
order: 18
title: Despliegue
summary: Cómo pasó el sitio de tu computador a internet — build, Cloudflare Workers, wrangler, recursos KV aprovisionados solos, DNS — y qué falta para el lanzamiento con dominio propio.
status: verificado
phase: Fase 7 — Lanzamiento (parcial)
files:
  - wrangler.jsonc
  - dist/server/wrangler.json (generado)
  - public/_headers
  - docs/launch-checklist.md
quiz:
  - q: "Ordena los pasos que ocurrieron entre 'npm run build' y que la página respondiera en workers.dev."
  - q: "Después de publicar, todas las URLs daban 000 durante unos 100 segundos. ¿Qué estaba pasando?"
  - q: "El cotizador en producción responde 503. ¿Es un error? ¿Qué falta y por qué está diseñado así?"
  - q: "¿Qué es un 'secreto' en wrangler y por qué no se pone la llave de Resend en wrangler.jsonc?"
---

## Qué significa "desplegar"

Hasta ahora el sitio vivía en tu computador (`localhost:4321`). **Desplegar** es copiar el resultado del build a servidores conectados a internet y conectar una dirección pública que apunte a ellos.

## Lo que pasó, paso a paso (real)

```
tu computador                                         Cloudflare
─────────────                                         ──────────
1. npx wrangler login ──── OAuth en el navegador ───► autoriza tu cuenta (token guardado en ~/.config/.wrangler)
2. npm run build
   ├─ genera imágenes OG (Node)
   ├─ dist/client/  → 202 archivos estáticos (HTML, CSS, JS, fuentes, imágenes)
   └─ dist/server/  → entry.mjs (el Worker: solo /api/cotizar/) + wrangler.json
3. npx wrangler deploy --config dist/server/wrangler.json
   ├─ ve RATE_LIMIT_KV y SESSION sin id ──────────────► crea 2 espacios KV automáticamente
   ├─ sube 884 KB (229 KB comprimidos) ───────────────► guarda los archivos en su red global
   └─ publica el Worker "nuevo-milenio" ──────────────► https://nuevo-milenio.sitio-construccion.workers.dev
4. ~100 s de "000" ── el DNS del subdominio nuevo se propaga ── luego 200
```

### `wrangler.jsonc` — la configuración propia

```jsonc
{
  "name": "nuevo-milenio",                         // → la primera parte de la URL
  "compatibility_date": "2026-11-01",              // versión del runtime: tu código no se rompe si Cloudflare cambia
  "kv_namespaces": [{ "binding": "RATE_LIMIT_KV" }], // sin "id": wrangler lo crea la primera vez
  "observability": { "enabled": true }             // logs del Worker en el panel
}
```

El adaptador de Astro **combina** este archivo con lo suyo (entrada del Worker, carpeta de archivos estáticos) y genera `dist/server/wrangler.json`. Por eso publicamos con `--config dist/server/wrangler.json`.

**`binding`** es el nombre con el que el código ve el recurso. En `api/cotizar.ts`:
```ts
const kv = cfEnv.RATE_LIMIT_KV as KVLike | undefined;
```
Ahora que existe, el límite de envíos es **compartido** entre todos los servidores de Cloudflare, y no por instancia como en local.

### Cómo se sirve cada solicitud

```
visitante ──► servidor de Cloudflare más cercano (Bogotá, si hay)
               ├─ ¿es un archivo estático? (/servicios/drywall/…, /_astro/x.js) → lo entrega directo + _headers
               └─ ¿es /api/cotizar/? → ejecuta el Worker (entry.mjs)
```
El 99% de las visitas **nunca ejecuta código**: solo reciben archivos. Por eso el plan gratuito alcanza de sobra.

## Verificación en vivo (resultados reales)

```
/  /servicios/drywall…/  /cotizar/  /sitemap-index.xml  /robots.txt  /og/inicio.png → 200
/academia/  /progreso/  /no-existe/                                                  → 404
cabeceras: HSTS, CSP, X-Frame-Options, X-Robots-Tag: noindex (solo en workers.dev)  ✔
POST /api/cotizar/ → 503 "El formulario no está disponible en este momento…"
```

**El 503 no es un error: es el diseño "fallar cerrado"** (módulo 12). En producción faltan `TURNSTILE_SECRET_KEY` y las variables de correo. Sin verificación antispam, el endpoint prefiere no aceptar nada antes que aceptar spam. Cuando se configuren, el formulario funcionará.

## Secretos: cómo se configurarán las llaves

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY --config dist/server/wrangler.json   # pide el valor, no queda en la terminal
npx wrangler secret put RESEND_API_KEY        --config dist/server/wrangler.json
npx wrangler secret put QUOTE_TO_EMAIL        --config dist/server/wrangler.json
npx wrangler secret put QUOTE_FROM_EMAIL      --config dist/server/wrangler.json
```

Un **secreto** se guarda cifrado en Cloudflare y el Worker lo recibe al ejecutarse. **Por qué no en `wrangler.jsonc`:** ese archivo va en git. Una llave en git es una llave pública (módulo 14).

## Qué falta (Fase 7)
1. Llaves de Turnstile y Resend → el cotizador empieza a enviar correos.
2. Comprar el dominio → conectarlo (Workers → nuevo-milenio → Settings → Domains & Routes → Add custom domain) → cambiar `site` → volver a publicar.
3. Search Console, Bing, Google Business Profile (módulo 17 y `docs/launch-checklist.md`).
4. Conectar el repositorio a GitHub para que el CI (módulo 15) corra en cada cambio.

**Cómo volver a publicar después de un cambio:**
```bash
npm run build && npx wrangler deploy --config dist/server/wrangler.json
```
Cada publicación crea una **versión** con su ID (la actual: `f1085762…`). Si algo sale mal, en el panel puedes volver a la versión anterior en segundos.
