# Sitio web — Construcciones y Acabados Nuevo Milenio S.A.S.

Sitio corporativo de captación ("De obra negra a obra terminada"). Astro 7 + TypeScript estricto, Tailwind v4, GSAP + Lenis, Cloudflare Pages.

## Requisitos
- Node.js ≥ 22 (desarrollado con 26.13 vía nvm). Si el Node del sistema falla, usa `nvm` y el `PATH` de nvm.

## Instalación y scripts
```bash
npm ci                 # instala exactamente el lockfile
npm run dev            # http://localhost:4321  (+ /progreso/ y /academia/, solo en desarrollo)
npm run build          # genera imágenes OG y el sitio en dist/
npm run preview        # sirve dist/ con el runtime de Cloudflare (cabeceras incluidas)
npm run check          # verificación de tipos
npm run lint           # ESLint
npm run format         # Prettier
npm test               # pruebas unitarias (Vitest)
npm run test:e2e       # e2e + accesibilidad (Playwright + axe)
npm run lighthouse -- http://localhost:4322   # presupuestos de rendimiento (falla si < 95)
```

## Variables de entorno
Copia `.env.example` a `.env` para desarrollo. En producción se configuran en Cloudflare (Settings → Variables and secrets).

| Variable | Tipo | Uso |
|---|---|---|
| `RESEND_API_KEY` | secreto | envío de correos del cotizador |
| `TURNSTILE_SECRET_KEY` | secreto | verificación antispam en servidor |
| `QUOTE_TO_EMAIL` / `QUOTE_FROM_EMAIL` | secreto | destinatario y remitente de las solicitudes |
| `PUBLIC_TURNSTILE_SITE_KEY` | público | widget Turnstile (por defecto, clave de prueba) |
| `PUBLIC_CF_ANALYTICS_TOKEN` | público | analítica sin cookies (solo tras consentimiento) |
| `RATE_LIMIT_KV` | binding KV | límite de envíos compartido entre instancias (recomendado) |

Sin `TURNSTILE_SECRET_KEY` o sin las variables de correo, el endpoint **falla cerrado** en producción (503). En desarrollo usa la clave de prueba y solo registra un resumen sin datos personales.

## Cómo editar contenido
- **Datos del negocio:** `src/config/site.ts` (un dato pendiente se escribe como `PENDING` y aparece como `[[PENDIENTE]]`).
- **Servicios, sectores, proyectos, blog:** archivos Markdown en `src/content/<colección>/`. El esquema (`src/content.config.ts`) valida cada archivo en el build.
- **Nuevo servicio:** crear `src/content/servicios/<slug>.md` con el mismo frontmatter que los existentes. La página, el catálogo, el cotizador, el sitemap y `llms.txt` se actualizan solos.

## Despliegue
Cloudflare Pages/Workers con el adaptador `@astrojs/cloudflare`. Cabeceras de seguridad en `public/_headers`. Checklist de lanzamiento: `docs/launch-checklist.md`.

## Documentación
`PLAN.md` · `CONTENT_TODO.md` · `CREDITS.md` · `docs/` (sistema de diseño, SEO, leads, lanzamiento, ADRs, informe de auditoría).
