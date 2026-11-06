/* WLM Digital — hero: opening sequence (<1.2 s, CTA usable at once), wordmark light
   sweep, pointer parallax (fine pointers only), scroll-out parallax and particles. */
(function () {
  'use strict';
  var hero = document.querySelector('.hero');
  if (!hero) return;
  var root = document.documentElement;
  var WLM = window.WLM || { reduced: function () { return false; }, finePointer: false, hasGSAP: false };
  var reduced = WLM.reduced();

  /* Split the headline into masked words (kept accessible: the h1 text is unchanged for readers) */
  var title = hero.querySelector('.hero__title');
  var wrapWords = function (node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'w';
          var wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = part;
          w.appendChild(wi); frag.appendChild(w);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1) wrapWords(n);
    });
  };
  if (title) { title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim()); wrapWords(title); }
  if (title) title.querySelectorAll('.w').forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });

  var gsap = window.gsap;
  if (!gsap || reduced) { root.classList.add('hero-ready'); drawParticles(true); return; }

  var q = function (s) { return hero.querySelector(s); };
  var scene = q('.hero__scene'), land = q('.hero__land'), landBox = q('.hero__land-box'),
      aurora = q('.hero__aurora'), canvas = q('.hero__particles'), glow = q('.hero__glow'),
      content = q('.hero__content'), facets = hero.querySelectorAll('.wm-facets polygon'),
      shade = q('.wm-shade'), sub = q('.wordmark__sub'), sweep = document.getElementById('wlm-sweep');

  /* ---- Opening sequence ---- */
  var parts = hero.querySelectorAll('[data-hero]');
  gsap.set([scene].concat(Array.prototype.slice.call(parts)), { opacity: 1 });
  gsap.set(scene, { opacity: 0 });
  gsap.set(aurora, { opacity: 0 });
  gsap.set(facets, { opacity: 0, y: function (i) { return i % 2 ? 26 : -26; }, transformOrigin: '50% 50%' });
  gsap.set(shade, { opacity: 0 });
  gsap.set(sub, { opacity: 0, letterSpacing: '1.7em', marginRight: '-1.7em' });
  gsap.set(title.querySelectorAll('.wi'), { yPercent: 110 });
  gsap.set(['[data-hero="pillars"]', '[data-hero="lead"]', '[data-hero="ctas"]'].map(q), { opacity: 0, y: 16 });
  root.classList.add('hero-ready');

  var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to(scene, { opacity: 1, duration: 1.1, ease: 'power2.out' }, 0)
    .fromTo(landBox, { scale: 1.06 }, { scale: 1, duration: 2.2, ease: 'power2.out' }, 0)
    .to(aurora, { opacity: 1, duration: 1.6, ease: 'power1.inOut' }, 0.15)
    .to(facets, { opacity: 1, y: 0, duration: 0.9, stagger: { each: 0.045, from: 'center' } }, 0.2)
    .to(shade, { opacity: 0.3, duration: 0.6, ease: 'power2.out' }, 0.6)
    .to(sub, { opacity: 1, letterSpacing: '1em', marginRight: '-1em', duration: 1.1 }, 0.45)
    .to(title.querySelectorAll('.wi'), { yPercent: 0, duration: 0.85, stagger: 0.035 }, 0.3)
    .to(q('[data-hero="pillars"]'), { opacity: 1, y: 0, duration: 0.6 }, 0.5)
    .to([q('[data-hero="lead"]'), q('[data-hero="ctas"]')], { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 }, 0.4);

  /* Light sweep across the wordmark: once after the reveal, then every few seconds */
  if (sweep) {
    gsap.fromTo(sweep, { attr: { x1: -160, x2: -40 } }, { attr: { x1: 440, x2: 560 }, duration: 1.3, ease: 'power2.inOut', delay: 1.0, repeat: -1, repeatDelay: 7 });
  }

  /* ---- Scroll-out parallax (scrubbed, never pinned) ---- */
  if (window.ScrollTrigger) {
    gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } })
      .to(land, { yPercent: 14, ease: 'none' }, 0)
      .to(aurora, { yPercent: 22, opacity: 0.4, ease: 'none' }, 0)
      .to(content, { y: -70, opacity: 0, ease: 'power1.in' }, 0);
  }

  /* ---- Pointer depth + cursor light (mouse/trackpad only; touch stays still) ---- */
  if (WLM.finePointer) {
    var landX = gsap.quickTo(landBox, 'x', { duration: 1.2, ease: 'power3.out' }),
        landY = gsap.quickTo(landBox, 'y', { duration: 1.2, ease: 'power3.out' }),
        partX = gsap.quickTo(canvas, 'x', { duration: 1, ease: 'power3.out' }),
        partY = gsap.quickTo(canvas, 'y', { duration: 1, ease: 'power3.out' }),
        glowX = gsap.quickTo(glow, 'x', { duration: 0.9, ease: 'power3.out' }),
        glowY = gsap.quickTo(glow, 'y', { duration: 0.9, ease: 'power3.out' });
    gsap.set(glow, { xPercent: -50, yPercent: -50 });
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      landX(nx * -14); landY(ny * -6); partX(nx * -32); partY(ny * -20);
      glowX(e.clientX - r.left); glowY(e.clientY - r.top);
      gsap.to(glow, { opacity: 1, duration: 0.6, overwrite: 'auto' });
    });
    hero.addEventListener('pointerleave', function () { gsap.to(glow, { opacity: 0, duration: 0.8 }); landX(0); landY(0); partX(0); partY(0); });
  }

  drawParticles(false);

  /* ---- Particles: a few dozen drifting specks; paused off-screen / hidden tab ---- */
  function drawParticles(still) {
    var cv = hero.querySelector('.hero__particles');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = 0, h = 0, dots = [], raf = 0, visible = true;
    var colors = ['46,230,166', '139,92,246', '210,235,255', '94,231,240'];
    var size = function () {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = w < 600 ? 26 : 56;
      dots = [];
      for (var i = 0; i < n; i++) dots.push({ x: Math.random() * w, y: Math.random() * h * 0.8, r: 0.5 + Math.random() * 1.2, vy: 0.04 + Math.random() * 0.12, vx: (Math.random() - 0.5) * 0.06, a: 0.15 + Math.random() * 0.5, t: Math.random() * 6.28, c: colors[i % colors.length] });
    };
    var frame = function () {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        if (!still) { d.y -= d.vy; d.x += d.vx; d.t += 0.02; if (d.y < -4) { d.y = h * 0.85; d.x = Math.random() * w; } }
        ctx.globalAlpha = d.a * (0.65 + 0.35 * Math.sin(d.t));
        ctx.fillStyle = 'rgb(' + d.c + ')';
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
      }
      if (!still && visible && !document.hidden) raf = requestAnimationFrame(frame); else raf = 0;
    };
    var start = function () { if (!raf && !still) raf = requestAnimationFrame(frame); };
    size(); frame();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { size(); if (still) frame(); }, 150); });
    if (still) return;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(hero);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
  }
})();
