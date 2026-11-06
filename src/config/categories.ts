/**
 * Service categories. Kept outside content.config.ts on purpose: pages must not import
 * content.config.ts, because it pulls the `glob` loader (Node fs) into the Workers runtime
 * used for prerendering, which breaks the build.
 */
export const CATEGORIES = {
  'obra-civil': 'Obra civil y demolición',
  remodelaciones: 'Remodelaciones y adecuaciones',
  acabados: 'Acabados',
  'sistemas-livianos': 'Sistemas livianos',
  instalaciones: 'Instalaciones técnicas',
  metalmecanica: 'Metalmecánica',
  'cubiertas-fachadas': 'Cubiertas y fachadas',
  mantenimiento: 'Mantenimiento',
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
