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
    const mm = gsap.matchMedia();
    mm.add({ desktop: DESKTOP, mobile: MOBILE }, (ctx) => {
      const { desktop } = ctx.conditions as { desktop: boolean };
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top top', end: desktop ? '+=140%' : '+=80%', scrub: 0.6, pin: desktop },
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
    const mm = gsap.matchMedia();
    mm.add(DESKTOP, () => {
      gsap.set(layers.slice(1), { xPercent: 105 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: `+=${layers.length * 70}%`,
          scrub: 0.5,
          pin: true,
          snap: { snapTo: 1 / (layers.length - 1), duration: 0.4, ease: 'power1.inOut' },
          onUpdate: (self) => {
            const active = Math.round(self.progress * (layers.length - 1));
            items.forEach((it, i) => it.toggleAttribute('data-active', i === active));
          },
        },
      });
      layers.slice(1).forEach((layer, i) => tl.to(layer, { xPercent: 0, ease: 'power2.inOut' }, i));
    });
    mm.add(MOBILE, () => {
      items.forEach((it) => gsap.from(it, { y: 30, autoAlpha: 0, duration: 0.7, scrollTrigger: { trigger: it, start: 'top 85%', once: true } }));
    });
  },

  projects(el, { gsap }) {
    const track = el.querySelector<HTMLElement>('[data-track]');
    if (!track) return;
    const mm = gsap.matchMedia();
    mm.add(DESKTOP, () => {
      const distance = () => track.scrollWidth - window.innerWidth + 64;
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: () => `+=${distance()}`, scrub: 0.6, pin: true, invalidateOnRefresh: true },
      });
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
