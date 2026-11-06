---
order: 12
title: "Backend: el cotizador y su API"
summary: El viaje completo de una solicitud HTTP — del formulario en el navegador al endpoint en Cloudflare, cada capa de validación y defensa, el envío de correos y la respuesta — con los ataques reales que probamos con curl.
status: verificado
phase: Fase 5 — Cotizador
files:
  - src/pages/cotizar/index.astro
  - src/lib/quote/form.ts
  - src/pages/api/cotizar.ts
  - src/lib/quote/schema.ts
  - src/lib/quote/guards.ts
  - src/lib/quote/email.ts
  - astro.config.mjs (env.schema)
quiz:
  - q: "Ordena las capas por las que pasa una solicitud en /api/cotizar/ y di qué ataque detiene cada una."
  - q: "¿Por qué el honeypot responde {ok: true} en vez de un error?"
  - q: "El formulario valida en el navegador con atributos HTML (required, maxlength…). ¿Por qué igual validamos con Zod en el servidor? Usa el ejemplo del correo de 10.000 caracteres."
  - q: "¿Qué significa que Turnstile 'falla cerrado'? ¿Qué pasaría si fallara abierto?"
  - q: "¿Qué es el patrón PRG (Post/Redirect/Get) y para qué lo usa el formulario cuando no hay JavaScript?"
---

## La única pieza de backend del sistema

Recuerda el módulo 1: todo el sitio es HTML generado de antemano, **excepto esto**. Es una función que corre en Cloudflare cada vez que alguien envía el formulario (`export const prerender = false`).

## El viaje de una solicitud, de punta a punta

```
NAVEGADOR (form.ts)                         CLOUDFLARE (api/cotizar.ts)                   SERVICIOS EXTERNOS
──────────────────                          ───────────────────────────                   ──────────────────
1. usuario completa 5 pasos
   (validación por paso con
    checkValidity(): solo AYUDA)
2. Turnstile inyecta un token oculto
3. fetch POST /api/cotizar/  ─────────────► 4. ¿Origin = mi dominio?      no → 403
   Accept: application/json                 5. ¿cuerpo ≤ 20 KB?           no → 413
   body: FormData                           6. ¿IP bajo el límite?        no → 429  (KV o memoria)
                                            7. ¿honeypot vacío?           no → 200 "ok" falso
                                            8. Zod: forma, tipos, límites no → 400 + errores por campo
                                            9. Turnstile ──────────────────────────────────► siteverify
                                                                          ◄──────────────── success?
                                                                          no → 400
                                           10. arma correo escapado + prueba de autorización
                                           11. Resend API ─────────────────────────────────► correo a la empresa
                                                          ─────────────────────────────────► confirmación al usuario
12. recibe {ok:true}  ◄──────────────────── 200 {ok:true}
13. location → /cotizar/gracias/
```

### Petición y respuesta HTTP reales (de nuestras pruebas)

```http
POST /api/cotizar/ HTTP/1.1
Origin: http://localhost:4321
Accept: application/json
Content-Type: application/x-www-form-urlencoded

sector=retail&services=drywall-y-superboard&city=Bogota&urgency=1-mes&name=Ana…&consent=on&cf-turnstile-response=XXXX…
```
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Cache-Control: no-store

{"ok":true}
```

## Cada capa, por qué existe y qué pasaría sin ella

| Capa | Archivo | Detiene | Sin ella… |
|---|---|---|---|
| **Origen** (`isSameOrigin`) | guards.ts | Formularios en otros sitios que envían a nuestra API (CSRF) | Cualquier página podría usar nuestra API para mandar spam. |
| **Tamaño** (20 KB) | cotizar.ts | Cuerpos gigantes para agotar memoria | Un atacante podría enviar megas por solicitud. |
| **Rate limit** (5 cada 10 min por IP) | guards.ts | Inundación de solicitudes | Mil correos falsos en un minuto en la bandeja de la empresa. |
| **Honeypot** | cotizar.ts | Bots simples que llenan todos los campos | Spam básico. |
| **Zod** | schema.ts | Datos mal formados, enormes o maliciosos | Correos con 10.000 caracteres, servicios inexistentes, inyección de cabeceras. |
| **Turnstile** | guards.ts | Bots sofisticados | Spam automatizado que sí pasa el honeypot. |
| **Escape HTML** | email.ts | Inyección de HTML/JS en el correo | Un `<script>` en la descripción viajaría al cliente de correo de la empresa. |

### Detalles que vale la pena entender

**Honeypot con "ok" falso:**
```ts
if (typeof raw.website === 'string' && raw.website.length > 0) return respond(request, { ok: true });
```
El campo `website` está fuera de la pantalla (`left: -10000px`) y es `aria-hidden`: una persona nunca lo ve ni lo llena; un bot que rellena todo, sí. Si le respondiéramos "error", el bot aprendería a dejarlo vacío. Al decirle "ok", cree que tuvo éxito y no lo intenta de otra forma.

**Zod transforma además de validar:**
```ts
const clean = (max) => z.string()
  .transform((s) => s.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim())   // ① quita CR/LF y controles
  .pipe(z.string().max(max));                                                                 // ② luego valida longitud
```
Los saltos de línea `\r\n` en un campo que termina en una **cabecera** de correo (como el asunto) permitirían agregar cabeceras falsas, por ejemplo `Bcc: victima@x.com`: es la *inyección de cabeceras*. La probamos con `curl` y quedó como prueba automática.

**Turnstile falla cerrado:**
```ts
try { … return data.success === true; } catch { return false; }   // si Cloudflare no responde → rechaza
```
Si la verificación falla por un error de red, **rechazamos**. Si "fallara abierto" (aceptar ante la duda), un atacante solo tendría que provocar errores para saltarse la protección. Por la misma lógica, si en producción falta `TURNSTILE_SECRET_KEY`, el endpoint responde 503 en lugar de aceptar todo sin verificar.

**Secretos que nunca llegan al navegador** (`astro.config.mjs`):
```js
RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', default: '1x00…AA' }),
```
`astro:env` **impide en el build** que una variable `server/secret` se importe desde código de cliente. Además las tipa: `RESEND_API_KEY` es `string | undefined`, y TypeScript obliga a manejar el caso en que falte.

**Errores genéricos para el usuario, detalle para el log:**
```ts
log('invalid', { fields: Object.keys(fields) });   // solo NOMBRES de campos, nunca valores (datos personales)
```
El usuario ve "Revise los campos marcados". El log dice qué campos fallaron, pero **no** sus valores: un log con teléfonos y correos sería otra base de datos personal que habría que proteger (OWASP A10:2025, Ley 1581).

## Mejora progresiva: funciona sin JavaScript

```
Sin JS:  <form method="post" action="/api/cotizar/">  →  todos los pasos visibles en una sola página
         POST normal → el servidor responde 303 See Other → Location: /cotizar/gracias/   (patrón PRG)
Con JS:  form.dataset.enhanced → 5 pasos, validación por paso, fetch + JSON, borrador en sessionStorage
```

El mismo endpoint sirve a ambos: mira la cabecera `Accept`. Si pide JSON, responde JSON; si no, redirige. **PRG** (*Post/Redirect/Get*) evita que, al recargar la página de gracias, el navegador vuelva a enviar el formulario.

**Limitación honesta:** Turnstile necesita JavaScript, así que sin JS el envío no pasa la verificación. Por eso hay un `<noscript>` que ofrece los canales de contacto alternativos.

## El borrador en `sessionStorage`

```ts
const DRAFT_FIELDS = ['sector', 'services', 'area', 'city', 'neighborhood', 'urgency'] as const;
```
Si el usuario recarga la página o vuelve atrás, no pierde lo elegido. Pero **solo se guardan datos que no son personales**: nombre, teléfono, correo y descripción nunca se guardan en el navegador. Es *minimización de datos*. `sessionStorage` (y no `localStorage`) se borra al cerrar la pestaña.

## Cómo se verificó

Con `curl`, saltando el navegador como lo haría un atacante (resultados reales):

```
origen ajeno ...................................... 403 Solicitud no permitida
correo de 10.000 caracteres + datos inválidos ..... 400 + errores por campo
honeypot lleno .................................... 200 {"ok":true}  (sin envío; log: honeypot)
válido sin token Turnstile ........................ 400
válido con token de prueba ........................ 200 {"ok":true}
6.ª solicitud en 10 minutos ....................... 429
```

Y con Playwright, un usuario real recorre los 5 pasos, intenta enviar sin autorizar (ve el error), autoriza, Turnstile emite el token de prueba y llega a "Solicitud recibida". Esta prueba corre en cada cambio.
