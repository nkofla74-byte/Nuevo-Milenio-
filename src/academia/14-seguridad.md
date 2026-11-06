---
order: 14
title: Seguridad
summary: Cabeceras HTTP una por una, la CSP y por qué no hay scripts en línea, secretos, cadena de suministro (las dos dependencias que retiramos) y qué cubre cada medida del OWASP Top 10:2025.
status: verificado
phase: Fase 5–6
files:
  - public/_headers
  - astro.config.mjs (assetsInlineLimit, env)
  - .env.example
  - .github/workflows/ci.yml
  - .github/dependabot.yml
quiz:
  - q: "¿Qué hace la cabecera Content-Security-Policy y qué ataque mitiga? ¿Por qué tuvimos que poner assetsInlineLimit: 0?"
  - q: "¿Qué protege 'frame-ancestors none' / X-Frame-Options: DENY? Describe el ataque."
  - q: "Instalé @lhci/cli y aparecieron 9 vulnerabilidades altas. ¿Qué hice y por qué? ¿Qué harías tú si una dependencia que SÍ necesitas tuviera una?"
  - q: "¿Por qué .env está en .gitignore y existe un .env.example sin valores?"
---

## Cabeceras HTTP (`public/_headers`)

Cloudflare agrega estas cabeceras a cada respuesta. Las verifiqué con `curl -I` sobre el build de producción.

| Cabecera | Qué le dice al navegador | Ataque que mitiga |
|---|---|---|
| `Content-Security-Policy` | de dónde se pueden cargar scripts, estilos, imágenes, iframes… | XSS: un script inyectado no se ejecuta |
| `Strict-Transport-Security` | "solo HTTPS con este dominio, por 2 años" | degradación a HTTP y robo en redes Wi-Fi públicas |
| `X-Content-Type-Options: nosniff` | no adivines el tipo de archivo | un archivo de texto interpretado como script |
| `Referrer-Policy` | al salir a otro sitio, envía solo el dominio | filtrar URLs internas con parámetros |
| `Permissions-Policy` | sin cámara, micrófono ni ubicación | abuso de APIs sensibles |
| `Cross-Origin-Opener-Policy` | aísla la ventana de otras | ataques entre ventanas (tipo Spectre) |
| `X-Frame-Options: DENY` + `frame-ancestors 'none'` | nadie puede meter el sitio en un iframe | *clickjacking*: un sitio malicioso pone el tuyo invisible encima de un botón engañoso |

### La CSP, directiva por directiva

```
default-src 'self'                       → por defecto, solo mi dominio
script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com
                                          → scripts: los míos + Turnstile + analítica. NADA en línea.
style-src 'self' 'unsafe-inline'         → estilos en línea permitidos (atributos style, @font-face)
img-src 'self' data:                     → imágenes propias y SVG embebidos
frame-src https://challenges.cloudflare.com → el único iframe permitido: Turnstile
form-action 'self'                       → los formularios solo pueden enviar a mi dominio
base-uri 'self' · object-src 'none'      → cierra trucos clásicos de inyección
```

**Por qué `assetsInlineLimit: 0`:** al revisar el HTML generado encontré que Astro **metía en línea** los scripts menores de 4 KB (el del encabezado, el de cookies…), 52 en cada página. Con `script-src` sin `'unsafe-inline'`, el navegador los bloquearía y el sitio dejaría de funcionar. Con `assetsInlineLimit: 0` todos salen como archivos `.js` externos. Medición después del cambio: **0 scripts en línea en 50 páginas** y **0 violaciones de CSP** en la consola.

**Por qué no es un problema el JSON-LD:** `<script type="application/ld+json">` es un bloque de datos; el navegador no lo ejecuta y la CSP no lo afecta.

**El costo aceptado:** `style-src 'unsafe-inline'`. Los estilos en línea son un riesgo mucho menor que los scripts (no ejecutan código) y los necesitamos para variables CSS en atributos `style`. Quedó documentado en el ADR 0002.

## Secretos

```
.env            ← valores reales, SOLO en tu máquina (en .gitignore)
.env.example    ← los NOMBRES de las variables, sin valores (sí va en git)
Cloudflare      ← valores de producción, cifrados, en el panel
```

**Qué pasaría si `.env` llegara a git:** el historial de git es permanente. Aunque luego lo borres, la llave sigue en commits anteriores, y bots que rastrean GitHub la encuentran en minutos. Por eso el CI incluye **gitleaks**, que escanea todo el historial buscando patrones de llaves.

## Cadena de suministro

**Lo que pasó de verdad en este proyecto:**
1. Instalé `@lhci/cli` (Lighthouse CI) → `npm audit`: **9 vulnerabilidades altas** en sus dependencias. **Lo desinstalé** y escribí `scripts/lighthouse.mjs` (60 líneas) usando `lighthouse`, que ya estaba instalado y sin vulnerabilidades.
2. Instalé `wait-on` para el CI → lo cambié por un bucle con `curl`. Una dependencia menos.
3. Quedan 11 vulnerabilidades **moderadas** en `minimatch`, dentro de ESLint. Análisis: es una denegación de servicio que requiere patrones de búsqueda maliciosos; ESLint solo procesa archivos del propio repositorio y no llega al sitio publicado. Forzar la actualización rompería ESLint. **Decisión: aceptar y documentar.** El CI bloquea desde severidad alta y Dependabot avisará cuando haya arreglo.

**Si una dependencia que necesitas tiene una vulnerabilidad alta:** (1) lee el aviso: ¿el código vulnerable se ejecuta en tu caso?; (2) busca una versión corregida; (3) si no existe, usa `overrides` en `package.json` para forzar la subdependencia corregida y prueba; (4) si nada sirve, aísla o reemplaza la dependencia.

## OWASP Top 10:2025 — qué cubrimos

| Riesgo | Medida en este proyecto |
|---|---|
| A01 Control de acceso | No hay áreas privadas; las páginas internas no existen en producción (verificado: 404) |
| A02 Configuración insegura | Cabeceras, CSP, fallar cerrado sin secretos |
| A03 Cadena de suministro | Lockfile + `npm ci`, `npm audit` en CI, Dependabot, revisión de postinstall, menos dependencias |
| A04 Fallas criptográficas | HTTPS obligatorio (HSTS); sin datos sensibles almacenados |
| A05 Inyección | Zod, escape HTML, sin CR/LF en cabeceras, `markPending` escapa antes de `set:html` |
| A07 Autenticación | No aplica (no hay login) |
| A10 Condiciones excepcionales | Errores genéricos al usuario, logs sin datos personales, 500 sin detalles técnicos |
