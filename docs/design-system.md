# Sistema de diseño

Referencia visual en vivo: `/sistema-de-diseno/` (noindex). Tokens en `src/styles/global.css` (`@theme`).

## Color (paleta A, activa)
| Token | Valor | Uso |
|---|---|---|
| `carbon` | #16151a | fondos oscuros, texto principal |
| `concrete-900…100` | #3a3733 → #e8e3dc | grises cálidos de concreto |
| `bone` | #f5f1ea | fondo claro |
| `accent` | #f2611d | **solo** CTA y detalles sobre fondo oscuro (5,6:1 sobre carbon) |
| `accent-strong` | #a33d0b | acento como **texto** sobre fondos claros (≥4,6:1) |

Reglas de contraste verificadas con axe: `concrete-500` no se usa como texto sobre fondos claros (3,2:1); usar `concrete-700` (6,2:1).
Variantes B (grafito + amarillo obra) y C (arena + terracota) disponibles para elegir en `/sistema-de-diseno/`.

## Tipografía
- Titulares: Barlow Condensed 500/600/700, mayúsculas, `line-height .9–.95`.
- Texto: Inter variable 400–700, 17px base, `line-height 1.6`.

## Motivo gráfico
Retícula de plano (`.blueprint-grid`, `.blueprint-grid-dark`), etiquetas `01 —— SECCIÓN`, cotas que se dibujan (DrawSVG).

## Movimiento
Duraciones `--duration-fast/base/slow` (160/320/700 ms); curva principal `expo.out`. Solo `transform`, `opacity`, `clip-path`. Todo respeta `prefers-reduced-motion`.

## Componentes
`Button`, `Icon` (40 íconos propios), `SectionHeading`, `PageHeader`, `Breadcrumbs`, `BeforeAfter`, `Placeholder`, `FaqList`.
