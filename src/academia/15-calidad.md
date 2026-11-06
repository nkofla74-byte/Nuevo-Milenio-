---
order: 15
title: "Calidad: pruebas y CI"
summary: La pirámide de pruebas del proyecto (tipos, unitarias, e2e, accesibilidad, rendimiento), cómo axe encontró un problema en el sistema de diseño que nadie había visto y cómo el CI convierte todo en una barrera automática.
status: verificado
phase: Fase 6 — Auditoría
files:
  - tests/unit/quote.test.ts
  - tests/e2e/site.spec.ts
  - playwright.config.ts
  - vitest.config.ts
  - scripts/lighthouse.mjs
  - eslint.config.js
  - .github/workflows/ci.yml
  - docs/informe-auditoria.md
quiz:
  - q: "¿Qué diferencia hay entre una prueba unitaria y una e2e? Da un ejemplo de cada una de este proyecto."
  - q: "axe encontró 70+ problemas de contraste. ¿Por qué la solución fue cambiar un token y no cada página?"
  - q: "La primera vez fallaron 6 pruebas e2e. Una era culpa de la prueba y 5 eran problemas reales. ¿Cómo distingues un caso del otro?"
  - q: "Describe qué pasa, paso a paso, cuando alguien abre un Pull Request en este repositorio."
---

## La pirámide de pruebas del proyecto

```
                    ▲  más lentas, más realistas
            ┌───────────────┐
            │  Lighthouse   │  5 páginas · rendimiento, a11y, SEO   (scripts/lighthouse.mjs)
          ┌─┴───────────────┴─┐
          │ E2E + axe (30)    │  navegador real: flujos y accesibilidad  (Playwright)
        ┌─┴───────────────────┴─┐
        │ Unitarias (16)        │  funciones puras: esquema, escape, límites  (Vitest, 287 ms)
      ┌─┴───────────────────────┴─┐
      │ Tipos + lint + formato    │  sin ejecutar nada: astro check, ESLint, Prettier
      └───────────────────────────┘
                    ▼  más rápidas, más baratas
```

**Por qué una pirámide:** las pruebas de abajo son rápidas y precisas ("`truncateIp` falla con IPv6"); las de arriba son lentas, pero prueban lo que vive el usuario. Necesitas muchas de abajo y algunas de arriba.

## Unitarias: probar la lógica aislada

```ts
it('strips CR/LF from single-line fields (header injection)', () => {
  const r = schema.parse({ ...valid, name: 'Ana\r\nBcc: victima@x.com' });
  expect(r.name).not.toMatch(/[\r\n]/);
});
```

Cada ataque que hice a mano con `curl` (módulo 12) se convirtió en una prueba. **Por qué:** una prueba manual protege hoy; una automática protege **para siempre**. Si alguien modifica el esquema mañana y rompe la protección, la prueba falla antes de publicar.

**Inyección de dependencias para probar lo difícil:**
```ts
export async function verifyTurnstile(token, secret, ip, fetchImpl: typeof fetch = fetch)
// en la prueba:
const broken = async () => { throw new Error('network'); };
expect(await verifyTurnstile('t', 's', null, broken)).toBe(false);   // falla cerrado ✔
```
La función recibe `fetch` como parámetro (con valor por defecto). En la prueba le pasamos un `fetch` falso que simula una caída de red, sin depender de internet.

## E2E: un usuario real en un navegador

```ts
await page.getByText('Oficinas y corporativo', { exact: true }).click();
await page.getByRole('button', { name: 'Siguiente' }).click();
await expect(page.getByRole('checkbox', { name: 'Drywall y superboard' })).toBeChecked();
```

Playwright busca los elementos **como los encuentra una persona o un lector de pantalla**: por rol y nombre accesible, no por clases CSS. Efecto secundario valioso: si un botón pierde su nombre accesible, la prueba falla.

## La historia real: 6 fallos en la primera ejecución

**1 fallo de la prueba:** `getByLabel('Correo')` coincidía con dos elementos (el campo de correo y la opción "Correo electrónico"). El sitio estaba bien; la prueba era ambigua. Lo corregí con `getByRole('textbox', { name: 'Correo' })`.

**5 fallos reales de accesibilidad (axe):** más de 70 elementos con contraste insuficiente. En lugar de corregirlos uno por uno, agrupé los hallazgos por **par de colores**:

```
#8c867e sobre #f5f1ea  3,2:1  (necesita 4,5)  ← token concrete-500 usado como texto
#c94a0e sobre #e8e3dc  3,68:1                ← token accent-strong
#f2611d sobre #f5f1ea  2,86:1                ← accent (naranja) usado como texto
```

Eran **3 decisiones del sistema de diseño**, no 70 errores. Calculé con la fórmula de WCAG qué tono de `accent-strong` cumplía en **todos** los fondos claros (`#a33d0b`: 5,8:1 sobre hueso) y cambié una línea en `global.css`. Las 70 apariciones quedaron corregidas a la vez.

> **Cómo distinguir:** lee el mensaje. Si el error describe algo que un usuario sufriría ("contraste 3,2:1"), es real. Si describe una ambigüedad de la herramienta ("strict mode violation: resolved to 2 elements"), probablemente es la prueba. Ante la duda, reproduce el caso a mano.

> **Lección de diseño:** si un problema aparece en muchos lugares, la causa casi nunca está en esos lugares, sino en lo que comparten.

## Rendimiento como prueba: presupuestos

`scripts/lighthouse.mjs` corre Lighthouse en móvil sobre 5 páginas y **sale con código 1** (falla el CI) si alguna categoría baja de 95, o si LCP > 2,5 s, CLS > 0,1 o TBT > 200 ms. Resultados medidos: inicio 97/100/100/100; servicio 99/100/100/100; cotizador 98/100/100/100.

**Por qué un presupuesto y no "revisarlo de vez en cuando":** el rendimiento se degrada de a poquitos (una librería, una imagen grande…). Un umbral automático detiene la degradación en el PR que la causa.

## El CI: todo junto, en cada Pull Request

```
PR abierto → GitHub Actions (.github/workflows/ci.yml)
  1. npm ci                      instala EXACTAMENTE el lockfile
  2. npm audit --audit-level=high
  3. gitleaks                    ¿hay llaves en el historial?
  4. lint · format · check       estilo y tipos
  5. vitest                      16 unitarias
  6. build                       + verifica que academia/progreso NO estén en dist/
  7. playwright                  Chromium, Firefox, WebKit; escritorio y móvil; axe
  8. astro preview + lighthouse  presupuestos sobre el build real
  ✔ todo verde → se puede fusionar      ✘ algo falla → no se fusiona
```

**Qué no está verificado todavía (honestamente):** este flujo de CI está **escrito pero aún no se ha ejecutado** en GitHub, porque el repositorio todavía no está publicado ahí. Cada paso sí lo ejecuté localmente; Firefox y WebKit, no.
