/* ============================================================

Liquid gradient water background (raw WebGL, no image, no deps)

- Procedural deep-navy (top) -> sky-blue (bottom) gradient (no texture => no CORS)
   - Topographic contour lines that flow like a current
   - Pointer acts like fingers dragged through water:
     radiating ripples + velocity drag + settling
   ============================================================ */
(function () {
  const canvas = document.getElementById("liquid-canvas");
  if (!canvas) return;

  // Mobile / coarse-pointer devices skip the WebGL background entirely —
  // matches the CSS breakpoint that hides #liquid-canvas there.
  const isMobile = window.matchMedia("(max-width: 760px), (hover: none) and (pointer: coarse)").matches;
  if (isMobile) { canvas.style.display = "none"; return; }

  // Users who ask for reduced motion get the static --bg fallback, no loop.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    canvas.style.display = "none";
    return;
  }

  const gl = canvas.getContext("webgl", { antialias: true });
  if (!gl) { canvas.style.display = "none"; return; }

  const vert = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() {
      vUv = aPos * 0.5 + 0.5;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }`;

  const frag = `
    precision highp float;
    varying vec2 vUv;
    uniform vec2  uRes;
    uniform vec2  uMouse;   // 0..1, y flipped
    uniform vec2  uVel;     // pointer velocity
    uniform float uTime;
    uniform float uHover;   // eased 0..1

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      float a = hash(i), b = hash(i + vec2(1.0,0.0));
      float c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }
      return v;
    }

    void main(){
      vec2 uv = vUv;
      float ar = uRes.x / uRes.y;
      vec2 aspect = vec2(ar, 1.0);

      /* --- fingers-through-water ripple from the pointer --- */
      vec2 diff = (uv - uMouse) * aspect;
      float d = length(diff);
      float falloff = exp(-d * 6.0);
      float ripple = sin(d * 34.0 - uTime * 4.0) * falloff;
      vec2 rippleDisp = normalize(diff + 1e-5) * ripple * 0.020 * (0.6 + uHover);
      rippleDisp += uVel * falloff * 3.0;                 // drag wake

      /* --- ambient flowing current (domain warp) --- */
      vec2 p = uv * vec2(3.0, 2.2);
      float t = uTime * 0.08;
      vec2 warp = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
      vec2 flow = (warp - 0.5) * 0.06;

      vec2 cuv = uv + flow + rippleDisp;

      /* --- vertical gradient: deep-navy (top) -> sky-blue (bottom) --- */
      /* vUv.y is 0 at the bottom, 1 at the top; gx large = dark. So drive
         gx off cuv.y directly => dark at the top, lightening downward. */
      float gx = cuv.y + (warp.x - 0.5) * 0.12;
      vec3 sky  = mix(vec3(0.00, 0.61, 1.00), vec3(0.07, 0.15, 0.71), smoothstep(0.0, 0.5, gx));
      vec3 dark = vec3(0.015, 0.031, 0.110);
      vec3 navy = vec3(0.031, 0.102, 0.369);
      vec3 col  = mix(sky, dark, smoothstep(0.12, 0.60, gx));
      col = mix(col, navy, smoothstep(0.58, 1.0, gx));

      float glow = smoothstep(0.72, 0.0, gx);            // blue bloom from the left
      col += vec3(0.0, 0.36, 0.7) * glow * 0.45;

      /* --- topographic contour lines that ripple --- */
      float field = fbm(cuv * vec2(6.0, 5.0) + flow * 4.0 + vec2(0.0, t * 2.0));
      float lines = abs(fract(field * 7.0) - 0.5);
      float contour = smoothstep(0.055, 0.0, lines);
      col += contour * (0.10 + glow * 0.10);

      /* ripple crest highlight (catches light like water) */
      col += ripple * 0.05 * (0.5 + uHover) * vec3(0.4, 0.7, 1.0);

      /* subtle vignette for depth */
      float vig = smoothstep(1.25, 0.30, length((uv - 0.5) * aspect));
      col *= 0.82 + 0.18 * vig;

      gl_FragColor = vec4(col, 1.0);
    }`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {
    res:   gl.getUniformLocation(prog, "uRes"),
    mouse: gl.getUniformLocation(prog, "uMouse"),
    vel:   gl.getUniformLocation(prog, "uVel"),
    time:  gl.getUniformLocation(prog, "uTime"),
    hover: gl.getUniformLocation(prog, "uHover"),
  };

  const state = { mx: 0.5, my: 0.5, smx: 0.5, smy: 0.5, vx: 0, vy: 0, hover: 0, hoverTarget: 0 };

  const setPointer = (x, y) => {
    const r = canvas.getBoundingClientRect();
    state.mx = (x - r.left) / r.width;
    state.my = 1.0 - (y - r.top) / r.height;
    state.hoverTarget = 1;
  };
  window.addEventListener("mousemove", (e) => setPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener("mouseout", () => { state.hoverTarget = 0; });
  window.addEventListener("touchmove", (e) => { if (e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  window.addEventListener("touchend", () => { state.hoverTarget = 0; });

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener("resize", resize);
  resize();

  // The canvas is fixed full-viewport behind every section, but once the
  // user has scrolled past the hero it's fully covered by opaque section
  // backgrounds — keep rendering it forever just burns GPU/battery for
  // nothing. Pause the loop there (and whenever the tab is hidden), and
  // resume instantly when it's actually back in view.
  let running = false;
  let rafId = null;
  let t0 = null;

  // Track whether the hero (the only place the canvas is actually visible) is
  // on screen. An IntersectionObserver is the reliable signal: it also covers
  // route switches, where scrollY resets to 0 but the hero is hidden — the old
  // scrollY-only check left the loop running behind opaque pages.
  let heroVisible = true;
  const hero = document.querySelector(".hero");
  if (hero && "IntersectionObserver" in window) {
    heroVisible = false;
    const io = new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
      sync();
    }, { threshold: 0 });
    io.observe(hero);
  }

  function isInView() {
    if (document.hidden) return false;
    // Hero must be both on-screen (observer) and near the top of the scroll.
    return heroVisible && window.scrollY < window.innerHeight * 1.15;
  }

  function frame(now) {
    if (t0 === null) t0 = now;
    const time = (now - t0) / 1000;

    const px = state.smx, py = state.smy;
    state.smx += (state.mx - state.smx) * 0.12;
    state.smy += (state.my - state.smy) * 0.12;
    state.vx = (state.smx - px) * 0.9;
    state.vy = (state.smy - py) * 0.9;
    state.hover += (state.hoverTarget - state.hover) * 0.06;

    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform2f(U.mouse, state.smx, state.smy);
    gl.uniform2f(U.vel, state.vx, state.vy);
    gl.uniform1f(U.time, time);
    gl.uniform1f(U.hover, state.hover);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (isInView()) {
      rafId = requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  function start() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  function sync() {
    if (isInView()) start(); else stop();
  }

  window.addEventListener("scroll", sync, { passive: true });
  document.addEventListener("visibilitychange", sync);
  sync();
})();
