# ADR 0005 — Cotizador con mejora progresiva y validación en servidor
**Estado:** aceptada · 2026-11-05
**Decisión:** el formulario es HTML estándar (POST + redirección 303); JS lo convierte en 5 pasos con `fetch`. La validación real es Zod en el servidor; el cliente usa atributos HTML nativos (no se envía Zod al navegador). Turnstile falla cerrado; honeypot responde "ok" falso.
**Limitación conocida:** Turnstile requiere JS; sin JS se muestra un aviso con canales alternativos.
