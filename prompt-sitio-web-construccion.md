# PROMPT MAESTRO — Sitio web corporativo para empresa de construcción y remodelación integral

> Cómo usarlo: pega este documento completo como primer mensaje al agente de código, o guárdalo en la raíz del repositorio como `PROMPT.md` y dile: *"Lee PROMPT.md completo y ejecuta la Fase 0."*
> Antes de pegarlo, llena el bloque **[DATOS DEL NEGOCIO]**. Lo que no tengas todavía déjalo como `[PENDIENTE]`; el agente debe usar marcadores visibles y no inventar nada.

---

## 0. TU ROL

Actúas como un equipo senior completo: arquitecto frontend, diseñador de interacción (motion designer), ingeniero de rendimiento, especialista en SEO técnico y local, ingeniero de seguridad de aplicaciones y revisor de cumplimiento normativo para Colombia. Tu trabajo debe estar al nivel de un estudio digital premiado (referencia de calidad: sitios destacados en Awwwards / FWA), pero con la solidez técnica de un producto corporativo: rápido, seguro, accesible, indexable y mantenible.

Hablas y documentas en **español (Colombia)**. El código, los nombres de variables y los commits van en inglés.

---

## 1. DATOS DEL NEGOCIO [COMPLETAR ANTES DE PEGAR]

```
Nombre comercial:            [PENDIENTE]
Razón social y NIT:          [PENDIENTE]
Tipo de sociedad:            [PENDIENTE: S.A.S. / persona natural / otra]
Dirección física:            [PENDIENTE]
Ciudad base y cobertura:     [PENDIENTE: ej. Bogotá D.C. y Sabana; nacional bajo proyecto]
Teléfono / WhatsApp:         [PENDIENTE]
Correo comercial:            [PENDIENTE]
Correo para datos personales:[PENDIENTE: ej. datos@dominio.co]
Dominio:                     [PENDIENTE: ej. empresa.com.co]
Años de experiencia:         [PENDIENTE]
Cifras reales (m², proyectos, clientes): [PENDIENTE — solo cifras verificables]
Clientes con autorización escrita para mostrar su logo/nombre: [PENDIENTE]
Certificaciones / pólizas:   [PENDIENTE: SG-SST, trabajo en alturas, póliza RC, ARL, etc.]
Logo y colores de marca:     [PENDIENTE: archivos SVG/PNG; si no existe, proponer identidad]
Redes sociales:              [PENDIENTE]
Fotos y videos reales de obras (antes/después): [PENDIENTE — ubicación de los archivos]
```

---

## 2. CONTEXTO DEL NEGOCIO

Empresa colombiana de **soluciones integrales para la intervención de inmuebles**: desde la demolición hasta la entrega llave en mano. Ha ejecutado trabajos para grandes cadenas del retail colombiano.

**Catálogo de servicios** (agrúpalo en categorías; cada servicio tendrá su propia página):

| Categoría | Servicios |
|---|---|
| Obra civil y demolición | Demolición controlada, retiro de escombros, adecuaciones estructurales menores, mampostería, resanes |
| Remodelaciones y adecuaciones | Remodelaciones integrales y parciales, adecuación de locales comerciales, restaurantes y oficinas |
| Acabados | Estuco, pintura (interior, exterior, epóxica, alto tráfico), enchapes, pisos (porcelanato, vinílico, laminado, epóxico), carpintería |
| Sistemas livianos | Drywall, superboard, cielos rasos, techos en PVC, divisiones de oficina |
| Instalaciones técnicas | Electricidad (redes, iluminación, tableros), hidrosanitario [confirmar] |
| Metalmecánica | Soldadura, estructuras metálicas, fabricación a medida (rejas, soportes, estanterías) |
| Cubiertas y fachadas | Techos, impermeabilización, fachadas [confirmar] |
| Mantenimiento | Mantenimiento locativo preventivo y correctivo, contratos recurrentes |

**Sectores atendidos** (cada uno con landing propia):
Propiedad horizontal (conjuntos y edificios) · Centros comerciales · Retail y grandes superficies · Restaurantes y gastronomía · Oficinas y corporativo · Residencial · Industrial / bodegas.

**Público objetivo**:
1. Administradores de propiedad horizontal y consejos de administración.
2. Jefes de mantenimiento, infraestructura y compras de cadenas, centros comerciales y restaurantes (B2B; exigen documentación de proveedor, pólizas y SG-SST).
3. Propietarios de locales y viviendas.

**Concepto creativo central**: **"De obra negra a obra terminada."** Todo el sitio cuenta la transformación de un espacio. El scroll del usuario *es* la obra avanzando.

**Lo que el visitante debe percibir en los primeros segundos** (cada sección del sitio debe reforzar al menos una):
1. **Capacidad** — esta empresa tiene el conocimiento, el personal y el músculo para proyectos de distintas magnitudes.
2. **Confianza** — es seria, organizada, cumple normas de seguridad y responde por su trabajo.
3. **Solución integral** — *un solo proveedor en lugar de diez*: puedo contratar demolición, drywall, electricidad, pintura y mantenimiento con la misma empresa y un solo interlocutor. Este es el diferencial comercial más fuerte y debe repetirse en el copy.

**Objetivo del sitio**: convertir esas percepciones en **solicitudes de cotización / visita técnica** (formulario y WhatsApp). Objetivo secundario: posicionar en Google para búsquedas locales de servicios ("remodelación de locales comerciales Bogotá", "drywall Bogotá", "mantenimiento propiedad horizontal", etc.).

---

## 3. REGLAS DE TRABAJO (OBLIGATORIAS)

1. **Trabajas por fases** (sección 15). Al terminar cada fase: resumen de lo hecho, cómo verificarlo, y te detienes a esperar aprobación antes de seguir.
2. **Fase 0 es solo planificación**: no escribas código de producción hasta que el plan esté aprobado.
3. **No inventes información del negocio**: ni cifras, ni clientes, ni testimonios, ni reseñas, ni certificaciones, ni logos de terceros. Usa marcadores visibles tipo `[[PENDIENTE: testimonio real]]` y llévalos en un archivo `CONTENT_TODO.md`. Un testimonio o logo inventado es un riesgo legal y de reputación.
4. **No uses imágenes con derechos de terceros**. Mientras llegan las fotos reales, usa placeholders generados (gradientes, SVG, o bancos con licencia libre explícita y documentada en `CREDITS.md`).
5. Si una decisión es ambigua o costosa de revertir, **pregunta** antes de implementarla.
6. Verifica siempre la **última versión estable** de cada dependencia (`npm view <paquete> version`) en lugar de asumirla de memoria. Fija versiones en el lockfile.
7. Commits pequeños y atómicos con **Conventional Commits** (`feat:`, `fix:`, `perf:`, `a11y:`, `seo:`, `sec:`...). Una rama por fase, PR con descripción.
8. Cada componente animado debe tener **versión sin movimiento** (ver sección 7.4) y funcionar sin JavaScript en lo esencial (el contenido debe estar en el HTML).
9. **Una biblioteca por problema**: no instales dos librerías que resuelvan lo mismo (por ejemplo, GSAP y otra de animación). Toda dependencia nueva se justifica en el PR.
10. **Toda animación debe tener intención narrativa**: si un efecto no ayuda a contar la transformación, a mostrar un servicio o a llevar al usuario a cotizar, se elimina.
11. No uses emojis como íconos. Usa un único set de íconos SVG coherente (autoalojado).

---

## 4. STACK TÉCNICO

Elegido por rendimiento, SEO y costo de hosting cercano a cero. Si propones cambiar algo, justifica en el plan.

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | **Astro** (última estable) + **TypeScript estricto** | HTML estático por defecto, JS solo donde se necesita (islands), excelente para SEO y Core Web Vitals |
| Estilos | **Tailwind CSS v4** + variables CSS (design tokens) | Consistencia y CSS mínimo en producción |
| Animación | **GSAP 3** (ScrollTrigger, SplitText, DrawSVG, Flip — todos los plugins son gratuitos incluso para uso comercial) | Estándar de la industria para scroll storytelling |
| Smooth scroll | **Lenis** (sincronizado con ScrollTrigger) | Scroll suave sin secuestrar el scroll nativo; desactivable |
| Transiciones de página | **View Transitions API** (soporte nativo de Astro) | Navegación tipo app sin SPA pesada |
| Contenido | **Astro Content Collections** (Markdown/MDX + esquemas Zod) para servicios, sectores, proyectos y blog | El cliente puede editar texto sin tocar componentes; preparado para un CMS headless en el futuro |
| Medios pesados | Videos y secuencias en Cloudflare R2 (o CDN de medios equivalente) si el peso total supera lo razonable para el repositorio | El repositorio no se infla y los videos se sirven desde CDN |
| Formularios | Endpoint del lado servidor (Astro Actions/endpoint en Cloudflare) + **Zod** + **Cloudflare Turnstile** + envío de correo transaccional (Resend o similar) | Validación real en servidor y antispam sin captchas molestos |
| Hosting | **Cloudflare Pages** (alternativa: Vercel) | Plan gratuito, CDN global, HTTPS automático, cabeceras de seguridad configurables, WAF básico |
| Analítica | **Sin cookies** (Cloudflare Web Analytics, Plausible o Umami). Si el cliente exige GA4: cargar solo tras consentimiento, con Consent Mode v2 | Reduce la carga de consentimiento y protege al usuario |
| Calidad | ESLint, Prettier, `astro check`, Vitest, **Playwright** (e2e), **axe-core** (accesibilidad), **Lighthouse CI** | Calidad medible en cada PR |
| CI/CD | GitHub Actions + Dependabot/Renovate | Despliegues reproducibles y dependencias al día |

3D (Three.js) queda como **opción de Fase 2**, solo si no rompe los presupuestos de rendimiento.

**Decisiones descartadas a propósito** (no las reintroduzcas sin justificarlo):
- *Next.js + React*: es un sitio de contenido y captación, no una aplicación; Astro entrega menos JavaScript y mejores métricas con menos esfuerzo. Si en el futuro se necesita un panel administrativo, se construye aparte.
- *Base de datos desde el inicio (Supabase u otra)*: no hace falta para mostrar servicios y recibir cotizaciones por correo. Se agrega solo si el cliente necesita gestionar contenido o solicitudes desde un panel.
- *Librerías de animación adicionales (Motion/Framer Motion)*: GSAP cubre scroll y microinteracciones.

---

## 5. ARQUITECTURA DE INFORMACIÓN (SITEMAP)

```
/                               Inicio (experiencia scroll completa)
/servicios/                     Catálogo filtrable por categoría
/servicios/[slug]/              Página por servicio (≈15–20 páginas)
/sectores/                      Resumen de sectores
/sectores/[slug]/               Landing por sector (PH, centros comerciales, restaurantes...)
/proyectos/                     Portafolio con filtros (sector, servicio, ciudad)
/proyectos/[slug]/              Caso de estudio: reto → solución → antes/después → resultado
/nosotros/                      Historia, equipo, valores, certificaciones, seguridad en obra
/proceso/                       Cómo trabajamos (visita → diagnóstico → cotización → ejecución → entrega → garantía)
/proveedores/                   Kit de proveedor para clientes B2B (RUT, Cámara de Comercio, certificado SG-SST, pólizas, brochure PDF) — descargas
/blog/  y  /blog/[slug]/        Guías y artículos para SEO
/cotizar/                       Formulario multipaso de cotización / visita técnica
/contacto/                      Datos, mapa, horarios, WhatsApp
/preguntas-frecuentes/
/legal/politica-de-tratamiento-de-datos/
/legal/aviso-de-privacidad/
/legal/politica-de-cookies/
/legal/terminos-y-condiciones/
/404  y  /500                   Páginas de error con estilo de la marca
/sitemap-index.xml  /robots.txt  /.well-known/security.txt  /llms.txt
```

---

## 6. CONCEPTO VISUAL Y SISTEMA DE DISEÑO

**Personalidad**: profesional, elegante, fresca y confiable. Nada de plantilla genérica de constructora con cascos amarillos de stock.

- **Motivo gráfico**: lenguaje de **plano técnico** — retículas finas, líneas de cota, cruces de registro, numeración de secciones tipo plano (`01 / DEMOLICIÓN`). Las líneas se "dibujan" con el scroll.
- **Dirección de arte**: *Industrial luxury* — composición editorial y asimétrica, fotografía arquitectónica grande, espacio negativo generoso.
- **Paleta propuesta** (ajustar a la marca real; en la Fase 2 presenta **2–3 variantes de paleta** para escoger antes de consolidar): grises cálidos de concreto, negro carbón, blanco hueso, y **un solo acento** fuerte (naranja seguridad o amarillo obra) usado con disciplina para llamadas a la acción. Contraste mínimo WCAG AA.
- **Tipografía**: una grotesca condensada/industrial para titulares de gran tamaño + una sans muy legible para texto. Fuentes **autoalojadas** (WOFF2, `font-display: swap`, subset latino, precarga solo de la principal).
- **Tokens**: define en CSS variables colores, espaciado, radios, sombras, duraciones y curvas de animación. Documenta el sistema en `/docs/design-system.md` y en una página interna `/_design` (excluida de indexación) que muestre todos los componentes.
- **Fotografía y video**: material real de obras, con tratamiento de color consistente. Los videos son clips cortos (5–12 s), silenciados, en bucle.
- Móvil primero. Cada sección se diseña para 360 px y escala hasta 1920 px+.

---

## 7. EXPERIENCIAS DE SCROLL E INTERACCIÓN

### 7.1 Página de inicio — guion por secciones

1. **Hero "La transformación"**: al hacer scroll, un espacio en obra negra (concreto, cables, polvo) se transforma cuadro a cuadro en el espacio terminado. Técnica: secuencia de imágenes en `<canvas>` sincronizada con ScrollTrigger (`scrub`), al estilo de las páginas de producto de Apple. ~90–150 cuadros en AVIF/WebP, carga progresiva (primero 1 de cada 4 cuadros, luego el resto). Titular revelado palabra por palabra con SplitText. El primer cuadro es una imagen normal en el HTML (es el LCP; debe cargar rápido con `fetchpriority="high"`). Sobre la escena: titular contundente (propuesta: *"Transformamos espacios. Construimos soluciones."*), una línea que resuma la oferta integral y **dos CTA**: "Solicitar cotización" y "Ver proyectos".
   - **Requisito de producción**: esta secuencia necesita material real grabado con **cámara fija (timelapse) en una obra**, desde el mismo ángulo, de inicio a fin. Incluye en `CONTENT_TODO.md` una guía corta de grabación para el cliente (trípode, encuadre fijo, una foto cada X minutos/horas, iluminación constante).
   - **Plan B** mientras no exista ese material: hero con video cinematográfico en bucle de obras y acabados (silenciado, con póster), que luego se reemplaza por la secuencia sin cambiar la estructura de la página.
2. **Contador de confianza**: cifras reales que cuentan hacia arriba al entrar en pantalla (m² intervenidos, proyectos, años, ciudades).
3. **"Capa por capa"** (sección fija/pinned): un muro en corte se construye mientras el usuario baja: estructura → drywall → estuco → pintura → acabado final. Cada capa resalta el servicio correspondiente con un enlace a su página. Es la forma visual de presentar el catálogo.
4. **Catálogo de servicios**: tarjetas por categoría; en escritorio, al pasar el cursor se reproduce un clip corto del servicio; en móvil, se reproduce al quedar centrada en pantalla. Filtro animado con GSAP Flip.
5. **Sectores**: pestañas o carrusel horizontal (Propiedad horizontal, Centros comerciales, Restaurantes, Retail, Oficinas, Residencial) con mensaje y beneficios específicos para cada uno.
6. **Proyectos destacados**: galería con scroll horizontal fijado; cada proyecto con **comparador antes/después arrastrable** (accesible por teclado: flechas mueven el divisor).
7. **Clientes**: marquesina de logos en escala de grises — **solo con autorización escrita** de cada marca.
8. **Proceso**: línea de tiempo cuya línea se dibuja con el scroll (DrawSVG): Visita técnica → Diagnóstico → Planeación y cotización → Ejecución → Supervisión y control de calidad → Entrega → Garantía.
8b. **Diferenciales**: por qué elegirnos (un solo proveedor, cumplimiento de cronogramas, trabajo en horarios nocturnos o de baja afluencia para comercios — confirmar con la empresa, personal certificado, garantía). Solo afirmaciones que la empresa pueda sostener.
9. **Seguridad y respaldo**: certificaciones, SG-SST, trabajo en alturas, pólizas, ARL. Clave para clientes corporativos.
10. **Testimonios** (reales, idealmente en video corto) — mientras no existan, la sección queda oculta, no se rellena con texto falso.
11. **CTA final**: "Cuéntanos qué espacio quieres transformar" → `/cotizar` y WhatsApp.

### 7.2 Microinteracciones (con moderación)
- Botones magnéticos y cursor personalizado **solo en escritorio con puntero fino** (`@media (pointer: fine)`).
- Transiciones entre páginas con View Transitions (la imagen de la tarjeta se expande hacia el encabezado del caso de estudio).
- Encabezado que se oculta al bajar y aparece al subir; barra de progreso de lectura en blog.
- Botón flotante de WhatsApp con mensaje prellenado según la página ("Hola, quiero cotizar drywall").
- Precarga de páginas al pasar el cursor/visibilidad (prefetch de Astro).
- **Indicador de sección** en el inicio (índice lateral discreto tipo plano `01 · 02 · 03…`) que muestra dónde está el usuario y permite saltar entre secciones.
- Revelado de fotografías con **máscaras** (`clip-path`) y escalado suave al entrar en pantalla; parallax solo moderado y nunca en móvil.

### 7.2b Fichas de proyecto (`/proyectos/[slug]/`)
Cada caso de estudio sigue la misma estructura: tipo de inmueble y sector → problema inicial → solución → servicios ejecutados → **fotos del estado inicial, del proceso y del resultado** → comparador antes/después → duración y área (si se pueden divulgar) → proyectos relacionados → CTA. La ubicación se muestra solo de forma general (ciudad/zona) salvo autorización del cliente; algunos clientes corporativos exigen confidencialidad.

### 7.3 Cotizador inteligente (`/cotizar`)
Formulario multipaso con barra de progreso:
1. Tipo de inmueble / sector.
2. Servicios requeridos (selección múltiple con íconos).
3. Área aproximada (m²), ciudad/barrio, urgencia.
4. Descripción breve del proyecto (texto libre con límite) + datos de contacto: nombre, empresa/copropiedad (opcional), cargo (opcional), teléfono, correo y canal preferido (correo, llamada, WhatsApp).
5. Autorización de tratamiento de datos (casilla **no** marcada por defecto, con enlace a la política) + Turnstile.
Al enviar: correo a la empresa con el resumen, correo de confirmación al usuario, pantalla de éxito con opción de continuar por WhatsApp. Guarda progreso en `sessionStorage` (sin datos sensibles). Carga de fotos del espacio: **Fase 2**, con las reglas de la sección 10.

### 7.4 Reglas técnicas de animación (no negociables)
- Animar solo `transform` y `opacity` (y `clip-path` con cuidado). Nunca animar `width/height/top/left`.
- Respetar `prefers-reduced-motion: reduce`: sin scroll suave, sin secuencias scrub (se muestra la imagen final), sin parallax; las transiciones pasan a fundidos cortos o desaparecen.
- Usar `gsap.matchMedia()` para tener versiones distintas en móvil y escritorio, y `gsap.context()` / limpieza al navegar para no dejar ScrollTriggers huérfanos (fugas de memoria con View Transitions).
- Cargar GSAP y la lógica de cada sección de forma diferida (`client:visible`) — nada de animación bloquea el primer render.
- Videos: H.264 + WebM/AV1, ≤ 2–3 MB por clip, `muted playsinline loop`, `preload="none"` + `poster`, se pausan fuera de pantalla (IntersectionObserver) y con `prefers-reduced-motion`. Respeta el ahorro de datos (`navigator.connection.saveData`) mostrando solo el póster.
- El contenido (textos, enlaces, encabezados) existe en el HTML aunque la animación falle; el canvas es decorativo (`aria-hidden`), con texto real encima.
- Probar en un Android de gama media y con CPU 4x más lenta en DevTools; la animación debe mantenerse cerca de 60 fps.

---

## 8. RENDIMIENTO — PRESUPUESTOS

Medidos en el percentil 75 de usuarios reales (y en laboratorio con Lighthouse móvil):

| Métrica | Objetivo |
|---|---|
| LCP | ≤ 2,5 s (meta interna: ≤ 2,0 s) |
| INP | ≤ 200 ms |
| CLS | ≤ 0,1 (meta interna: ≤ 0,05) |
| Lighthouse (móvil) | ≥ 95 en Rendimiento, Accesibilidad, Buenas prácticas y SEO |
| JS inicial (gzip) en inicio | ≤ 120 KB |
| Peso de la primera vista | ≤ 1 MB (las secuencias/videos se cargan después) |

Prácticas: imágenes con `<Image>`/`<Picture>` de Astro (AVIF/WebP, `srcset`, `sizes`, dimensiones explícitas, `loading="lazy"` excepto LCP), fuentes autoalojadas, CSS crítico en línea, sin librerías innecesarias, caché inmutable para assets con hash. **Lighthouse CI falla el PR** si se rompen los presupuestos.

---

## 9. ACCESIBILIDAD — WCAG 2.2 nivel AA

HTML semántico (landmarks, un solo `h1` por página, jerarquía correcta), navegación completa por teclado con foco visible, enlace "Saltar al contenido", contraste AA, textos alternativos descriptivos (los decorativos con `alt=""`), formularios con `label`, mensajes de error asociados (`aria-describedby`) y anunciados (`aria-live`), objetivos táctiles ≥ 24×24 px, subtítulos en videos con voz, `lang="es-CO"`, sin contenido que parpadee más de 3 veces por segundo. Pruebas automáticas con axe en Playwright + revisión manual con lector de pantalla (NVDA/VoiceOver) en las páginas clave.

---

## 10. SEGURIDAD — basada en OWASP Top 10:2025

Aunque el sitio es mayormente estático, el formulario, las dependencias y el despliegue son superficie de ataque. Cubre explícitamente:

**Cabeceras HTTP** (vía `_headers` de Cloudflare o middleware), objetivo **A+ en Mozilla Observatory y securityheaders.com**:
- `Content-Security-Policy` estricta (sin `unsafe-inline` en scripts; usar hashes/nonces; `frame-ancestors 'none'`; listar explícitamente Turnstile y analítica). Empezar con `Content-Security-Policy-Report-Only` y luego aplicar.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictiva (cámara, micrófono, geolocalización deshabilitados), `Cross-Origin-Opener-Policy: same-origin`.
- Redirección forzada a HTTPS y a un único host canónico (con o sin `www`).

**Formulario y endpoints**:
- Validación con Zod **en el servidor** (el cliente solo ayuda), límites de longitud, normalización y escape de todo lo que vaya en el correo (evitar inyección de cabeceras de correo y HTML).
- Turnstile verificado en servidor + campo honeypot + **rate limiting** por IP (reglas de Cloudflare o contador en KV).
- Respuestas de error genéricas al usuario; detalle solo en logs del servidor, sin datos personales en texto plano (A10:2025 – manejo de condiciones excepcionales).
- Solo método POST, verificación de `Origin`, CORS cerrado.
- Carga de archivos (Fase 2): solo imágenes, ≤ 5 MB, validar tipo por *magic bytes* (no por extensión), renombrar con UUID, reprocesar/quitar metadatos EXIF (contienen GPS), almacenamiento privado (R2) con URLs firmadas y expiración.

**Cadena de suministro (A03:2025)**: lockfile versionado, `npm ci` en CI, `npm audit`/OSV-Scanner en cada PR, Dependabot/Renovate, mínimo de dependencias, nada cargado desde CDNs de terceros sin necesidad (si se usa, con SRI). Revisar el `postinstall` de paquetes nuevos.

**Secretos**: solo en variables de entorno del proveedor; `.env` en `.gitignore`; `.env.example` sin valores; escaneo de secretos (gitleaks) en CI; nunca exponer llaves al cliente.

**Otros**: `/.well-known/security.txt`, página 404/500 sin información técnica, protección de ramas en GitHub, 2FA en todas las cuentas (dominio, hosting, GitHub, correo), WAF y protección DDoS de Cloudflare activos, registros de acceso y alertas por errores del endpoint.

---

## 11. SEO TÉCNICO, LOCAL E INDEXACIÓN

**Técnico (en cada página)**:
- `<title>` único (≤ 60 caracteres) y `meta description` única (≤ 155), URL limpia en español con guiones, `link rel="canonical"`, `lang="es-CO"`, Open Graph y Twitter Cards con imagen 1200×630 por página.
- Un `h1` con la palabra clave principal; encabezados jerárquicos; enlazado interno entre servicio ↔ sector ↔ proyecto; migas de pan visibles.
- `sitemap` automático (`@astrojs/sitemap`), `robots.txt` que permita rastreo y apunte al sitemap; páginas internas (`/_design`, confirmación de formulario) con `noindex`.
- Contenido renderizado en HTML (nunca solo en canvas o JS). Imágenes con nombre de archivo y `alt` descriptivos.
- Redirecciones 301 si cambian URLs; sin cadenas de redirección; 404 real (código 404).

**Datos estructurados (JSON-LD)**, validados con la Prueba de resultados enriquecidos de Google y validator.schema.org:
- `Organization` + `GeneralContractor` (subtipo de `LocalBusiness`) con NAP (nombre, dirección, teléfono) idéntico al de Google Business Profile, `areaServed`, `openingHours`, `sameAs` (redes), `logo`.
- `Service` en cada página de servicio (con `provider` y `areaServed`).
- `BreadcrumbList` en todas las páginas internas; `Article` en el blog; `FAQPage` en preguntas frecuentes (sirve para semántica aunque Google ya no muestre siempre el resultado enriquecido).
- **Nunca** marcar reseñas o calificaciones que no existan.

**SEO local y de contenido**:
- Investigación de palabras clave por servicio × ciudad (ej. "drywall en Bogotá", "remodelación de restaurantes Bogotá", "mantenimiento locativo propiedad horizontal"). Entregar la tabla en `/docs/seo-keywords.md`.
- Páginas de servicio con contenido útil y original (≥ 600 palabras): qué incluye, proceso, materiales, tiempos típicos, preguntas frecuentes, proyectos relacionados, CTA.
- Plan editorial inicial de 8–10 artículos (ej. "¿Cuánto cuesta remodelar un local comercial en Bogotá?", "Drywall vs. mampostería", "Cómo planear el mantenimiento anual de un conjunto residencial").
- `llms.txt` opcional con resumen del negocio para buscadores con IA.

**Expectativa realista**: el sitio quedará técnicamente listo para indexarse, pero nadie puede garantizar indexación inmediata ni primeras posiciones; Google rastrea y evalúa en sus propios tiempos. Comunícalo así en la documentación para el cliente.

**Checklist de indexación al lanzar** (documentar en `/docs/launch-checklist.md` y ejecutar con el cliente):
1. Dominio propio con HTTPS y versión canónica única.
2. Verificar la propiedad de dominio en **Google Search Console** (registro DNS) y en **Bing Webmaster Tools** (puede importarse desde Search Console).
3. Enviar el sitemap en ambos; usar "Inspección de URL → Solicitar indexación" para inicio, servicios principales y contacto.
4. Activar **IndexNow** (Bing/Yandex) para notificar cambios automáticamente.
5. Crear/optimizar **Google Business Profile** (categoría principal: contratista general/empresa de remodelación), con fotos reales, horario, área de servicio y enlace al sitio. Es el factor más rápido para aparecer en búsquedas locales y en Maps.
6. Registrar el negocio en directorios colombianos relevantes con el mismo NAP.
7. Configurar la analítica y revisar a la semana errores de cobertura y Core Web Vitals en Search Console.

---

## 12. CUMPLIMIENTO LEGAL — COLOMBIA

> El agente redacta **borradores** y la implementación técnica. Finalidades, plazos y datos empresariales los confirma la empresa, y los textos finales los revisa un abogado antes de publicar. Nunca publiques un documento legal genérico como si estuviera validado: los borradores llevan la marca `[[BORRADOR — PENDIENTE REVISIÓN JURÍDICA]]` hasta su aprobación.

1. **Protección de datos personales (Ley Estatutaria 1581 de 2012 y Decreto 1377 de 2013, compilado en el Decreto 1074 de 2015)**:
   - Página de **Política de Tratamiento de Datos Personales** con: identificación completa del responsable (razón social, NIT, dirección, correo, teléfono), finalidades concretas, derechos del titular (conocer, actualizar, rectificar, suprimir, revocar), procedimiento y plazos para consultas y reclamos, canal de atención, fecha de vigencia.
   - **Aviso de privacidad** visible en el formulario.
   - **Autorización previa, expresa e informada**: casilla obligatoria, no premarcada, con enlace a la política. Guardar prueba de la autorización (fecha/hora, versión de la política aceptada, IP truncada) — el responsable debe poder demostrarla.
   - **Minimización**: pedir solo los datos necesarios para cotizar. No pedir cédula ni datos sensibles.
   - **Plazo de conservación** de los datos de cotizaciones definido por la empresa (ej. 24 meses) y reflejado en la política; borrar o anonimizar al vencer.
   - **Derecho a la imagen**: trabajadores o personas que aparezcan en fotos y videos de obra deben haber firmado autorización de uso de imagen; sin ella, no se publican o se difuminan rostros.
   - Si se usan proveedores fuera de Colombia (correo, hosting), mencionarlo en la política (transferencia/transmisión internacional).
   - **RNBD**: la inscripción ante la SIC solo es obligatoria para sociedades con activos totales superiores a 100.000 UVT — dejar la nota para que el cliente lo verifique con su contador.
2. **Cookies**: banner de consentimiento con opciones granulares (necesarias / analítica / marketing), botón "Rechazar" igual de visible que "Aceptar", nada no esencial se carga antes del consentimiento, consentimiento registrado y modificable desde el pie de página. Página de **Política de Cookies** con la lista real de cookies. Con analítica sin cookies, el banner puede reducirse al mínimo.
3. **Estatuto del Consumidor (Ley 1480 de 2011)**: información clara, veraz y suficiente; nada de publicidad engañosa (no prometer "el más barato", "garantía de por vida" ni plazos que no se cumplan). Si se muestran precios, en pesos colombianos e indicando si son "desde" o de referencia. Condiciones de garantía explicadas.
4. **Comercio electrónico y mensajes de datos (Ley 527 de 1999)**: los formularios y correos son mensajes de datos válidos; incluir **Términos y condiciones de uso** del sitio.
5. **Contacto comercial (Ley 2300 de 2023, "Dejen de fregar")**: el seguimiento comercial por WhatsApp, SMS, correo o llamadas solo por los canales autorizados por el usuario y en los horarios permitidos (lunes a viernes 7:00 a. m.–7:00 p. m., sábados 8:00 a. m.–3:00 p. m., nunca domingos ni festivos). Documentarlo en `/docs/operacion-leads.md` para el equipo comercial y reflejarlo en el formulario ("canal preferido").
6. **Propiedad intelectual (Ley 23 de 1982, Decisión Andina 351 y 486)**: fotos, videos, fuentes e íconos con licencia o propios; los **logos y nombres de clientes** solo con autorización escrita (guardar evidencia). Pie de página con © de la empresa.
7. **Accesibilidad**: cumplir WCAG 2.2 AA (sección 9) como buena práctica alineada con la Ley 1618 de 2013.
8. Pie de página con razón social, NIT, dirección, enlaces a todos los documentos legales y al canal de atención de datos personales.

---

## 13. CALIDAD DE CÓDIGO

- TypeScript `strict`, sin `any` implícito. ESLint + Prettier + `astro check` sin errores.
- Estructura clara: `src/components/{ui,sections,motion}`, `src/layouts`, `src/content`, `src/lib`, `src/styles`, `src/pages`.
- Componentes pequeños, reutilizables y documentados; la lógica de animación separada de la presentación (`src/lib/motion/`).
- Pruebas: Vitest para utilidades y validaciones del formulario; Playwright para flujos (navegación, cotizador completo, banner de cookies, 404) en Chromium, Firefox y WebKit, móvil y escritorio; axe en cada página clave; pruebas visuales de regresión de las secciones principales.
- CI en cada PR: instalar → lint → typecheck → tests → build → Lighthouse CI → auditoría de dependencias → escaneo de secretos.
- `README.md` con instalación, scripts, variables de entorno, despliegue y cómo editar contenido. `CHANGELOG.md`. Decisiones de arquitectura en `/docs/adr/`.

---

## 14. ENTREGABLES

1. Repositorio completo con el sitio funcionando y desplegado en un entorno de prueba (URL de preview).
2. `PLAN.md` (Fase 0), `CONTENT_TODO.md`, `CREDITS.md`.
3. `/docs/`: sistema de diseño, palabras clave SEO, checklist de lanzamiento, operación de leads, ADRs.
4. Borradores de documentos legales para revisión del abogado.
5. Informe final: Lighthouse (móvil y escritorio), Observatory/securityheaders, resultados de axe, cobertura de pruebas, y lista de pendientes.

---

## 15. FASES DE TRABAJO

| Fase | Contenido | Resultado para aprobar |
|---|---|---|
| **0 — Descubrimiento y plan** | Leer todo este documento; listar preguntas abiertas y datos faltantes; proponer sitemap final, guion de scroll del inicio (storyboard en texto sección por sección), stack definitivo, cronograma y riesgos | `PLAN.md` + lista de preguntas. **No escribir código.** |
| **1 — Cimientos** | Proyecto Astro + TS + Tailwind, tokens de diseño, layout base, SEO base (meta, canonical, sitemap, robots, JSON-LD de organización), cabeceras de seguridad, CI completo, despliegue de preview | Sitio vacío desplegado, CI en verde, A+ en cabeceras |
| **2 — Sistema de diseño y componentes** | Tipografía, botones, tarjetas, navegación, pie, comparador antes/después, componentes de video, página `/_design` | Página de componentes revisable |
| **3 — Inicio con experiencias de scroll** | Hero de transformación, "capa por capa", servicios, sectores, proyectos, proceso, CTA; versión reduced-motion | Inicio completo cumpliendo presupuestos de rendimiento |
| **4 — Páginas internas y contenido** | Plantillas y colecciones de servicios, sectores, proyectos, blog, nosotros, proceso, proveedores, FAQ, contacto | Todas las páginas con contenido real o marcadores |
| **5 — Cotizador, legal y consentimiento** | Formulario multipaso con backend seguro, correos, Turnstile, rate limit; banner de cookies; páginas legales | Flujo de cotización probado de punta a punta |
| **6 — Auditoría y endurecimiento** | Rendimiento, accesibilidad, seguridad, SEO, pruebas cross-browser y en dispositivos reales; corrección de hallazgos | Informe final con métricas |
| **7 — Lanzamiento** | Dominio, DNS, HTTPS, Search Console, Bing, IndexNow, Google Business Profile, monitoreo | Sitio en producción e indexación solicitada |

---

## 16. DEFINICIÓN DE "TERMINADO"

Una fase está terminada solo si: el build pasa sin advertencias; CI en verde; Lighthouse móvil ≥ 95 en las cuatro categorías en las páginas tocadas; 0 errores de axe; funciona con teclado y con `prefers-reduced-motion`; funciona sin JavaScript en lo esencial (contenido y enlaces); no hay datos inventados; y la documentación está actualizada.

---

## EMPIEZA AHORA

Ejecuta la **Fase 0**: devuélveme `PLAN.md` y la lista de preguntas/datos faltantes. No escribas código hasta que yo apruebe el plan.
