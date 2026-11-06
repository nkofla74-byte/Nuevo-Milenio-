# Checklist de lanzamiento

> Expectativa realista: el sitio está técnicamente listo para indexarse, pero nadie puede garantizar indexación inmediata ni primeras posiciones. Google rastrea y evalúa en sus propios tiempos.

1. [ ] Dominio propio; actualizar `site` en `astro.config.mjs`, `public/.well-known/security.txt` y volver a construir.
2. [ ] Proyecto en Cloudflare Pages/Workers conectado al repositorio; variables y secretos configurados (README).
3. [ ] KV `RATE_LIMIT_KV` creado y enlazado, o regla de rate limiting en el WAF para `/api/cotizar/`.
4. [ ] HTTPS activo, redirección a un único host canónico (con `www`), HSTS verificado.
5. [ ] Turnstile: crear sitio y reemplazar la clave de prueba.
6. [ ] Resend: verificar dominio (SPF/DKIM) para `QUOTE_FROM_EMAIL`.
7. [ ] Probar el cotizador en producción de punta a punta (correo a la empresa y confirmación al usuario).
8. [ ] Mozilla Observatory y securityheaders.com → objetivo A+.
9. [ ] Google Search Console: verificar dominio por DNS, enviar `sitemap-index.xml`, solicitar indexación de inicio, servicios principales y contacto.
10. [ ] Bing Webmaster Tools (importar desde Search Console) e IndexNow.
11. [ ] Google Business Profile: categoría principal "Contratista general" o "Empresa de remodelación", NAP idéntico al del sitio, fotos reales, horario, área de servicio.
12. [ ] Directorios colombianos con el mismo NAP.
13. [ ] Analítica sin cookies (token en `PUBLIC_CF_ANALYTICS_TOKEN`).
14. [ ] A la semana: revisar cobertura y Core Web Vitals en Search Console.
15. [ ] 2FA en dominio, Cloudflare, GitHub y correo; protección de la rama `main`.
