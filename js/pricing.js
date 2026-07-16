/* ============================================================
   PIXANTRA — Pricing spec-sheet deck (pinned fan-out)
   Relies on GSAP + ScrollTrigger already loaded in index.html.
   ============================================================ */
(() => {
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  const center = document.querySelector('[data-card="center"]');
  const left   = document.querySelector('[data-card="left"]');
  const right  = document.querySelector('[data-card="right"]');
  if (!center || !left || !right) return;

  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: '(min-width: 721px)',
      isMobile:  '(max-width: 720px)',
      reduced:   '(prefers-reduced-motion: reduce)'
    },
    (context) => {
      const { isDesktop, isMobile, reduced } = context.conditions;

      // Mobile: skip the pinned 3D fan entirely. Three overlapping cards on a
      // narrow screen are unreadable, so CSS lays them out as a vertical stack
      // and we just fade each one in as it scrolls into view. No pin, no scrub.
      if (isMobile) {
        [left, center, right].forEach((card) => {
          gsap.set(card, { clearProps: 'all' });
          if (reduced) { gsap.set(card, { opacity: 1, y: 0 }); return; }
          gsap.fromTo(card,
            { opacity: 0, y: 40 },
            {
              opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
              scrollTrigger: { trigger: card, start: 'top 88%' }
            }
          );
        });
        return;
      }

      const spread = 210;
      const tilt   = 9;

      gsap.set(center, { opacity: 0, scale: 0.72, y: 70, rotateZ: 0, z: 0 });
      gsap.set([left, right], {
        opacity: 0, x: 0, y: 30, scale: 0.8, rotateY: 0,
        rotateZ: (i) => (i === 0 ? 6 : -6),
        z: -60, transformOrigin: '50% 100%'
      });
      gsap.set(left,  { rotateY: 78 });
      gsap.set(right, { rotateY: -78 });

      if (reduced) {
        gsap.set(center, { opacity: 1, scale: 1, y: 0 });
        gsap.set(left,  { opacity: 1, x: -spread, y: 14, rotateY: 0, rotateZ: -tilt, scale: 0.94, z: 20 });
        gsap.set(right, { opacity: 1, x:  spread, y: 14, rotateY: 0, rotateZ:  tilt, scale: 0.94, z: 20 });
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#pricing',
          start: 'top top',
          end: '+=160%',
          scrub: 0.6,
          pin: '[data-pricing-pin]',
          anticipatePin: 1,
        }
      });

      tl.to(center, { opacity: 1, scale: 1, y: 0, duration: 0.34, ease: 'power2.out' }, 0);
      tl.to(left,  { opacity: 1, rotateY: 0, x: -spread, y: 14, z: 40, scale: 0.94, rotateZ: -tilt, duration: 0.33, ease: 'power3.out' }, 0.30);
      tl.to(right, { opacity: 1, rotateY: 0, x:  spread, y: 14, z: 40, scale: 0.94, rotateZ:  tilt, duration: 0.33, ease: 'power3.out' }, 0.40);
      tl.to([left, right], { y: 4, duration: 0.15, ease: 'power1.inOut' }, 0.78);
    }
  );

  // Hover: lift the hovered card above ALL others (3D depth + paint order).
  // z-index is bumped instantly on enter so it wins the stacking contest,
  // then restored on leave to the deck's resting order (center above sides).
  const cards = [left, center, right];
  const restZ = { left: 2, center: 3, right: 2 };
  cards.forEach((card) => {
    const key = card.dataset.card;
    card.addEventListener('mouseenter', () => {
      card.style.zIndex = '10';
      gsap.to(card, { z: 90, duration: 0.35, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        z: key === 'center' ? 0 : 40,
        duration: 0.35,
        ease: 'power2.out',
        onComplete: () => { card.style.zIndex = String(restZ[key]); },
      });
    });
  });
})();
