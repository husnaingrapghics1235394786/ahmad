/* ============================================================
   PIXANTRA — Preloader
   A layered, brand-matched boot sequence that gates the hero
   intro. Loads before main.js so it can flag that the intro
   timeline should wait for the `pixantra:reveal` signal.
   Everything animates on transform/opacity only → buttery.
   ============================================================ */
(function () {
  const pre = document.querySelector("[data-preloader]");
  if (!pre) return;

  // Tell main.js to hold the hero intro until we hand off.
  window.__PIX_PRELOADER = true;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  root.classList.add("pix-loading");

  const wordEl   = pre.querySelector("[data-pre-word]");
  const statusEl = pre.querySelector("[data-pre-status]");
  const fillEl   = pre.querySelector("[data-pre-fill]");
  const countEl  = pre.querySelector("[data-pre-count]");
  const panels   = Array.from(pre.querySelectorAll("[data-pre-panels] > span"));

  /* ---------- Build the wordmark from masked letters ---------- */
  const LETTERS = "PIXANTRA".split("");
  const letterEls = LETTERS.map((ch, i) => {
    const mask = document.createElement("span");
    mask.className = "pre-mask";
    const l = document.createElement("span");
    l.className = "pre-l" + (ch === "X" ? " pre-l--x" : "");
    l.textContent = ch;
    mask.appendChild(l);
    wordEl.appendChild(mask);
    return l;
  });

  /* ---------- Fire the hand-off signal exactly once ---------- */
  let handedOff = false;
  function reveal() {
    if (handedOff) return;
    handedOff = true;
    window.dispatchEvent(new CustomEvent("pixantra:reveal"));
  }

  function teardown() {
    root.classList.remove("pix-loading");
    pre.remove();
  }

  /* ---------- Reduced motion: skip the show, hand off fast ---------- */
  if (prefersReduced || !window.gsap) {
    countEl.textContent = "100";
    if (fillEl) fillEl.style.transform = "scaleX(1)";
    letterEls.forEach((l) => l.style.transform = "translateY(0)");
    reveal();
    if (window.gsap) {
      gsap.to(pre, { opacity: 0, duration: 0.4, ease: "power2.out",
        onComplete: teardown });
    } else {
      pre.style.transition = "opacity .4s ease";
      pre.style.opacity = "0";
      setTimeout(teardown, 420);
    }
    return;
  }

  /* ---------- Status ticker ---------- */
  const STATUS = [
    "Initializing", "Compiling shaders", "Warming pixels",
    "Loading assets", "Aligning grid", "Ready",
  ];
  let statusIdx = -1;
  function setStatus(i) {
    if (i === statusIdx || !statusEl) return;
    statusIdx = i;
    statusEl.textContent = STATUS[i];
  }

  /* ---------- Render one frame of progress (0–100) ---------- */
  const state = { v: 0 };
  let shown = -1;
  function render() {
    const p = Math.min(100, state.v);
    const rounded = Math.round(p);
    if (rounded !== shown) {
      shown = rounded;
      countEl.textContent = String(rounded).padStart(3, "0");
    }
    if (fillEl) fillEl.style.transform = "scaleX(" + (p / 100) + ")";

    // Reveal each letter as progress sweeps across its slot.
    const per = 100 / letterEls.length;
    letterEls.forEach((l, i) => {
      const threshold = i * per + per * 0.35;
      l.classList.toggle("is-in", p >= threshold);
    });

    setStatus(Math.min(STATUS.length - 1, Math.floor((p / 100) * STATUS.length)));
  }

  /* ---------- Real readiness signals (never reveal too early) ---------- */
  const MIN_MS = 1500;
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  const fontsReady = (document.fonts && document.fonts.ready)
    ? document.fonts.ready.catch(() => {})
    : Promise.resolve();

  const windowReady = document.readyState === "complete"
    ? Promise.resolve()
    : new Promise((r) => window.addEventListener("load", r, { once: true }));

  const heroImg = document.querySelector(".success__img");
  const imgReady = (heroImg && !heroImg.complete)
    ? new Promise((r) => {
        heroImg.addEventListener("load", r, { once: true });
        heroImg.addEventListener("error", r, { once: true });
      })
    : Promise.resolve();

  const ready = Promise.all([fontsReady, windowReady, imgReady, delay(MIN_MS)]);

  // Hard safety valve — never trap the user behind the loader.
  const safety = delay(7000);

  /* ---------- Intro of the loader UI ---------- */
  gsap.set(pre.querySelectorAll(".preloader__top, .preloader__bottom, .preloader__status"),
    { opacity: 0, y: 14 });
  gsap.set(pre.querySelectorAll(".preloader__corner"), { opacity: 0, scale: 0.4 });
  gsap.set(pre.querySelectorAll(".preloader__plus"), { opacity: 0, scale: 0 });

  const introTl = gsap.timeline({ defaults: { ease: "power3.out" } });
  introTl
    .to(pre.querySelectorAll(".preloader__corner"),
      { opacity: 1, scale: 1, duration: 0.7, stagger: 0.05 }, 0.05)
    .to(pre.querySelector(".preloader__top"),
      { opacity: 1, y: 0, duration: 0.7 }, 0.15)
    .to(pre.querySelectorAll(".preloader__bottom, .preloader__status"),
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.25)
    .to(pre.querySelectorAll(".preloader__plus"),
      { opacity: 0.7, scale: 1, duration: 0.7, stagger: 0.06, ease: "back.out(2)" }, 0.3);

  /* ---------- Progress drive ---------- */
  // Crawl smoothly toward 92%, then let real readiness finish it.
  gsap.to(state, {
    v: 92, duration: 3.2, ease: "power1.out",
    onUpdate: render,
  });

  function finish() {
    gsap.killTweensOf(state);
    gsap.to(state, {
      v: 100, duration: 0.6, ease: "power2.out",
      onUpdate: render,
      onComplete: exit,
    });
  }

  Promise.race([ready, safety]).then(finish);

  /* ---------- Exit — content lifts, panels wipe up, site revealed ---------- */
  let exited = false;
  function exit() {
    if (exited) return;
    exited = true;

    const out = gsap.timeline({
      defaults: { ease: "power4.inOut" },
      onComplete: teardown,
    });

    out
      // brief "locked in" beat at 100
      .to(pre.querySelector(".preloader__count"),
        { scale: 1.04, duration: 0.25, ease: "power2.out" })
      // content clears
      .to([
        pre.querySelector(".preloader__center"),
        pre.querySelector(".preloader__top"),
        pre.querySelector(".preloader__bottom"),
      ], { opacity: 0, y: -26, duration: 0.5, ease: "power3.in", stagger: 0.04 }, 0.15)
      .to(pre.querySelectorAll(".preloader__corner, .preloader__plus"),
        { opacity: 0, duration: 0.35 }, 0.15)
      // panels sweep up to uncover the page beneath
      .to(panels, { yPercent: -100, duration: 0.72, stagger: 0.07 }, 0.42)
      // fire the hero intro just as the last panel clears
      .add(reveal, "-=0.34");
  }
})();
