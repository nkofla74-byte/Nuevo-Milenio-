/**
 * Section-specific timelines, selected by [data-motion="<name>"].
 * Each one uses gsap.matchMedia() so desktop and mobile get different choreography,
 * and every version leaves the content in its final, readable state.
 */
type Gsap = typeof import('gsap').gsap;
interface Kit {
  gsap: Gsap;
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
  SplitText: typeof import('gsap/SplitText').SplitText;
}

const DESKTOP = '(min-width: 1024px)';
const MOBILE = '(max-width: 1023px)';

const handlers: Record<string, (el: HTMLElement, kit: Kit) => void> = {
  hero(el, { gsap, SplitText }) {
    const headline = el.querySelector<HTMLElement>('[data-split]');
    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    if (headline) {
      const split = SplitText.create(headline, { type: 'words', mask: 'words' });
      intro.from(split.words, { yPercent: 110, duration: 1.1, stagger: 0.07 });
    }
    intro.from(el.querySelectorAll('[data-hero-fade]'), { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, '-=0.7');

    // The scene goes from raw concrete to finished space as the user scrolls.
    // Pinned on every size; mobile gets a shorter distance so the thumb does less work.
    const mm = gsap.matchMedia();
    mm.add({ desktop: DESKTOP, mobile: MOBILE }, (ctx) => {
      const { desktop } = ctx.conditions as { desktop: boolean };
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top top', end: desktop ? '+=140%' : '+=100%', scrub: desktop ? 0.6 : 0.3, pin: true, anticipatePin: 1 },
      });
      tl.fromTo('[data-hero-after]', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, 0)
        .from('[data-hero-line]', { drawSVG: '0%', stagger: 0.04, ease: 'none' }, 0)
        .fromTo('[data-hero-stage]:not(:first-child)', { opacity: 0.35 }, { opacity: 1, stagger: 0.25, ease: 'none' }, 0)
        .to('[data-hero-progress]', { scaleX: 1, ease: 'none' }, 0);
    });
  },

  layers(el, { gsap }) {
    const layers = gsap.utils.toArray<HTMLElement>('[data-layer]', el);
    const items = gsap.utils.toArray<HTMLElement>('[data-layer-item]', el);
    const dots = gsap.utils.toArray<HTMLElement>('[data-layer-dot]', el);
    const mm = gsap.matchMedia();
    // Same story on every size: the section pins and each scroll step adds one layer.
    // Mobile uses a shorter distance per layer and CSS shows only the active layer's text.
    mm.add({ desktop: DESKTOP, mobile: MOBILE }, (ctx) => {
      const { desktop } = ctx.conditions as { desktop: boolean };
      // Each layer waits fully outside the wall. xPercent would be relative to the layer's own
      // (narrower) width and leave it partly visible, so offset by the wall's width instead.
      const wall = layers[0].parentElement!;
      const offstage = () => wall.clientWidth + 8;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: `+=${layers.length * (desktop ? 70 : 55)}%`,
          scrub: desktop ? 0.5 : 0.3,
          pin: true,
          anticipatePin: 1,
          snap: { snapTo: 1 / (layers.length - 1), duration: 0.4, ease: 'power1.inOut' },
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const active = Math.round(self.progress * (layers.length - 1));
            items.forEach((it, i) => it.toggleAttribute('data-active', i === active));
            dots.forEach((d, i) => d.toggleAttribute('data-active', i <= active));
          },
        },
      });
      layers.slice(1).forEach((layer, i) => tl.fromTo(layer, { x: offstage }, { x: 0, ease: 'power2.inOut', immediateRender: true }, i));
    });
  },

  projects(el, { gsap }) {
    const track = el.querySelector<HTMLElement>('[data-track]');
    if (!track) return;
    // Vertical scroll drives the horizontal track on every size (cards are 82vw on mobile).
    el.dataset.pinned = '';
    const gutter = () => parseFloat(getComputedStyle(track).paddingLeft) || 16;
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + gutter());
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top top', end: () => `+=${distance()}`, scrub: 0.5, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
    });
  },

  process(el, { gsap }) {
    const path = el.querySelector('[data-process-path]');
    if (path) {
      gsap.from(path, { drawSVG: '0%', ease: 'none', scrollTrigger: { trigger: el, start: 'top 70%', end: 'bottom 70%', scrub: 0.5 } });
    }
    gsap.utils.toArray<HTMLElement>('[data-step]', el).forEach((step) => {
      gsap.from(step, { x: -24, autoAlpha: 0, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: step, start: 'top 80%', once: true } });
    });
  },
};

export function runSection(el: HTMLElement, kit: Kit): void {
  const name = el.dataset.motion;
  if (name && handlers[name]) handlers[name](el, kit);
}
