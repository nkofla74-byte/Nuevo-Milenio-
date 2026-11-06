/**
 * Motion entry point. Loaded on every page, but GSAP itself is only downloaded when
 * the page contains animated elements and the user has not asked for reduced motion.
 *
 * Contract with the markup (content is always visible without JS):
 *   [data-reveal]        fade/slide in when entering the viewport
 *   [data-split]         headline revealed word by word
 *   [data-draw-line]     horizontal rule that "draws" itself
 *   [data-count]         number that counts up to its value
 *   [data-mask]          image revealed with a clip-path mask
 *   [data-magnetic]      button that follows the pointer (fine pointers only)
 *   [data-motion="x"]    section-specific timeline, see ./sections.ts
 */

const ANIMATED = '[data-reveal],[data-split],[data-draw-line],[data-count],[data-mask],[data-motion]';

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export async function initMotion(): Promise<void> {
  const root = document.documentElement;
  if (prefersReducedMotion()) {
    root.dataset.motion = 'reduced';
    return;
  }
  if (!document.querySelector(ANIMATED)) return;

  const [{ gsap }, { ScrollTrigger }, { SplitText }, { DrawSVGPlugin }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
    import('gsap/SplitText'),
    import('gsap/DrawSVGPlugin'),
  ]);
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
  // Mobile browsers resize the viewport when the address bar shows/hides; recalculating
  // every pin on each of those resizes makes pinned sections jump. Ignore those resizes.
  ScrollTrigger.config({ ignoreMobileResize: true });
  root.dataset.motion = 'on';

  await setupSmoothScroll(gsap, ScrollTrigger);

  const sections = [...document.querySelectorAll<HTMLElement>('[data-motion]')];
  const mod = sections.length ? await import('./sections') : null;
  // One section per task: creating pins measures layout and is expensive on phones. Yielding
  // between sections splits one long main-thread task into short ones (lower TBT/INP).
  for (const el of sections) {
    mod!.runSection(el, { gsap, ScrollTrigger, SplitText });
    await yieldToMain();
  }

  const { setupPrimitives } = await import('./primitives');
  setupPrimitives(gsap, ScrollTrigger, SplitText);

  // Fonts change text metrics; recalc trigger positions once they are in.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

/** Lets the browser handle input and paint before continuing (scheduler.yield when available). */
function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (scheduler?.yield) return scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Lenis only on desktop with a fine pointer; touch devices keep native scrolling. */
async function setupSmoothScroll(gsap: typeof import('gsap').gsap, ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger) {
  if (!window.matchMedia('(pointer: fine) and (min-width: 1024px)').matches) return;
  const { default: Lenis } = await import('lenis');
  const lenis = new Lenis({ lerp: 0.12, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
