---
order: 13
title: Datos personales y persistencia
summary: Qué datos se recogen, dónde viven, cuánto tiempo y cómo se prueba la autorización (Ley 1581) sin base de datos; qué cambiaría si se agregara una, con un diseño de tablas como ejercicio (no implementado).
status: verificado
phase: Fase 5
files:
  - src/lib/quote/email.ts (truncateIp, ConsentRecord)
  - src/pages/legal/politica-de-tratamiento-de-datos.astro
  - docs/operacion-leads.md
  - docs/adr/0004-sin-base-de-datos.md
quiz:
  - q: "¿Dónde queda guardada la prueba de que una persona autorizó el tratamiento de sus datos, si no tenemos base de datos?"
  - q: "¿Por qué guardamos la IP truncada (203.0.113.0) y no la completa?"
  - q: "Mapa de datos: para cada lugar (navegador, Cloudflare, Resend, bandeja de correo), ¿qué dato vive allí y por cuánto tiempo?"
  - q: "Ejercicio de diseño: si la empresa pidiera un panel de solicitudes, ¿qué tablas crearías y cómo se relacionarían 'solicitud' y 'servicio'?"
    hint: "Una solicitud puede pedir varios servicios y un servicio aparece en muchas solicitudes."
---

## El mapa de datos (lo que existe hoy)

```
┌─ NAVEGADOR ───────────────────────────────────────────────────────────────┐
│ localStorage  cookie-consent: {analytics, marketing, version, date}  (hasta borrarlo) │
│ sessionStorage quote-draft: sector, servicios, área, ciudad, urgencia (hasta cerrar)  │
│               ✘ nunca nombre, teléfono, correo ni descripción                         │
└───────────────────────────────────────────────────────────────────────────┘
          │ POST (HTTPS)
┌─ CLOUDFLARE (función) ─ procesa en memoria, no guarda la solicitud ───────┐
│ KV (opcional): rl:quote:<IP> → contador, expira en 10 min                 │
│ logs: eventos sin datos personales (solo nombres de campos)               │
└───────────────────────────────────────────────────────────────────────────┘
          │ API (HTTPS)
┌─ RESEND ─ entrega el correo (encargado del tratamiento) ──────────────────┐
└───────────────────────────────────────────────────────────────────────────┘
          ▼
┌─ BANDEJA DE LA EMPRESA ─ aquí VIVE la solicitud y su prueba de autorización ┐
│ conservación: [[PENDIENTE: meses]] → luego borrar o anonimizar               │
└────────────────────────────────────────────────────────────────────────────┘
```

**Por qué hacer este mapa:** la Ley 1581 exige saber qué datos personales tratas, para qué, dónde y por cuánto tiempo. Sin el mapa, no se puede responder a un titular que pregunta "¿qué tienen de mí?" ni borrar sus datos cuando lo pide.

## La prueba de la autorización sin base de datos

La ley exige que el responsable pueda **demostrar** que el titular autorizó. Así se arma (`api/cotizar.ts`):

```ts
const consent: ConsentRecord = {
  acceptedAt: new Date().toISOString(),          // cuándo (hora del servidor, no del navegador)
  policyVersion: q.policyVersion,                // qué versión de la política aceptó
  ipTruncated: truncateIp(ip),                   // desde dónde, minimizado
  userAgent: …slice(0, 200),
};
```

Va impreso al pie del correo que recibe la empresa. **El correo es el soporte**: por eso `docs/operacion-leads.md` dice que no se debe borrar antes del plazo de conservación.

**Por qué la hora del servidor:** la del navegador la controla el usuario (o un atacante); la del servidor no.

**IP truncada:**
```ts
truncateIp('203.0.113.42')  // → '203.0.113.0'
```
Sirve como indicio de origen sin identificar a una persona concreta. Es el principio de **minimización**: recoger solo lo necesario.

**La casilla no premarcada** y el `z.literal('on')`: si alguien manipula el HTML para enviar `consent=true` o no envía nada, Zod lo rechaza. Solo vale el valor exacto que produce la casilla marcada. Las pruebas unitarias lo verifican.

## Si algún día hay base de datos (ejercicio, **no implementado**)

Te lo muestro solo como diseño, para que practiques. Nada de esto existe en el proyecto.

```
solicitudes                      solicitud_servicios               servicios
──────────────                   ───────────────────               ─────────
id (PK)                    ┌───< solicitud_id (FK) ──┐             slug (PK)
creada_en                  │     servicio_slug (FK) >┼───────────── título
sector                     │     PK(solicitud_id,    │
area_m2, ciudad, urgencia  │        servicio_slug)   │
descripcion                │                         │
nombre, telefono, correo   │
canal                      │     autorizaciones
estado (nueva/contactada/  │     ──────────────
  cotizada/ganada/perdida) │     id (PK)
borrar_despues_de  ────────┼──── solicitud_id (FK) ──┘
                           │     aceptada_en, version_politica, ip_truncada
```

- **PK (clave primaria):** identifica una fila de forma única.
- **FK (clave foránea):** apunta a la PK de otra tabla; la base de datos impide que apunte a algo que no existe.
- **`solicitud_servicios`** es una **tabla intermedia**: una solicitud tiene muchos servicios y un servicio aparece en muchas solicitudes (relación *muchos a muchos*).
- **`autorizaciones`** separada: la prueba legal tiene su propio ciclo de vida.
- **`borrar_despues_de`**: una tarea programada borraría o anonimizaría las filas vencidas. Así la ley se cumple automáticamente.

Consulta típica: "solicitudes de drywall de este mes sin contactar":
```sql
SELECT s.id, s.nombre, s.creada_en
FROM solicitudes s
JOIN solicitud_servicios ss ON ss.solicitud_id = s.id
WHERE ss.servicio_slug = 'drywall-y-superboard'
  AND s.estado = 'nueva'
  AND s.creada_en >= date('now', 'start of month');
```

**Por qué no lo hicimos:** ver `docs/adr/0004`. Agregarlo significa además: un panel con **autenticación** (¿quién puede ver solicitudes?), **autorización** (¿quién puede borrarlas?), copias de seguridad y más superficie de ataque. Se hará cuando exista la necesidad real.
