# PLAN.md — Fase 0: Descubrimiento y plan

Sitio corporativo para empresa de construcción y remodelación integral (Colombia).
Concepto: **"De obra negra a obra terminada."**

> Estado: el cliente pidió ejecutar todas las fases seguidas, sin pausas de aprobación entre ellas.
> El avance se puede ver en vivo en `http://localhost:4321/progreso` mientras corre `npm run dev`.

---

## 1. Stack definitivo (versiones verificadas con `npm view` el 2026-11-05)

| Capa | Paquete | Versión |
|---|---|---|
| Runtime | Node.js (nvm) | 26.13.0 |
| Framework | astro | 7.4.x |
| Estilos | tailwindcss + @tailwindcss/vite | 4.3.x |
| Animación | gsap (ScrollTrigger, SplitText, DrawSVG, Flip) | 3.15.x |
| Smooth scroll | lenis | 1.3.x |
| SEO | @astrojs/sitemap | 3.7.x |
| Validación | zod | 4.6.x |
| Hosting/endpoint | Cloudflare Pages + Turnstile + Resend | — |

Sin cambios respecto al stack propuesto en el prompt.

**Desviaciones técnicas:**
- Astro no publica como ruta los archivos que empiezan por `_`. La página interna de componentes se sirve en `/sistema-de-diseno/` (con `noindex` y excluida del sitemap), no en `/_design`.
- El Node del sistema está roto (falta `libsimdjson.so.34` después de una actualización de Arch). Se usa Node 26 de nvm. Arreglo definitivo para el sistema: `sudo pacman -Syu`.

## 2. Sitemap final

Igual al de la sección 5 del prompt. Rutas dinámicas generadas desde Content Collections:

- `/servicios/[slug]/` — 18 servicios en 8 categorías
- `/sectores/[slug]/` — 7 sectores
- `/proyectos/[slug]/` — casos de estudio (de ejemplo y marcados `[[PENDIENTE]]` hasta tener obras reales)
- `/blog/[slug]/` — 10 artículos planeados; solo se publican los que ya tienen texto

## 3. Storyboard del inicio (guion de scroll)

| # | Sección | Qué ve el usuario al hacer scroll | Percepción que refuerza | Versión reduced-motion |
|---|---|---|---|---|
| 01 | Hero "La transformación" | Escena en obra negra que se "termina" al bajar: capas de color, retícula de plano y cotas que se dibujan. Titular revelado palabra por palabra. Dos CTA | Capacidad | Escena terminada y estática |
| 02 | Contador de confianza | Cifras que cuentan hacia arriba al entrar en pantalla | Confianza | Cifras finales sin animación |
| 03 | Capa por capa (pinned) | Muro en corte: estructura → drywall → estuco → pintura → acabado; cada capa enlaza a su servicio | Solución integral | Las 5 capas apiladas en lista |
| 04 | Servicios | Tarjetas por categoría con filtro animado (Flip) | Solución integral | Filtro sin animación |
| 05 | Sectores | Pestañas accesibles con beneficios por sector | Capacidad | Igual, sin transición |
| 06 | Proyectos | Scroll horizontal fijado con comparadores antes/después (teclado: flechas) | Capacidad + Confianza | Lista vertical |
| 07 | Clientes | Marquesina de logos — **oculta** hasta tener autorizaciones escritas | Confianza | — |
| 08 | Proceso | Línea de tiempo que se dibuja (7 pasos) | Confianza | Línea completa |
| 08b | Diferenciales | "Un solo proveedor en lugar de diez" | Solución integral | — |
| 09 | Seguridad y respaldo | SG-SST, alturas, pólizas, ARL (marcadores) | Confianza | — |
| 10 | Testimonios | **Oculta** hasta tener testimonios reales | Confianza | — |
| 11 | CTA final | "Cuéntanos qué espacio quieres transformar" | Conversión | — |

Hero (plan B mientras no exista un timelapse real): la escena se construye con SVG y capas CSS animadas con GSAP en lugar de una secuencia de fotos. La estructura de `HeroTransformation` admite cambiar después a `<canvas>` con secuencia de imágenes sin tocar la página.

## 4. Cronograma estimado (equipo de 1 desarrollador + cliente)

| Fase | Duración | Bloqueado por |
|---|---|---|
| 0 Plan | 1 día | — |
| 1 Cimientos | 2 días | Dominio y cuentas (para el preview) |
| 2 Sistema de diseño | 3–4 días | Logo y colores |
| 3 Inicio | 5–7 días | Fotos/videos reales, timelapse |
| 4 Páginas internas | 5 días | Textos y cifras validados |
| 5 Cotizador y legal | 3–4 días | Llaves de Turnstile/Resend, revisión jurídica |
| 6 Auditoría | 2–3 días | — |
| 7 Lanzamiento | 1–2 días + espera de Google | Accesos a DNS, Search Console, GBP |

## 5. Riesgos

1. **No hay material audiovisual real**: el hero y los antes/después dependen de él. Mitigación: placeholders generados, con la estructura lista para reemplazarlos.
2. **Logos de clientes sin autorización**: la sección queda oculta por defecto (bandera en `site.ts`).
3. **Textos legales**: son borradores y llevan la marca `[[BORRADOR — PENDIENTE REVISIÓN JURÍDICA]]`.
4. **Rendimiento del hero animado en móviles de gama baja**: se usa `gsap.matchMedia`, solo transform/opacity, y la escena se simplifica en móvil.
5. **Cotizador sin backend en el entorno local**: el endpoint corre en el adaptador de Cloudflare. Sin `RESEND_API_KEY` registra la solicitud en el log (modo desarrollo) en lugar de enviarla.

## 6. Preguntas abiertas / datos faltantes

La lista completa está en `CONTENT_TODO.md`. Las que bloquean el lanzamiento:

1. Nombre comercial, razón social, NIT, dirección, teléfono/WhatsApp, correos, dominio.
2. Cifras reales verificables (m², proyectos, años, ciudades).
3. ¿Se confirman hidrosanitario y fachadas como servicios?
4. ¿Se confirma el trabajo en horarios nocturnos o de baja afluencia?
5. Certificaciones y pólizas vigentes (con soportes para el kit de proveedor).
6. Logo en SVG, colores de marca, o aprobación para proponer una identidad.
7. Clientes con autorización escrita para mostrar su logo.
8. Fotos y videos reales; posibilidad de grabar un timelapse.
9. Plazo de conservación de los datos de cotización (sugerido: 24 meses).
10. Proveedor de correo transaccional (sugerido: Resend) y quién recibe los leads.
