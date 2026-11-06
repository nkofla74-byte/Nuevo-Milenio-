# CONTENT_TODO — datos y material pendientes

Todo lo que aparece en el sitio como `[[PENDIENTE: …]]`. Para ver la lista exacta en el código: `grep -rn "PENDIENTE" src/`.

## Ya recibido (2026-11-05)
- Razón social: Construcciones y Acabados Nuevo Milenio S.A.S. · NIT 901.081.765-0
- Dirección: Calle 38 B Sur No. 88F-19, Bogotá · Celular: 312 640 78 62
- Actividades CIIU 4330 y 4390

## Bloquean el lanzamiento
- [ ] **Nombre comercial** definitivo (hoy se usa "Nuevo Milenio", derivado de la razón social; confirmar).
- [ ] **WhatsApp**: ¿el celular 312 640 78 62 tiene WhatsApp? (activa el botón flotante y los CTA).
- [ ] **Correo comercial** y **correo de datos personales** (ej. datos@dominio.com.co).
- [ ] **Dominio** (`site` en `astro.config.mjs`, `security.txt`, imágenes OG).
- [ ] **Logo** en SVG y colores de marca (hoy: marca temporal; paleta A en `/sistema-de-diseno/`).
- [ ] **Textos legales revisados por abogado** (marcados `[[BORRADOR — PENDIENTE REVISIÓN JURÍDICA]]`).
- [ ] **Plazo de conservación** de datos de cotizaciones (sugerido 24 meses).
- [ ] Llaves: `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`, `QUOTE_TO_EMAIL`, `QUOTE_FROM_EMAIL`.

## Contenido del negocio
- [ ] Cifras reales y verificables: m² intervenidos, proyectos, años de experiencia, ciudades.
- [ ] Confirmar servicios: **hidrosanitario** y **fachadas** (`needsConfirmation: true`).
- [ ] Confirmar **trabajo nocturno / baja afluencia** (`site.confirmNightShifts`).
- [ ] Certificaciones vigentes con soporte: SG-SST, alturas, póliza RC, ARL.
- [ ] Documentos PDF del kit de proveedor (RUT, Cámara de Comercio, SG-SST, pólizas, certificación bancaria, brochure).
- [ ] Condiciones de **garantía** por escrito (Ley 1480).
- [ ] Política de cobro de la visita técnica.
- [ ] Historia de la empresa, equipo directivo (con autorización de uso de imagen).
- [ ] Clientes con **autorización escrita** para mostrar su logo (`site.authorizedClients`).
- [ ] Testimonios reales (`site.testimonials`) — la sección se oculta mientras esté vacía.
- [ ] Ampliar cada servicio a ≥ 600 palabras (hoy ~300–450 entre texto y bloques estructurados).
- [ ] Redes sociales.

## Material audiovisual
- [ ] Fotos reales de obras: antes, proceso y después (reemplazan `Placeholder` en proyectos).
- [ ] Casos de estudio reales (reemplazan `src/content/proyectos/ejemplo-*.md`, hoy `noindex`).
- [ ] Clips de video de 5–12 s por servicio (opcional).
- [ ] Autorizaciones de uso de imagen de trabajadores que aparezcan en fotos/videos.

### Guía de grabación del timelapse (hero "La transformación")
1. **Trípode fijo** en una esquina con vista a todo el espacio; no se mueve en toda la obra.
2. **Mismo encuadre y zoom** de principio a fin; marcar la posición del trípode en el piso.
3. **Una foto cada 30–60 minutos** de trabajo (o 3–4 al día), con intervalómetro o app de timelapse.
4. **Iluminación constante**: misma hora del día o luz artificial fija; evitar contraluces.
5. Resolución mínima 1920×1080, horizontal. Entregar los JPG originales en orden.
6. Con 90–150 fotos se arma la secuencia de scroll; el sitio ya está preparado para cambiar el hero sin rediseñar la página.

## Notas para el contador (fuera del sitio)
- Verificar si los activos superan 100.000 UVT (obligación de inscribir bases de datos en el RNBD de la SIC).
- La facturación debe ser electrónica (DIAN); el talonario de papel con autorización de 2017 (1 a 100) no cubre la factura No. 151. "Régimen Común" ya no se usa: hoy es "responsable de IVA".
