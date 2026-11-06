# Informe de auditoría — Fase 6 (2026-11-05)

Mediciones reales en este equipo, sobre el build de producción (`astro preview`, runtime de Cloudflare). No son datos de campo (CrUX): esos se obtienen semanas después del lanzamiento.

## Lighthouse 13.6 (móvil, simulado)
| Página | Rend. | Accesib. | Buenas prácticas | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| / | 97 | 100 | 100 | 100 | 2,1 s | 0,028 | 20 ms |
| /servicios/drywall-y-superboard/ | 99 | 100 | 100 | 100 | 1,4 s | 0,056 | 0 ms |
| /cotizar/ | 98 | 100 | 100 | 100 | 1,5 s | 0,087 | 0 ms |

## Accesibilidad
- axe-core (WCAG 2.0/2.1/2.2 A y AA) en 9 páginas clave, escritorio y móvil: **0 violaciones** (tras corregir el token `accent-strong` y etiquetas en `concrete-500`).
- Teclado: salto al contenido, pestañas con flechas, comparador con flechas, FAQ con `<details>`.
- Pendiente: revisión manual con lector de pantalla (NVDA/VoiceOver).

## Seguridad
- Cabeceras verificadas en `astro preview`: CSP (scripts sin `unsafe-inline`), HSTS preload, nosniff, Referrer-Policy, Permissions-Policy, COOP, X-Frame-Options.
- 0 scripts ejecutables en línea en las 50 páginas; 0 violaciones de CSP en consola en 9 páginas.
- Endpoint atacado con `curl`: origen ajeno (403), datos inválidos y correo de 10.000 caracteres (400), honeypot (ok falso, sin envío), sin token Turnstile (400), sexta solicitud en 10 min (429), CR/LF en el nombre (eliminados).
- `npm audit`: 0 vulnerabilidades altas. 11 moderadas en `minimatch` (dependencia de ESLint, solo desarrollo, no procesa entradas externas). Se retiraron `@lhci/cli` y `wait-on` por traer vulnerabilidades.
- Pendiente tras el despliegue: Mozilla Observatory / securityheaders.com (necesitan URL pública).

## Pruebas
- Vitest: 16 pruebas (esquema, sanitización, correo, rate limit, Turnstile, origen).
- Playwright: 30 pruebas (Chromium escritorio y móvil). Firefox y WebKit configurados para CI.
- `astro check`: 0 errores · ESLint: 0 problemas · Prettier: OK.

## Pendientes conocidos
Ver `CONTENT_TODO.md` (datos y material) y `docs/launch-checklist.md` (Fase 7).
