/* ============================================================
   PIXANTRA — SPA page behaviours
   Reveal-on-scroll, sticky header, pinned horizontal scroll,
   scroll-zoom, FAQ accordion, contact form, metric count-ups.
   Horizontal/zoom sections are lazily initialised the first time
   their route is entered (so ScrollTrigger measures them visible).
   ============================================================ */
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = !!window.gsap;
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Sticky/condensed header on scroll ---------- */
  const header = document.querySelector("[data-header]");
  if (header) {
    const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu ---------- */
  const navToggle = document.querySelector("[data-nav-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const mobileLinks = mobileNav ? Array.from(mobileNav.querySelectorAll(".mobile-nav__link")) : [];
  function setMobile(open) {
    if (!mobileNav || !navToggle) return;
    mobileNav.classList.toggle("is-open", open);
    navToggle.classList.toggle("is-open", open);
    mobileNav.setAttribute("aria-hidden", open ? "false" : "true");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.documentElement.style.overflow = open ? "hidden" : "";
  }
  if (navToggle) navToggle.addEventListener("click", () => setMobile(!mobileNav.classList.contains("is-open")));
  // Any route link inside the menu closes it (router handles the navigation).
  mobileLinks.forEach((l) => l.addEventListener("click", () => setMobile(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMobile(false); });

  /* ---------- Pre-hide masked page titles (hidden routes only) ---------- */
  if (hasGSAP && !prefersReduced) {
    gsap.set(".route[hidden] .pg-title__line > span", { yPercent: 110 });
  }

  /* ---------- Reveal-on-scroll ----------
     Driven by ScrollTrigger (not IntersectionObserver) so it stays in
     sync with pinned sections + refreshes, and never gets stranded
     below a pin. Created lazily per route so elements measure visible. */
  function initReveals(scope) {
    const els = (scope || document).querySelectorAll("[data-reveal]:not([data-rev-init])");
    els.forEach((el) => {
      el.setAttribute("data-rev-init", "");
      if (prefersReduced || !window.ScrollTrigger) { el.classList.add("is-in"); return; }
      ScrollTrigger.create({
        trigger: el,
        start: "top 92%",
        once: true,
        onEnter: () => el.classList.add("is-in"),
      });
    });
  }

  /* ---------- Count-up metrics (per page, once each) ---------- */
  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "1";
    const raw = el.textContent.trim();
    const target = parseInt(raw.replace(/\D/g, ""), 10);
    const suffix = raw.replace(/[0-9]/g, "");
    if (!target || prefersReduced || !hasGSAP) return;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: "power2.out",
      onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; },
    });
  }

  /* ---------- Pinned horizontal scroll ---------- */
  function initHScroll(section) {
    if (section.dataset.hInit) return;
    const pin = section.querySelector("[data-hscroll-pin]");
    const track = section.querySelector("[data-hscroll-track]");
    if (!pin || !track) return;

    // Touch / small screens: fall back to native horizontal swipe with snap.
    const useNative = window.matchMedia("(max-width: 820px)").matches || window.matchMedia("(hover: none)").matches;
    if (useNative || prefersReduced || !window.ScrollTrigger) {
      section.setAttribute("data-native", "");
      section.dataset.hInit = "1";
      return;
    }

    // If the track already fits the viewport there's nothing to scroll —
    // centre it and skip pinning (avoids a near-zero pin that jumps).
    const overflow = track.scrollWidth - window.innerWidth;
    if (overflow <= 24) {
      section.setAttribute("data-fits", "");
      section.dataset.hInit = "1";
      return;
    }

    section.dataset.hInit = "1";
    const amount = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -amount(),
      ease: "none",
      scrollTrigger: {
        trigger: pin,          // pin element is the trigger → no heading offset jump
        start: "top top",
        end: () => "+=" + amount(),
        pin: pin,
        pinSpacing: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  }

  /* ---------- Scroll-driven zoom ---------- */
  function initZoom(section) {
    if (section.dataset.zInit) return;
    section.dataset.zInit = "1";
    const pin = section.querySelector("[data-zoom-pin]");
    const scaler = section.querySelector("[data-zoom-scaler]");
    const center = section.querySelector("[data-zoom-center]");
    const reveal = section.querySelector("[data-zoom-reveal]");
    if (!pin || !scaler) return;

    if (prefersReduced || !window.ScrollTrigger) {
      gsap.set?.(scaler, { scale: 1 });
      gsap.set?.(reveal, { opacity: 1 });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=170%",
        pin: pin,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    tl.to(scaler, { scale: 16, ease: "power1.in", duration: 1 }, 0)
      .to(center, { scale: 2.6, opacity: 0, ease: "power1.in", duration: 0.7 }, 0)
      .to(reveal, { opacity: 1, ease: "power1.out", duration: 0.4 }, 0.6);
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll("[data-faq]").forEach((faq) => {
    faq.querySelectorAll(".faq__item").forEach((item) => {
      const q = item.querySelector(".faq__q");
      const a = item.querySelector(".faq__a");
      q.addEventListener("click", () => {
        const open = item.classList.contains("is-open");
        // close siblings
        faq.querySelectorAll(".faq__item.is-open").forEach((sib) => {
          if (sib !== item) {
            sib.classList.remove("is-open");
            if (hasGSAP) gsap.to(sib.querySelector(".faq__a"), { height: 0, duration: 0.4, ease: "power3.inOut" });
            else sib.querySelector(".faq__a").style.height = "0px";
          }
        });
        if (open) {
          item.classList.remove("is-open");
          if (hasGSAP) gsap.to(a, { height: 0, duration: 0.4, ease: "power3.inOut" });
          else a.style.height = "0px";
        } else {
          item.classList.add("is-open");
          const h = a.firstElementChild.offsetHeight;
          if (hasGSAP) gsap.fromTo(a, { height: a.offsetHeight }, { height: h, duration: 0.45, ease: "power3.inOut" });
          else a.style.height = h + "px";
        }
      });
    });
  });

  /* ---------- Contact form (front-end only) ---------- */
  document.querySelectorAll("[data-contact-form]").forEach((form) => {
    const note = form.querySelector("[data-contact-note]");
    const btn = form.querySelector(".cform__submit");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity?.(); return; }
      form.classList.add("is-sent");
      if (btn) btn.innerHTML = "Sent — thanks! <span>✓</span>";
      if (note) note.textContent = "We've got it. Expect a reply within one business day.";
      if (hasGSAP && !prefersReduced) gsap.fromTo(btn, { scale: 0.96 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
    });
  });

  /* ---------- Lazy-init a route's heavy sections on first entry ---------- */
  const doneRoutes = new Set();
  function enterRoute(route, el) {
    const scope = el || document.querySelector(`[data-route-page="${route}"]`);
    if (!scope) return;
    initReveals(scope);
    scope.querySelectorAll("[data-hscroll]").forEach(initHScroll);
    scope.querySelectorAll("[data-zoom]").forEach(initZoom);
    scope.querySelectorAll(".pg-metric__num, .pg-stat__num").forEach(countUp);
    // hand ScrollTrigger a beat to settle new pins, then reveal in-view items
    if (window.ScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh());
    doneRoutes.add(route);
  }

  window.addEventListener("pix:enter", (e) => {
    const { route, el } = e.detail || {};
    // keep the mobile menu's active marker in sync
    mobileLinks.forEach((l) => l.classList.toggle("is-active", l.dataset.route === route));
    enterRoute(route, el);
  });

  // Initialise whichever route is visible at load (home, or a deep-link).
  const initial = (location.hash || "").slice(1) || "home";
  requestAnimationFrame(() => enterRoute(initial, null));
})();
