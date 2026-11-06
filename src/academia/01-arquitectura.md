---
order: 1
title: Arquitectura del sistema
summary: Qué tipo de producto estamos construyendo, qué piezas lo forman (frontend, backend, API, base de datos) y cómo se conectan en este proyecto concreto.
status: verificado
phase: Fase 0 — Descubrimiento y plan
files:
  - PLAN.md
  - prompt-sitio-web-construccion.md
quiz:
  - q: "Con tus palabras: ¿qué diferencia hay entre un 'sitio de contenido y captación' y una 'aplicación'? ¿Por qué esa diferencia cambia la tecnología que elegimos?"
  - q: "En este proyecto, ¿en qué momento se genera el HTML de la página de un servicio: cuando el visitante entra o antes? ¿Qué ventaja tiene eso?"
  - q: "¿Cuál es la única parte del sistema que necesita un backend de verdad, y por qué no puede ser solo HTML?"
    hint: "Piensa en qué cosas no se le pueden confiar al navegador del visitante."
  - q: "Este proyecto no tiene base de datos. ¿Dónde quedan entonces las solicitudes de cotización? ¿En qué caso agregarías una base de datos?"
---

## La primera pregunta de todo proyecto: ¿qué estamos construyendo?

Antes de elegir una sola herramienta, un ingeniero se pregunta **qué tipo de producto es** y **cómo se va a usar**. Esto no es un trámite: es la decisión que más condiciona todo lo demás.

Este proyecto es un **sitio de contenido y captación** (*lead generation*). Su ciclo de vida es:

```
 Google / WhatsApp / referido
            │
            ▼
   El visitante llega a una página (servicio, sector, inicio)
            │  lee, ve proyectos, se convence
            ▼
   Pide una cotización (formulario o WhatsApp)
            │
            ▼
   La empresa recibe un correo con la solicitud ──► la llama/escribe
```

Compáralo con una **aplicación** (un banco en línea, un panel administrativo, una red social): ahí el usuario inicia sesión, cada pantalla muestra *sus* datos y cada clic cambia algo en el servidor.

| | Sitio de contenido (este proyecto) | Aplicación |
|---|---|---|
| ¿El contenido cambia por usuario? | No: todos ven la misma página de "Drywall" | Sí: cada quien ve sus datos |
| ¿Con qué frecuencia cambia el contenido? | Cuando la empresa edita un texto | En cada interacción |
| ¿Qué importa más? | Velocidad de carga y SEO | Interactividad y estado |
| ¿Hay inicio de sesión? | No | Normalmente sí |

**Por qué importa:** si el contenido es igual para todos y cambia poco, podemos **generar las páginas una sola vez, antes de que llegue nadie**, y servirlas como archivos. Esa idea se llama *Static Site Generation* (SSG) y es la base de este proyecto.

## Las piezas de un sistema web y cómo se ven aquí

En cualquier proyecto web profesional vas a escuchar estos términos. Así se aplican a este caso:

### Frontend
**Qué es:** todo lo que corre en el navegador del visitante: HTML (estructura), CSS (apariencia) y JavaScript (comportamiento).
**Aquí:** las páginas del sitio, las animaciones de scroll y el formulario de cotización (su parte visual y la validación de ayuda).

### Backend
**Qué es:** código que corre en un servidor que tú controlas, no en el navegador. Se usa para lo que **no se le puede confiar** al visitante: validar de verdad, guardar secretos (como la llave del servicio de correo) y hablar con otros servicios.
**Aquí:** una sola función, `/api/cotizar`, que recibirá el formulario. **Estado: todavía no implementada** (Fase 5).

### API
**Qué es:** el "contrato" con el que dos programas se hablan. En la web, normalmente es una URL que recibe una **petición HTTP** y devuelve una **respuesta**.
**Aquí:** el formulario enviará una petición `POST /api/cotizar` con los datos, y el backend responderá "recibido" o "error". Además usaremos APIs de terceros: Cloudflare Turnstile (antispam) y Resend (envío de correo). **Estado: pendiente.**

### Base de datos
**Qué es:** un sistema para guardar información de forma persistente y consultarla (tablas, filas, relaciones).
**Aquí: no hay base de datos, y es una decisión deliberada** (está en tu prompt, sección 4, "Decisiones descartadas"). Lo explico abajo.

### El diagrama completo

```
┌──────────────────────── NAVEGADOR DEL VISITANTE (frontend) ────────────────────────┐
│   HTML ya generado  +  CSS  +  JS pequeño (animaciones, formulario)                │
└───────────┬───────────────────────────────────────────────┬────────────────────────┘
            │ GET /servicios/drywall-y-superboard/           │ POST /api/cotizar  (pendiente)
            ▼                                               ▼
┌──────────────────────────── CLOUDFLARE (hosting) ───────────────────────────────────┐
│  CDN: entrega archivos HTML/CSS/JS        │  Función (backend): valida con Zod,     │
│  ya construidos (no "piensa", solo envía) │  verifica Turnstile, envía correo       │
└───────────────────────────────────────────┴───────────────┬─────────────────────────┘
                                                            │ HTTPS (APIs externas)
                                         ┌──────────────────┴──────────────────┐
                                         ▼                                     ▼
                              Turnstile (¿es humano?)              Resend (envía el correo)
                                                                               │
                                                                               ▼
                                                                  Bandeja de la empresa
```

Observa que la flecha de la izquierda (ver una página) **no toca ningún código de servidor**. Eso es lo que hace que el sitio sea rápido, barato y difícil de atacar.

## ¿Por qué no hay base de datos?

**Qué resolvería una base de datos:** guardar las cotizaciones para consultarlas después, o permitir que la empresa edite contenido desde un panel.

**Por qué no la ponemos ahora:**
- Las cotizaciones llegan **por correo**, y el equipo comercial ya trabaja desde su correo y WhatsApp. Una base de datos sin un panel para verla no le sirve a nadie.
- El contenido se edita en archivos Markdown (lo verás en el módulo 5).
- Cada pieza que agregas es algo que hay que **asegurar, respaldar, pagar y mantener**. Una base de datos con datos personales de clientes también trae obligaciones de la Ley 1581 (seguridad, plazos de conservación, atención de reclamos).

**Qué pasaría si la agregáramos "por si acaso":** más costo, más superficie de ataque y más código, sin un beneficio concreto hoy.

**Cuándo sí la agregaríamos:** si la empresa pide un panel para ver y gestionar solicitudes, o un CMS para editar contenido sin tocar archivos. Ahí evaluaríamos, por ejemplo, Cloudflare D1 (SQL en el mismo proveedor) o Supabase (Postgres). Cuando llegue ese momento, aquí tendrás un módulo de diseño de tablas, claves y relaciones. **Hoy no existe, y no te voy a explicar una base de datos que no estamos usando como si estuviera construida.**

> **Principio de ingeniería:** *YAGNI* — "You Aren't Gonna Need It" (no lo vas a necesitar). No se construye para necesidades imaginadas. Se diseña para poder agregarlo después sin rehacer todo, que es distinto.

## Cómo se decidió el stack

Del análisis anterior salen los requisitos técnicos, y de ahí las herramientas:

| Requisito | Herramienta elegida | Alternativa descartada y por qué |
|---|---|---|
| HTML completo y rápido, mínimo JS | **Astro** | Next.js + React: pensado para aplicaciones; manda más JavaScript al navegador por defecto. |
| Estilos consistentes y livianos | **Tailwind CSS v4** | CSS a mano: funciona, pero sin un sistema es fácil que cada página use valores distintos. |
| Animaciones ligadas al scroll | **GSAP** | Motion/Framer Motion: muy buenos con React, más débiles en *scroll storytelling*. Tener dos librerías de animación duplicaría el peso. |
| Hosting barato, global, con backend mínimo | **Cloudflare Pages** | Un servidor VPS propio: hay que mantener el sistema operativo, actualizaciones y seguridad. |

El plan con esta información está en `PLAN.md`. **Ese documento es la Fase 0**: se planea antes de programar porque cambiar una decisión en el papel cuesta minutos, y en el código, días.
