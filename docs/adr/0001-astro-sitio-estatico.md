# ADR 0001 — Astro con salida estática y una sola función de servidor
**Estado:** aceptada · 2026-11-05
**Contexto:** sitio de contenido y captación; necesita SEO, Core Web Vitals altos y un único endpoint (cotizador).
**Decisión:** Astro `output: 'static'` + adaptador de Cloudflare; solo `/api/cotizar/` usa `prerender = false`.
**Consecuencias:** HTML generado en el build, servido desde CDN; superficie de ataque mínima. Descartados Next.js (más JS para un sitio de contenido) y base de datos (no hay necesidad hoy; ver ADR 0004).
