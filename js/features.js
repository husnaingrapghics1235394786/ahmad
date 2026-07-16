/* ============================================================
   PIXANTRA — added features
   1. Testimonials: 3D cylindrical infinite rotation (hover to pause)
   2. Projects: glass reveal grid + smooth detail popup
   3. Mega footer: giant sliced-wordmark GSAP reveal
   Relies on GSAP + ScrollTrigger already loaded in index.html.
   ============================================================ */
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ============================================================
     1) TESTIMONIALS — cylindrical infinite rotation
     ============================================================ */
  (function testimonials() {
    const ring = document.querySelector("[data-tmony-ring]");
    const stage = document.querySelector("[data-tmony-stage]");
    const tip = document.querySelector("[data-tmony-tip]");
    if (!ring || !stage) return;

    const cards = Array.from(ring.children);
    const n = cards.length;
    const step = 360 / n;

    // Radius so the cards sit evenly on the wall of the cylinder with a
    // comfortable gap. Apothem of a regular n-gon, scaled up a touch.
    const layout = () => {
      const cardW = cards[0].getBoundingClientRect().width || 300;
      const radius = Math.round((cardW / 2) / Math.tan(Math.PI / n) * 1.35);
      cards.forEach((card, i) => {
        card.style.setProperty("--angle", `${i * step}deg`);
        card.style.setProperty("--radius", `${radius}px`);
      });
    };
    layout();
    window.addEventListener("resize", layout);

    if (prefersReduced || !window.gsap) {
      // Static: give a gentle isometric tilt so depth still reads.
      gsap.set?.(ring, { rotateX: -6 });
      return;
    }

    // Slight downward tilt so we look "into" the cylinder, then spin Y.
    gsap.set(ring, { rotateX: -6 });
    const spin = gsap.to(ring, {
      rotateY: "-=360",
      duration: 34,
      ease: "none",
      repeat: -1,
    });

    // Hover anywhere on the stage pauses the spin + shows the tooltip.
    let hovering = false;
    const slow = (ts) => gsap.to(spin, { timeScale: ts, duration: 0.5, ease: "power2.out", overwrite: true });

    if (canHover) {
      stage.addEventListener("mouseenter", () => {
        hovering = true;
        slow(0);
        tip?.classList.add("is-visible");
      });
      stage.addEventListener("mouseleave", () => {
        hovering = false;
        slow(1);
        tip?.classList.remove("is-visible");
      });
      stage.addEventListener("mousemove", (e) => {
        if (!hovering || !tip) return;
        tip.style.left = e.clientX + "px";
        tip.style.top = e.clientY + "px";
      }, { passive: true });
    }

    // Only spin while the section is on screen (perf).
    if (window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: ".tmony",
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          if (self.isActive) { if (!hovering) spin.play(); }
          else spin.pause();
        },
      });
    }
  })();

  /* ============================================================
     2) PROJECTS — data model, glass cards, detail popup
     ============================================================ */
  const PROJECTS = [
    {
      code: "Case / 01", service: "Web Design", name: "Northwind Platform",
      year: "2026", client: "Northwind", timeline: "6 weeks",
      c1: "#009bff", c2: "#0b2a8f", img: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop",
      lead: "A conversion-first marketing site that turned a flat funnel into a 300% demo-request lift.",
      desc: "We rebuilt Northwind's entire front-end around a scroll-driven narrative — pairing a custom type system with GSAP storytelling and a WebGL hero. The result loads under a second and reads like a product demo the moment it opens.",
      tags: ["Webflow", "GSAP", "Design System", "SEO"],
      link: "#",
    },
    {
      code: "Case / 02", service: "Brand Identity", name: "Lumen Labs",
      year: "2025", client: "Lumen Labs", timeline: "4 weeks",
      c1: "#3aa0ff", c2: "#132a86", img: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=900&h=600&fit=crop",
      lead: "A full identity system — mark, motion, and voice — for a research lab going to market.",
      desc: "Logo, color, type and a living motion language delivered as a single kit. Every asset ships with usage rules so the brand stays sharp whether it's a billboard or a favicon.",
      tags: ["Logo", "Guidelines", "Motion", "Naming"],
      link: "#",
    },
    {
      code: "Case / 03", service: "Motion Design", name: "Fable Reels",
      year: "2026", client: "Fable", timeline: "3 weeks",
      c1: "#00b4ff", c2: "#0a3aa0", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=900&h=600&fit=crop",
      lead: "A pack of interface reels and micro-interactions that made the product feel alive.",
      desc: "We choreographed 20+ interface moments — transitions, loaders, and hover states — into a reusable motion library, then documented the timing curves so the team can extend it forever.",
      tags: ["After Effects", "Lottie", "Micro-interactions", "3D"],
      link: "#",
    },
    {
      code: "Case / 04", service: "UI/UX Design", name: "Halyard Dashboard",
      year: "2025", client: "Halyard", timeline: "8 weeks",
      c1: "#2ad0ff", c2: "#0a63d6", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&h=600&fit=crop",
      lead: "A data-dense operations dashboard redesigned around how people actually work.",
      desc: "Research-led flows, a component library, and a prototype validated with real operators before a line of production code. Task time dropped by a third at launch.",
      tags: ["Research", "Figma", "Prototype", "Design System"],
      link: "#",
    },
    {
      code: "Case / 05", service: "Development", name: "Orbit Storefront",
      year: "2026", client: "Orbit Co.", timeline: "10 weeks",
      c1: "#1a5eff", c2: "#0b1b7a", img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&h=600&fit=crop",
      lead: "A headless commerce build engineered for scale, speed, and a flawless Lighthouse score.",
      desc: "React front-end on a headless CMS with edge rendering, custom cart logic and a shader-driven hero. Accessible, fast, and effortless for the client's team to run.",
      tags: ["React", "Headless CMS", "Edge", "WebGL"],
      link: "#",
    },
    {
      code: "Case / 06", service: "Art Direction", name: "Halcyon Campaign",
      year: "2025", client: "Halcyon", timeline: "5 weeks",
      c1: "#4dbaff", c2: "#1226b5", img: "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=900&h=600&fit=crop",
      lead: "End-to-end creative direction for a launch campaign across web, social and print.",
      desc: "We set the tone, mood and aesthetic — then art-directed the shoot, the site, and the rollout so every touchpoint felt like one cohesive world.",
      tags: ["Concept", "Styling", "Photography", "Rollout"],
      link: "#",
    },
  ];

  function cardMarkup(p, idx) {
    return `
      <button class="proj-card" type="button" data-proj="${idx}" data-cursor-hover
              style="--pc1:${p.c1}; --pc2:${p.c2};">
        <div class="proj-card__media">
          <img class="proj-card__img" src="${p.img}" alt="${p.name}" loading="lazy"
               onerror="this.style.display='none'">
          <span class="proj-card__badge">${p.service}</span>
          <span class="proj-card__open" aria-hidden="true">↗</span>
        </div>
        <div class="proj-card__body">
          <div class="proj-card__row">
            <h3 class="proj-card__name">${p.name}</h3>
            <span class="proj-card__year">${p.year}</span>
          </div>
          <p class="proj-card__desc">${p.lead}</p>
          <div class="proj-card__tags">${p.tags.slice(0, 3).map((t) => `<span>${t}</span>`).join("")}</div>
        </div>
      </button>`;
  }

  const mainGrid = document.querySelector("[data-projects-grid]");
  const portfolioGrid = document.querySelector("[data-portfolio-grid]");

  // Main page: one flagship per service line (all six, one each).
  if (mainGrid) mainGrid.innerHTML = PROJECTS.map((p, i) => cardMarkup(p, i)).join("");
  // Portfolio SPA view: the full set.
  if (portfolioGrid) portfolioGrid.innerHTML = PROJECTS.map((p, i) => cardMarkup(p, i)).join("");

  /* ---- Modal wiring ---- */
  const modal = document.querySelector("[data-proj-modal]");
  if (modal) {
    const dialog = modal.querySelector("[data-proj-modal-dialog]");
    const backdrop = modal.querySelector("[data-proj-modal-backdrop]");
    const els = {
      img: modal.querySelector("[data-proj-modal-img]"),
      badge: modal.querySelector("[data-proj-modal-badge]"),
      code: modal.querySelector("[data-proj-modal-code]"),
      title: modal.querySelector("[data-proj-modal-title]"),
      lead: modal.querySelector("[data-proj-modal-lead]"),
      desc: modal.querySelector("[data-proj-modal-desc]"),
      client: modal.querySelector("[data-proj-modal-client]"),
      year: modal.querySelector("[data-proj-modal-year]"),
      service: modal.querySelector("[data-proj-modal-service]"),
      timeline: modal.querySelector("[data-proj-modal-timeline]"),
      tags: modal.querySelector("[data-proj-modal-tags]"),
      link: modal.querySelector("[data-proj-modal-link]"),
      media: modal.querySelector(".proj-modal__media"),
    };
    let lastFocus = null;
    let openTl = null;

    function fill(p) {
      els.badge.textContent = p.service;
      els.code.textContent = p.code;
      els.title.textContent = p.name;
      els.lead.textContent = p.lead;
      els.desc.textContent = p.desc;
      els.client.textContent = p.client;
      els.year.textContent = p.year;
      els.service.textContent = p.service;
      els.timeline.textContent = p.timeline;
      els.tags.innerHTML = p.tags.map((t) => `<span>${t}</span>`).join("");
      els.link.setAttribute("href", p.link || "#");
      els.media.style.setProperty("--pc1", p.c1);
      els.media.style.setProperty("--pc2", p.c2);
      // Show the case-study image; fall back to the gradient if it's missing.
      if (p.img) {
        els.img.style.display = "";
        els.img.onerror = () => { els.img.style.display = "none"; };
        els.img.src = p.img;
        els.img.alt = p.name;
      } else {
        els.img.style.display = "none";
      }
    }

    function open(idx) {
      const p = PROJECTS[idx];
      if (!p) return;
      fill(p);
      lastFocus = document.activeElement;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.documentElement.style.overflow = "hidden";
      window.lenis?.stop?.();

      if (prefersReduced || !window.gsap) {
        gsap.set?.([backdrop, dialog], { opacity: 1, clearProps: "transform" });
        modal.querySelector("[data-proj-modal-close]")?.focus();
        return;
      }
      openTl?.kill();
      const items = dialog.querySelectorAll(".proj-modal__panel > *");
      openTl = gsap.timeline({ defaults: { ease: "power4.out" } });
      openTl
        .fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0)
        .fromTo(dialog,
          { opacity: 0, y: 60, scale: 0.94, filter: "blur(6px)" },
          { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.7 }, 0.05)
        .fromTo(items,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.05 }, 0.28);
      modal.querySelector("[data-proj-modal-close]")?.focus();
    }

    function close() {
      if (!modal.classList.contains("is-open")) return;
      const done = () => {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.documentElement.style.overflow = "";
        window.lenis?.start?.();
        lastFocus?.focus?.();
      };
      if (prefersReduced || !window.gsap) { done(); return; }
      openTl?.kill();
      gsap.timeline({ onComplete: done })
        .to(dialog, { opacity: 0, y: 40, scale: 0.96, duration: 0.4, ease: "power3.in" }, 0)
        .to(backdrop, { opacity: 0, duration: 0.4 }, 0.05);
    }

    // Delegate clicks from any grid (main + portfolio) to open the modal.
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-proj]");
      if (!trigger) return;
      open(parseInt(trigger.dataset.proj, 10));
    });

    modal.querySelector("[data-proj-modal-close]")?.addEventListener("click", close);
    backdrop?.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    // Navigating away (e.g. "All work" route link inside the modal) closes it.
    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-route]")) close();
    });
  }

  /* ---- Reveal project cards on scroll (awwwards-style) ---- */
  if (mainGrid && window.ScrollTrigger && !prefersReduced && window.gsap) {
    gsap.set(mainGrid.children, { y: 60, opacity: 0, rotateX: 8, transformOrigin: "center top" });
    ScrollTrigger.batch(mainGrid.children, {
      start: "top 88%",
      onEnter: (batch) =>
        gsap.to(batch, {
          y: 0, opacity: 1, rotateX: 0,
          duration: 1, ease: "power4.out", stagger: 0.12, overwrite: true,
        }),
    });
  }

  // Attach cursor-hover behaviour to injected cards (main.js already ran).
  if (canHover) {
    const cursor = document.querySelector("[data-cursor]");
    document.querySelectorAll(".proj-card, [data-proj-modal-close], .proj-modal__link").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor?.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor?.classList.remove("is-hover"));
    });
  }

  /* ============================================================
     3) MEGA FOOTER — sliced wordmark reveal
     ============================================================ */
  (function megaFooter() {
    const wordEl = document.querySelector("[data-mega-word]");
    if (!wordEl) return;

    const text = wordEl.textContent.trim();
    wordEl.textContent = "";
    const tops = [];
    const bots = [];

    for (const ch of text) {
      const letter = document.createElement("span");
      letter.className = "mega-letter";

      const base = document.createElement("span");
      base.className = "mega-letter__base";
      base.textContent = ch;

      const top = document.createElement("span");
      top.className = "mega-slice mega-slice--top";
      top.textContent = ch;

      const bot = document.createElement("span");
      bot.className = "mega-slice mega-slice--bot";
      bot.textContent = ch;

      letter.append(base, top, bot);
      wordEl.appendChild(letter);
      tops.push(top);
      bots.push(bot);
    }

    if (prefersReduced || !window.gsap || !window.ScrollTrigger) return;

    // Slices start driven apart (top up, bottom down) + blurred, then the
    // halves converge letter-by-letter as the footer scrolls into frame.
    gsap.set(tops, { yPercent: -120, opacity: 0, filter: "blur(8px)" });
    gsap.set(bots, { yPercent: 120, opacity: 0, filter: "blur(8px)" });
    gsap.set(wordEl.querySelectorAll(".mega-letter"), { rotateX: -40, transformOrigin: "center" });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".mega-footer",
        start: "top 72%",
        end: "bottom bottom",
        scrub: 0.7,
      },
    });

    tl.to(wordEl.querySelectorAll(".mega-letter"),
        { rotateX: 0, duration: 0.6, ease: "power2.out", stagger: 0.05 }, 0)
      .to(tops,
        { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1, ease: "power4.out", stagger: 0.06 }, 0)
      .to(bots,
        { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1, ease: "power4.out", stagger: 0.06 }, 0.04);

    // Back-to-top
    document.querySelector("[data-mega-totop]")?.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.lenis?.scrollTo) window.lenis.scrollTo(0, { duration: 1.4 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  })();
})();
