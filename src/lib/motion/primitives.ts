/** Generic, reusable scroll animations driven by data-attributes. Only transform/opacity/clip-path. */
type Gsap = typeof import('gsap').gsap;
type ST = typeof import('gsap/ScrollTrigger').ScrollTrigger;
type Split = typeof import('gsap/SplitText').SplitText;

export function setupPrimitives(gsap: Gsap, ScrollTrigger: ST, SplitText: Split): void {
  const once = { start: 'top 85%', once: true } as const;

  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 40,
      autoAlpha: 0,
      duration: 0.9,
      ease: 'expo.out',
      delay: Number(el.dataset.revealDelay ?? 0),
      scrollTrigger: { trigger: el, ...once },
    });
  });

  gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => {
    if (el.closest('[data-motion]')) return; // section timelines own their headlines
    SplitText.create(el, {
      type: 'words',
      mask: 'words',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.words, {
          yPercent: 110,
          duration: 0.9,
          stagger: 0.06,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, ...once },
        }),
    });
  });

  gsap.utils.toArray<HTMLElement>('[data-draw-line]').forEach((el) => {
    gsap.from(el, { scaleX: 0, transformOrigin: 'left center', duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, ...once } });
  });

  gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    const counter = { v: 0 };
    const fmt = new Intl.NumberFormat('es-CO');
    gsap.to(counter, {
      v: target,
      duration: 1.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, ...once },
      onUpdate: () => (el.textContent = fmt.format(Math.round(counter.v))),
    });
  });

  gsap.utils.toArray<HTMLElement>('[data-mask]').forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: 'inset(12% 12% 12% 12%)', scale: 1.08 },
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, ...once } },
    );
  });

  if (window.matchMedia('(pointer: fine)').matches) {
    gsap.utils.toArray<HTMLElement>('[data-magnetic]').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
      const y = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.25);
        y((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => {
        x(0);
        y(0);
      });
    });
  }

  ScrollTrigger.refresh();
}
