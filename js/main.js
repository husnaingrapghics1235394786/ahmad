/* ============================================================
   GSAP intro timeline + micro-interactions
   ============================================================ */
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Split copy into animatable words ---------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((chunk) => {
        if (chunk.trim() === "") { frag.appendChild(document.createTextNode(chunk)); return; }
        const outer = document.createElement("span");
        outer.className = "word-mask";
        outer.style.display = "inline-block";
        outer.style.overflow = "hidden";
        outer.style.verticalAlign = "top";
        const inner = document.createElement("span");
        inner.className = "word";
        inner.style.display = "inline-block";
        inner.style.willChange = "transform";
        inner.textContent = chunk;
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
      node.parentNode.replaceChild(frag, node);
    });
  });

  document.body.classList.add("js-ready");
  const words = gsap.utils.toArray(".hero__copy .word");

  if (prefersReduced) {
    gsap.set([words, "[data-wordmark]", ".nav__link", ".ceo-card", ".explore", ".services__item", ".logo", ".footer > *"], { clearProps: "all" });
  } else {
    /* ---------- Intro timeline ---------- */
    // If the preloader is present, hold this timeline paused until it
    // fires the `pixantra:reveal` handoff signal, so the hero doesn't
    // animate in underneath the loading screen.
    const holdForPreloader = !!window.__PIX_PRELOADER;
    const tl = gsap.timeline({ defaults: { ease: "power4.out" }, paused: holdForPreloader });

    gsap.set(".logo", { yPercent: -140, opacity: 0 });
    gsap.set(".nav__link", { yPercent: -140, opacity: 0 });
    gsap.set(".ceo-card", { y: -30, opacity: 0 });
    gsap.set(words, { yPercent: 115 });
    gsap.set(".explore", { y: 24, opacity: 0 });
    gsap.set(".services__item", { x: -20, opacity: 0 });
    gsap.set("[data-wordmark]", { yPercent: 120, opacity: 0 });
    gsap.set(".footer > *", { opacity: 0, y: 12 });
    gsap.set(".plus", { scale: 0, opacity: 0 });

    tl.to(".logo", { yPercent: 0, opacity: 1, duration: 1 }, 0.1)
      .to(".nav__link", { yPercent: 0, opacity: 1, duration: 1, stagger: 0.06 }, 0.15)
      .to(".ceo-card", { y: 0, opacity: 1, duration: 1 }, 0.25)
      .to("[data-wordmark]", { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.12, ease: "expo.out" }, 0.2)
      .to(words, { yPercent: 0, duration: 1.1, stagger: 0.05 }, 0.5)
      .to(".explore", { y: 0, opacity: 1, duration: 0.9 }, 0.9)
      .to(".services__item", { x: 0, opacity: 1, duration: 0.8, stagger: 0.09 }, 1.0)
      .to(".plus", { scale: 1, opacity: 0.7, duration: 0.8, stagger: 0.08, ease: "back.out(2)" }, 1.0)
      .to(".footer > *", { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 1.1);

    if (holdForPreloader) {
      window.addEventListener("pixantra:reveal", () => tl.play(), { once: true });
    }
  }

  /* ---------- Custom cursor ---------- */
  const cursor = document.querySelector("[data-cursor]");
  if (cursor && window.matchMedia("(hover: hover)").matches) {
    const dot = cursor.querySelector(".cursor__dot");
    const ring = cursor.querySelector(".cursor__ring");
    const setDotX = gsap.quickSetter(dot, "x", "px");
    const setDotY = gsap.quickSetter(dot, "y", "px");
    const rx = gsap.quickTo(ring, "x", { duration: 0.4, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.4, ease: "power3" });

    window.addEventListener("mousemove", (e) => {
      setDotX(e.clientX); setDotY(e.clientY);
      rx(e.clientX); ry(e.clientY);
    }, { passive: true });

    document.querySelectorAll("[data-cursor-hover]").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 0.35;
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        xTo(mx * strength); yTo(my * strength);
      });
      el.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Parallax markers + wordmark on pointer ---------- */
  if (!prefersReduced && window.matchMedia("(hover: hover)").matches) {
    const parallaxEls = gsap.utils.toArray("[data-parallax]");
    const wm = document.querySelector(".wordmark");
    const wmX = wm ? gsap.quickTo(wm, "x", { duration: 1.1, ease: "power3" }) : null;

    window.addEventListener("mousemove", (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5);
      const ny = (e.clientY / window.innerHeight - 0.5);
      parallaxEls.forEach((el) => {
        const depth = parseFloat(el.dataset.parallax) || 0.05;
        gsap.to(el, { x: nx * depth * 600, y: ny * depth * 600, duration: 1, ease: "power3", overwrite: "auto" });
      });
      if (wmX) wmX(-50 + nx * 24);
    }, { passive: true });

    // keep wordmark centered baseline (offset the quickTo center)
    if (wm) gsap.set(wm, { xPercent: -50 });
  }

  /* ============================================================
     Scroll-driven marquee — top row L→R, bottom row R→L
     ============================================================ */
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (window.ScrollTrigger && !prefersReduced) {
    document.querySelectorAll("[data-marquee]").forEach((track) => {
      const ltr = track.dataset.dir === "ltr";
      // each track holds two identical groups (200% wide) so one group-width
      // of travel keeps it seamlessly filled the whole time
      gsap.fromTo(
        track,
        { xPercent: ltr ? -50 : 0 },
        {
          xPercent: ltr ? 0 : -50,
          ease: "none",
          scrollTrigger: {
            trigger: ".marquee-band",
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        }
      );
    });
  }

  /* ============================================================
     Scroll-reveal statement — dull → white, letter by letter
     ============================================================ */
  const statementText = document.querySelector("[data-statement-text]");
  const statementVideo = document.querySelector(".statement__video");
  if (statementVideo) {
    // If the video file is missing/undecodable, drop the element so the
    // warm gradient fallback shows through cleanly instead of a broken box.
    statementVideo.addEventListener("error", () => { statementVideo.style.display = "none"; });
    const p = statementVideo.play?.();
    if (p && typeof p.catch === "function") p.catch(() => {}); // ignore autoplay policy rejections
  }
  if (statementText) {
    // Wrap every non-space character in its own span so we can light
    // them one at a time. Spaces stay as plain text to keep word wrapping.
    const raw = statementText.textContent;
    statementText.textContent = "";
    const chars = [];
    for (const ch of raw) {
      if (ch === " ") {
        statementText.appendChild(document.createTextNode(" "));
        continue;
      }
      const span = document.createElement("span");
      span.className = "st-char";
      span.textContent = ch;
      statementText.appendChild(span);
      chars.push(span);
    }

    if (prefersReduced) {
      chars.forEach((c) => c.classList.add("is-lit"));
    } else if (window.ScrollTrigger) {
      let lit = -1; // highest index currently lit
      ScrollTrigger.create({
        trigger: ".statement",
        start: "top 78%",
        end: "bottom 62%",
        scrub: true,
        onUpdate: (self) => {
          const target = Math.round(self.progress * chars.length) - 1;
          if (target === lit) return;
          if (target > lit) {
            for (let i = lit + 1; i <= target; i++) chars[i]?.classList.add("is-lit");
          } else {
            for (let i = lit; i > target; i--) chars[i]?.classList.remove("is-lit");
          }
          lit = target;
        },
      });
    } else {
      chars.forEach((c) => c.classList.add("is-lit"));
    }
  }

  /* ============================================================
     Stacked service cards — pin, then scrub each card up from below
     ============================================================ */
  const svcStack = document.querySelector("[data-svc-stack]");
  const svcCards = svcStack ? gsap.utils.toArray(".svc-card", svcStack) : [];
  if (svcStack && svcCards.length && window.ScrollTrigger && !prefersReduced) {
    // All cards share the same centered slot (DOM order = stack order, last on top).
    gsap.set(svcCards, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    // Every card except the first starts off-screen below the pinned viewport.
    const belowY = () => window.innerHeight * 1.1;
    gsap.set(svcCards.slice(1), { y: belowY });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: svcStack,
        start: "top top",
        // one full viewport of scroll per incoming card (+ a little tail)
        end: () => "+=" + window.innerHeight * (svcCards.length - 1 + 0.4),
        pin: ".svc-stack__pin",
        pinSpacing: true,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    // Card 0 is already resting at center; slide each next card up over it.
    for (let i = 1; i < svcCards.length; i++) {
      tl.to(svcCards[i], { y: 0, ease: "none", duration: 1 });
    }
  } else if (svcStack && svcCards.length) {
    // Reduced motion / no ScrollTrigger: lay cards out in a simple stack flow.
    gsap.set(svcCards, { position: "relative", left: "auto", top: "auto", xPercent: 0, yPercent: 0, x: 0, y: 0 });
    svcStack.querySelector(".svc-stack__pin").style.height = "auto";
    svcStack.querySelector(".svc-stack__pin").style.display = "grid";
    svcStack.querySelector(".svc-stack__pin").style.gap = "24px";
  }

  /* ============================================================
     Success section — portrait parallax + stat count-up
     ============================================================ */
  const parallaxImg = document.querySelector("[data-parallax-img]");
  const portraitImg = document.querySelector(".success__img");
  if (portraitImg) {
    // Hide a broken/missing image so the gradient fallback shows cleanly.
    portraitImg.addEventListener("error", () => { portraitImg.style.display = "none"; });
    if (portraitImg.complete && portraitImg.naturalWidth === 0) portraitImg.style.display = "none";
  }
  if (parallaxImg && window.ScrollTrigger && !prefersReduced) {
    // Image inner is oversized (inset -14%); drift it as the card scrolls by.
    gsap.fromTo(
      parallaxImg,
      { yPercent: -12 },
      {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-parallax-card]",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  }

  // Count-up stats when they enter view
  const stats = gsap.utils.toArray(".stat__num");
  if (stats.length && window.ScrollTrigger && !prefersReduced) {
    stats.forEach((el) => {
      const raw = el.textContent.trim();
      const target = parseInt(raw.replace(/\D/g, ""), 10);
      const suffix = raw.replace(/[0-9]/g, ""); // "+", "%", etc.
      if (!target) return;
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            v: target,
            duration: 1.6,
            ease: "power2.out",
            onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; },
          });
        },
      });
    });
  }

  /* ============================================================
     SPA router — full-page swap with panel-wipe transition
     Each [data-route-page] is a complete page; only the active one
     is in the document flow. URL is kept in sync via the hash so
     deep-links, refresh and back/forward all work (incl. file://).
     ============================================================ */
  const routes = gsap.utils.toArray("[data-route-page]");
  const navLinks = gsap.utils.toArray(".nav__link");
  const overlay = document.querySelector("[data-transition]");
  const panels = gsap.utils.toArray(".transition__panel");
  const labelEl = document.querySelector("[data-transition-label]");
  let animating = false;

  const TITLES = {
    home: "PIXANTRA — Creative Studio",
    portfolio: "Portfolio — PIXANTRA",
    about: "About — PIXANTRA",
    contact: "Contact — PIXANTRA",
  };

  const routeFor = (r) => routes.find((v) => v.dataset.routePage === r);
  const currentRoute = () => routes.find((v) => !v.hidden);

  function setActiveNav(route) {
    navLinks.forEach((l) => l.classList.toggle("is-active", l.dataset.route === route));
  }

  // Reveal incoming page: rise the masked title lines, re-run the hero
  // intro for home, then let page.js pick up reveals / lazy sections.
  function revealRoute(routeEl, route) {
    const lines = routeEl.querySelectorAll(".pg-title__line > span");
    if (lines.length && !prefersReduced) {
      gsap.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.05, ease: "expo.out", stagger: 0.1 });
    }
    if (route === "home" && !prefersReduced) {
      const targets = routeEl.querySelectorAll(".hero__copy .word, .explore, .services, .wordmark");
      gsap.fromTo(targets, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.05, ease: "power4.out" });
    }
    window.dispatchEvent(new CustomEvent("pix:enter", { detail: { route, el: routeEl } }));
  }

  function swap(nextEl, route) {
    const cur = currentRoute();
    if (cur && cur !== nextEl) { cur.hidden = true; cur.classList.remove("is-active"); }
    nextEl.hidden = false;
    nextEl.classList.add("is-active");
    setActiveNav(route);
    document.title = TITLES[route] || document.title;
    // land at the top of the new page before triggers recompute
    if (window.lenis?.scrollTo) window.lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  function navigate(route, push = true) {
    const next = routeFor(route);
    if (!next || animating || next === currentRoute()) return;
    animating = true;
    labelEl.textContent = route === "home" ? "Pixantra" : route.charAt(0).toUpperCase() + route.slice(1);

    if (push) { try { history.pushState({ route }, "", "#" + route); } catch (e) { location.hash = route; } }

    if (prefersReduced) {
      swap(next, route);
      revealRoute(next, route);
      animating = false;
      return;
    }

    gsap.timeline({ onComplete: () => { animating = false; } })
      .set(overlay, { pointerEvents: "auto" })
      // cover: panels sweep up from the bottom
      .to(panels, { scaleY: 1, transformOrigin: "bottom", duration: 0.5, stagger: 0.06, ease: "power4.inOut" })
      .fromTo(labelEl, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.34, ease: "power2.out" }, "-=0.3")
      // swap the whole page while covered
      .add(() => swap(next, route), "+=0.02")
      .to({}, { duration: 0.12 })
      // uncover: panels retract upward
      .to(labelEl, { opacity: 0, y: -18, duration: 0.28, ease: "power2.in" })
      .to(panels, { scaleY: 0, transformOrigin: "top", duration: 0.5, stagger: 0.06, ease: "power4.inOut" }, "-=0.05")
      .set(overlay, { pointerEvents: "none" })
      .add(() => revealRoute(next, route), "-=0.35");
  }

  // Expose the router for any injected UI.
  window.PIX = { navigate };

  // One delegated handler for every [data-route] link (nav, CTAs, footer…).
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-route]");
    if (!link) return;
    const route = link.dataset.route;
    if (!routeFor(route)) return;
    e.preventDefault();
    navigate(route);
  });

  // Back/forward + deep-link support
  window.addEventListener("popstate", () => {
    const route = (location.hash || "#home").slice(1) || "home";
    if (routeFor(route)) navigate(route, false);
  });

  // Deep-link / refresh on a non-home route: jump straight there.
  const initial = (location.hash || "").slice(1);
  if (initial && initial !== "home" && routeFor(initial)) {
    swap(routeFor(initial), initial);
    revealRoute(routeFor(initial), initial);
  }
})();


const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
  infinite: false,
});
window.lenis = lenis;

/* Lenis <-> ScrollTrigger sync.
   Without this the pinned sections (e.g. the four-steps hscroll) update
   on the browser's native scroll clock while Lenis animates on its own RAF
   loop — the two disagree every frame, which reads as jumpy/jerky pinning.
   Fix: refresh ScrollTrigger on each Lenis scroll and drive Lenis from GSAP's
   single ticker (with lag smoothing off so pins don't drift). */
if (window.ScrollTrigger) {
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
} else {
  const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}