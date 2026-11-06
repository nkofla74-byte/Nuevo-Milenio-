# ADR 0003 — Las páginas no importan `content.config.ts`
**Estado:** aceptada · 2026-11-05
**Contexto:** el adaptador de Cloudflare prerenderiza dentro de workerd. Importar `content.config.ts` desde una página arrastra el loader `glob` (fs de Node) y rompe el build ("Failed to get static paths"). Se aisló por bisección.
**Decisión:** las constantes compartidas (`CATEGORIES`) viven en `src/config/categories.ts`; `content.config.ts` las importa, nunca al revés.
