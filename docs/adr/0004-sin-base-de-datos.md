# ADR 0004 — Sin base de datos en la versión inicial
**Estado:** aceptada · 2026-11-05
**Contexto:** las solicitudes se atienden por correo/WhatsApp; el contenido se edita en Markdown.
**Decisión:** no hay base de datos. La prueba de autorización viaja en el correo de la solicitud. Rate limiting con KV (o WAF).
**Revisar cuando:** la empresa necesite un panel para gestionar solicitudes o editar contenido sin archivos (opciones: Cloudflare D1, Supabase; o un CMS headless mediante un loader de colecciones).
