/* WLM Digital — services: six diagrams (each plays once when its card enters view),
   staggered card rise, scrubbed light line from the hero, pointer light + tiny tilt
   (fine pointers only) and the working "add to cart" demo. Hidden states are set from
   here only; reduced motion or no GSAP leaves everything visible and static. */
(function () {
  'use strict';
  var section = document.getElementById('services');
  if (!section) return;
  var WLM = window.WLM || { reduced: function () { return false; }, finePointer: false, hasGSAP: false };
  var $ = function (s, c) { return (c || section).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || section).querySelectorAll(s)); };
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var canAnimate = !!(gsap && ST);

  /* ---------- Add-to-cart demo (works without GSAP) ---------- */
  (function () {
    var shop = $('.shop'); if (!shop) return;
    var btn = $('.shop__btn', shop), cart = $('.shop__cart', shop), count = $('.shop__count', shop),
        dot = $('.shop__dot', shop), status = $('[data-shop-status]'), n = 0, timer;
    btn.addEventListener('click', function () {
      n = n % 9 + 1;
      count.textContent = n;
      shop.classList.add('has-items', 'is-added');
      if (status) status.textContent = 'Added to cart. This is a demo. Items in cart: ' + n + '.';
      clearTimeout(timer);
      timer = setTimeout(function () { shop.classList.remove('is-added'); }, 1900);
      if (canAnimate && !WLM.reduced()) {
        var s = shop.getBoundingClientRect(), b = btn.getBoundingClientRect(), c = cart.getBoundingClientRect();
        var x0 = b.left + b.width / 2 - s.left - 5, y0 = b.top + b.height / 2 - s.top - 5;
        var x1 = c.left + c.width / 2 - s.left - 5, y1 = c.top + c.height / 2 - s.top - 5;
        gsap.killTweensOf(dot);
        gsap.fromTo(dot, { x: x0, y: y0, opacity: 1, scale: 1 },
          { x: x1, y: y1, scale: 0.4, duration: 0.75, ease: 'power3.inOut' });
        gsap.to(dot, { opacity: 0, duration: 0.2, delay: 0.6 });
        gsap.fromTo(cart, { scale: 1 }, { scale: 1.12, duration: 0.18, delay: 0.7, yoyo: true, repeat: 1, ease: 'power2.out', clearProps: 'transform' });
      }
    });
  })();

  /* ---------- Pointer light + very subtle tilt (fine pointer only) ---------- */
  if (WLM.finePointer) {
    $$('.svc').forEach(function (li) {
      var card = $('.svc__card', li), raf = 0, ev;
      var paint = function () {
        raf = 0;
        var r = li.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
        card.style.setProperty('--lx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--ly', (py * 100).toFixed(1) + '%');
        if (!WLM.reduced()) {
          card.style.setProperty('--ry', ((px - 0.5) * 5).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - py) * 4).toFixed(2) + 'deg');
        }
      };
      li.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; ev = e; if (!raf) raf = requestAnimationFrame(paint); });
      li.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
      });
    });
  }

  if (!canAnimate) return;

  /* ---------- Diagram timelines (each starts from its finished markup state) ---------- */
  var draw = function (tl, els, pos, dur, st) {
    tl.fromTo(els, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dur || 0.8, ease: 'power3.out', stagger: st || 0.05 }, pos);
  };
  var builders = {
    /* 1 blueprint draws itself */
    blueprint: function (v) {
      var q = function (s) { return $$(s, v); };
      var tl = gsap.timeline({ paused: true });
      draw(tl, q('.dim'), 0, 0.8, 0.12);
      draw(tl, q('.frame'), 0.1, 1.1);
      draw(tl, q('.d:not(.dim):not(.frame)'), 0.5, 0.8, 0.05);
      tl.fromTo(q('.f'), { opacity: 0 }, { opacity: 1, duration: 0.7, stagger: 0.06, ease: 'power2.out' }, 1.5);
      return { tl: tl, replay: true };
    },
    /* 2 cluttered layout resolves into a clean one */
    redesign: function (v) {
      var q = function (s) { return $$(s, v); };
      var m = function (i) { return function (n, el) { return +el.getAttribute('data-m').split(',')[i]; }; };
      var tl = gsap.timeline({ paused: true });
      tl.fromTo(q('.blk'), { x: m(0), y: m(1), rotation: m(2), scale: m(3), transformOrigin: '50% 50%' },
        { x: 0, y: 0, rotation: 0, scale: 1, transformOrigin: '50% 50%', duration: 1.2, ease: 'power3.out', stagger: 0.06 }, 0.75);
      tl.fromTo(q('.junk > *'), { opacity: 0.9, scale: 1, transformOrigin: '50% 50%' },
        { opacity: 0, scale: 0.7, duration: 0.7, ease: 'power2.out', stagger: 0.05 }, 0.7);
      return { tl: tl, replay: true };
    },
    /* 3 one layout reflows desktop -> tablet -> phone -> desktop */
    responsive: function (v) {
      var S = {
        desk: { frame: [40, 28, 240, 140], bar: [50, 38, 220, 10], hero: [50, 54, 220, 44], c1: [50, 106, 70, 52], c2: [125, 106, 70, 52], c3: [200, 106, 70, 52] },
        tab: { frame: [85, 20, 150, 160], bar: [94, 28, 132, 9], hero: [94, 42, 132, 38], c1: [94, 86, 64, 38], c2: [162, 86, 64, 38], c3: [94, 128, 132, 44] },
        ph: { frame: [128, 10, 64, 180], bar: [134, 16, 52, 8], hero: [134, 28, 52, 36], c1: [134, 68, 52, 36], c2: [134, 108, 52, 36], c3: [134, 148, 52, 36] }
      };
      var keys = Object.keys(S.desk), els = {}, pips = $$('.pip', v);
      keys.forEach(function (k) { els[k] = $('[data-r="' + k + '"]', v); });
      var tl = gsap.timeline({ paused: true });
      var go = function (st, t, pip) {
        keys.forEach(function (k) {
          var a = S[st][k];
          tl.to(els[k], { attr: { x: a[0], y: a[1], width: a[2], height: a[3] }, duration: 0.9, ease: 'power3.inOut' }, t);
        });
        tl.to(pips, { opacity: function (i) { return i === pip ? 1 : 0.28; }, duration: 0.4, ease: 'none' }, t);
      };
      go('tab', 0.9, 1); go('ph', 2.3, 2); go('desk', 3.9, 0);
      return { tl: tl, replay: true };
    },
    /* 4 calm heartbeat: ticks appear, then a gentle pulse loops while on screen */
    care: function (v) {
      var q = function (s) { return $$(s, v); };
      var ecg = q('.ecg')[0], head = q('.head')[0], ring = q('.ring')[0];
      var len = ecg.getTotalLength(), proxy = { p: 0 };
      gsap.set(ecg, { strokeDashoffset: 1 });
      var visible = false, started = false;
      var beat = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.4 });
      beat.set(ecg, { opacity: 1 }, 0)
        .fromTo(proxy, { p: 0 }, {
          p: 1, duration: 2, ease: 'power1.inOut',
          onUpdate: function () {
            ecg.style.strokeDashoffset = 1 - proxy.p;
            var pt = ecg.getPointAtLength(proxy.p * len);
            gsap.set(head, { x: pt.x, y: pt.y, opacity: proxy.p > 0.01 && proxy.p < 0.99 ? 1 : 0 });
          }
        }, 0)
        .fromTo(ring, { scale: 1, opacity: 0.6 }, { scale: 2.2, opacity: 0, duration: 1.3, ease: 'power2.out' }, 0.8)
        .to(ecg, { opacity: 0.18, duration: 0.7, ease: 'power1.in' }, 2.1);
      var tl = gsap.timeline({ paused: true });
      draw(tl, q('.badge'), 0, 0.8);
      draw(tl, q('.check'), 0.5, 0.6);
      tl.fromTo(q('.task'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.18, ease: 'power3.out' }, 0.9);
      tl.add(function () { started = true; if (visible) beat.play(); }, 1.6);
      ST.create({
        trigger: v, start: 'top bottom', end: 'bottom top',
        onToggle: function (self) { visible = self.isActive; if (!visible) beat.pause(); else if (started) beat.play(); }
      });
      return { tl: tl, replay: false };
    },
    /* 5 gauge sweeps and settles, load lines tidy themselves */
    speed: function (v) {
      var q = function (s) { return $$(s, v); };
      var tl = gsap.timeline({ paused: true });
      tl.fromTo(q('.g-fill'), { strokeDashoffset: 1 }, { strokeDashoffset: 0.18, duration: 1.4, ease: 'power3.out' }, 0.3);
      tl.fromTo(q('.needle'), { rotation: -90, svgOrigin: '92 128' }, { rotation: 66, svgOrigin: '92 128', duration: 1.1, ease: 'power3.out' }, 0.3);
      tl.to(q('.needle'), { rotation: 58, svgOrigin: '92 128', duration: 0.8, ease: 'power2.inOut' }, 1.4);
      var fromX = [222, 200, 236, 208], toW = [96, 70, 52, 34];
      q('.bar').forEach(function (b, i) {
        tl.fromTo(b, { attr: { x: fromX[i], width: 110 }, opacity: 0.35 },
          { attr: { x: 184, width: toW[i] }, opacity: 1, duration: 1.1, ease: 'power3.out' }, 0.5 + i * 0.1);
      });
      draw(tl, q('.done'), 1.7, 0.8);
      return { tl: tl, replay: true };
    },
    /* 6 product tile rises in; the button itself is the interaction */
    shop: function (v) {
      var tl = gsap.timeline({ paused: true });
      tl.fromTo($('.shop__tile', v), { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, 0)
        .fromTo($('.shop__cart', v), { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.25);
      return { tl: tl, replay: false };
    }
  };

  /* ---------- Motion, only when the visitor has not asked for less ---------- */
  var mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    /* Supporting moment: thin light line falls from the hero into the section head */
    var fill = $('.svc-line__fill'), dot = $('.svc-line__dot');
    if (fill && dot) {
      var lt = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: section, start: 'top 92%', end: 'top 34%', scrub: 0.6 } });
      lt.fromTo(fill, { yPercent: -100 }, { yPercent: 0, duration: 1 })
        .fromTo(dot, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2 }, 0.8);
    }

    /* Cards: staggered clip-path + translate rise, each diagram plays as its card lands */
    var items = $$('.svc'), players = [];
    items.forEach(function (li) {
      var viz = $('.svc__viz', li), b = builders[viz && viz.getAttribute('data-viz')];
      var p = b ? b(viz) : null;
      players.push(p);
      if (p && p.replay) {
        var re = function () { if (p.ready && !p.tl.isActive()) p.tl.delay(0).restart(); };
        viz.addEventListener('click', re);
        if (WLM.finePointer) li.addEventListener('pointerenter', re);
        p.tl.eventCallback('onComplete', function () { p.ready = true; });
      }
    });
    gsap.set(items, { opacity: 0, y: 56, clipPath: 'inset(22% 0% 0% 0% round 24px)' });
    ST.batch(items, {
      start: 'top 90%', once: true,
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1, ease: 'power3.out', stagger: 0.07, clearProps: 'clipPath,transform,opacity' });
        batch.forEach(function (li, i) {
          var p = players[items.indexOf(li)];
          if (p) p.tl.delay(0.3 + i * 0.07).play();
        });
      }
    });
  });
})();
