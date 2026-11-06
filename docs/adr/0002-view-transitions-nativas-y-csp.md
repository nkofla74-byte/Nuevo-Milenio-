# ADR 0002 — View Transitions nativas en lugar de ClientRouter
**Estado:** aceptada · 2026-11-05
**Contexto:** el prompt pide CSP estricta y transiciones entre páginas. La documentación de Astro 7 indica que su CSP no es compatible con `<ClientRouter />`.
**Decisión:** `@view-transition { navigation: auto; }` (cross-document, sin JS) y CSP por cabecera sin `unsafe-inline` en scripts; `vite.build.assetsInlineLimit: 0` para que ningún script quede en línea.
**Consecuencias:** sin JS de router; las animaciones GSAP se reinician limpiamente en cada navegación (sin ScrollTriggers huérfanos). Navegadores sin soporte navegan sin animación (mejora progresiva). `style-src` mantiene `'unsafe-inline'` por atributos `style` y el bloque de fuentes.
