/* WLM Digital: Interactive Playground (#playground)
   Three real demos in one stage: tabs (wipe transition), a viewport toggle, Reset.
   Plain JS + Web Animations; GSAP only eases the 3D product turn. Every loop and
   listener stops when the stage is off screen, the tab is hidden or motion is reduced. */
(function () {
  'use strict';
  var stage = document.getElementById('pg-stage');
  if (!stage) return;

  var WLM = window.WLM || {};
  var reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return typeof WLM.reduced === 'function' ? WLM.reduced() : reducedMQ.matches; };
  var EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var $ = function (sel, root) { return (root || stage).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || stage).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var seg = function (p, a, b) { return p <= a ? 0 : p >= b ? 1 : (p - a) / (b - a); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  var S = { cur: 0, inView: false, docVisible: !document.hidden };
  var demos = [];            // { enter, leave, reset, sync }
  var teardown = [];         // functions run on pagehide
  var liveEl = $('#pg-live');
  var sayTimer = 0;
  function say(msg) {
    if (!liveEl) return;
    liveEl.textContent = '';
    clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { liveEl.textContent = msg; }, 40);
  }
  function syncAll() { demos.forEach(function (d) { if (d.sync) d.sync(); }); }

  /* ------------------------------------------------------------------
     Shared: press-feedback button (ripple + label swap + drawn check)
     ------------------------------------------------------------------ */
  function initCta(btn, onClick) {
    var timer = 0;
    var rip = $('.pg-cta__rip', btn);
    btn.addEventListener('click', function (e) {
      var r = btn.getBoundingClientRect();
      var x = e.detail === 0 ? r.width / 2 : e.clientX - r.left;
      var y = e.detail === 0 ? r.height / 2 : e.clientY - r.top;
      if (rip && rip.animate && !reduced()) {
        rip.style.setProperty('--rx', x + 'px');
        rip.style.setProperty('--ry', y + 'px');
        rip.animate([{ transform: 'scale(0)', opacity: 0.7 }, { transform: 'scale(' + (r.width / 10 + 4) + ')', opacity: 0 }], { duration: 750, easing: EASE });
      }
      btn.classList.add('is-done');
      clearTimeout(timer);
      timer = setTimeout(function () { btn.classList.remove('is-done'); }, 2200);
      if (btn.dataset.say) say(btn.dataset.say);
      if (onClick) onClick(e);
    });
    return function reset() { clearTimeout(timer); btn.classList.remove('is-done'); };
  }

  /* ------------------------------------------------------------------
     DEMO 1: business website
     ------------------------------------------------------------------ */
  function initSite() {
    var root = $('#pg-site');
    var light = $('.site__light', root);
    var spot = $('.site__spot', root);
    var visual = $('.site__visual', root);
    var links = $$('.site__link', root);
    var pages = $$('.site__page', root);
    var ind = $('.site__ind', root);
    var dots = $$('.site__dot', root);
    var page = 'home';
    var cx = 0, cy = 0, tx = 0, ty = 0, raf = 0, litTimer = 0, moved = false;

    pages.forEach(function (p) { if (!p.classList.contains('is-active')) p.inert = true; });

    function paint() {
      spot.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      light.style.setProperty('--mx', cx.toFixed(0) + 'px');
      light.style.setProperty('--my', cy.toFixed(0) + 'px');
    }
    function loop() {
      raf = 0;
      var k = reduced() ? 1 : 0.18;
      cx += (tx - cx) * k; cy += (ty - cy) * k;
      if (Math.abs(tx - cx) < 0.4 && Math.abs(ty - cy) < 0.4) { cx = tx; cy = ty; paint(); return; }
      paint();
      raf = requestAnimationFrame(loop);
    }
    function aim(x, y, jump) {
      tx = x; ty = y;
      if (jump) { cx = x; cy = y; paint(); return; }
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function home() { aim(root.clientWidth * 0.5, root.clientHeight * 0.38, true); setTilt(0, 0); }
    function setTilt(px, py) {
      if (!visual) return;
      visual.style.setProperty('--px', px.toFixed(2));
      visual.style.setProperty('--py', py.toFixed(2));
    }
    function point(e) {
      var r = root.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      moved = true;
      aim(x, y, false);
      setTilt(clamp(x / r.width * 2 - 1, -1, 1), clamp(y / r.height * 2 - 1, -1, 1));
    }
    root.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') root.classList.add('is-lit'); });
    root.addEventListener('pointermove', function (e) { clearTimeout(litTimer); root.classList.add('is-lit'); point(e); });
    root.addEventListener('pointerdown', function (e) { clearTimeout(litTimer); root.classList.add('is-lit'); point(e); });
    root.addEventListener('pointerleave', function () { root.classList.remove('is-lit'); setTilt(0, 0); });
    function touchEnd(e) { if (e.pointerType === 'touch') { clearTimeout(litTimer); litTimer = setTimeout(function () { root.classList.remove('is-lit'); setTilt(0, 0); }, 1200); } }
    root.addEventListener('pointerup', touchEnd);
    root.addEventListener('pointercancel', touchEnd);

    /* Mini nav: pages + sliding underline */
    function placeInd() {
      var a = links.filter(function (l) { return l.dataset.page === page; })[0];
      if (!a || !a.offsetWidth) return;
      ind.style.setProperty('--ix', (a.offsetLeft + 10) + 'px');
      ind.style.setProperty('--iw', ((a.offsetWidth - 20) / 100).toFixed(3));
    }
    function setPage(name, quiet) {
      page = name;
      links.forEach(function (l) {
        var on = l.dataset.page === name;
        l.classList.toggle('is-active', on);
        if (on) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
      });
      pages.forEach(function (p) { var on = p.dataset.page === name; p.classList.toggle('is-active', on); p.inert = !on; });
      placeInd();
      if (!quiet) say('Showing ' + name + ' page');
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-page]');
      if (b && root.contains(b) && b.dataset.page !== page) setPage(b.dataset.page);
    });

    /* Accent switcher: recolours everything through --pg-a / --pg-b */
    function setAccent(btn, quiet) {
      dots.forEach(function (d) { var on = d === btn; d.classList.toggle('is-on', on); d.setAttribute('aria-pressed', String(on)); });
      root.style.setProperty('--pg-a', btn.dataset.a);
      root.style.setProperty('--pg-b', btn.dataset.b);
      if (!quiet) say(btn.getAttribute('aria-label') + ' applied');
    }
    dots.forEach(function (d) { d.addEventListener('click', function () { setAccent(d); }); });

    var resets = $$('.pg-cta', root).map(function (b) { return initCta(b); });

    var ro = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(function () { placeInd(); if (!moved) home(); });
      ro.observe(root);
      teardown.push(function () { ro.disconnect(); });
    }
    home(); placeInd();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeInd);

    demos[0] = {
      enter: function () { placeInd(); },
      leave: function () {},
      reset: function () {
        setPage('home', true);
        setAccent(dots[0], true);
        resets.forEach(function (r) { r(); });
        var input = $('.site__input', root); if (input) input.value = '';
        moved = false; root.classList.remove('is-lit'); home();
      },
      sync: function () { if (!S.inView && raf) { cancelAnimationFrame(raf); raf = 0; } }
    };
  }

  /* ------------------------------------------------------------------
     DEMO 2: product presentation (CSS 3D prism, lit per face)
     ------------------------------------------------------------------ */
  function initProduct() {
    var root = $('#pg-prod');
    var view = $('.prod__view', root);
    var obj = $('.prod__obj', root);
    var faces = $$('.prod__face', root);
    var dots = $$('.prod__dot', root);
    var finLabel = $('.prod__fin', root);
    var badge = $('.prod__badge', root);
    var cart = $('.prod__cart', root);
    var addBtn = $('.prod__add', root);
    var OFF = -22, LIGHT = -40 * Math.PI / 180;
    var st = { yaw: OFF };
    var tw = null, spin = true, raf = 0, last = 0, drag = null, count = 0;

    function render() {
      obj.style.transform = 'rotateY(' + st.yaw.toFixed(2) + 'deg)';
      for (var i = 0; i < faces.length; i++) {
        var a = (i * 60 + st.yaw) * Math.PI / 180;
        var vis = Math.cos(a);
        if (vis < -0.3) continue;
        var l = Math.max(0, Math.cos(a - LIGHT));
        faces[i].style.setProperty('--sh', (0.66 - 0.62 * l).toFixed(3));
        faces[i].style.setProperty('--hi', (Math.pow(l, 9) * 0.34).toFixed(3));
      }
    }
    var snap = function (y) { return Math.round((y - OFF) / 60) * 60 + OFF; };
    function kill() { if (tw) { tw.kill(); tw = null; } }
    function to(target, dur) {
      kill();
      if (reduced() || !window.gsap) { st.yaw = target; render(); return; }
      tw = window.gsap.to(st, { yaw: target, duration: dur || 0.9, ease: 'power3.out', onUpdate: render, onComplete: function () { tw = null; } });
    }
    function touched() { if (spin) { spin = false; sync(); } root.classList.add('is-touched'); }
    function turn(dir) { touched(); to(snap(st.yaw) + dir * 60, 0.85); }

    $('.prod__rot--l', root).addEventListener('click', function () { turn(-1); });
    $('.prod__rot--r', root).addEventListener('click', function () { turn(1); });
    view.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); turn(1); }
    });

    /* Drag: rotates only on horizontal intent, so vertical swipes still scroll the page */
    view.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.prod__rot') || (e.pointerType === 'mouse' && e.button !== 0)) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: st.yaw, lx: e.clientX, lt: e.timeStamp, v: 0, on: false };
    });
    view.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on) {
        if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          drag.on = true; kill(); touched();
          try { view.setPointerCapture(e.pointerId); } catch (err) {}
          view.classList.add('is-drag');
          drag.x = e.clientX; drag.yaw = st.yaw; dx = 0;
        } else return;
      }
      var dt = e.timeStamp - drag.lt;
      if (dt > 0) drag.v = drag.v * 0.7 + ((e.clientX - drag.lx) * 0.55 / dt) * 0.3;
      drag.lx = e.clientX; drag.lt = e.timeStamp;
      st.yaw = drag.yaw + dx * 0.55;
      render();
    });
    function endDrag(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var d = drag; drag = null;
      view.classList.remove('is-drag');
      if (d.on) to(snap(st.yaw + clamp(d.v, -2, 2) * 200), 1);
      sync();
    }
    view.addEventListener('pointerup', endDrag);
    view.addEventListener('pointercancel', endDrag);

    /* Finishes */
    function setFinish(btn, quiet) {
      dots.forEach(function (d) { var on = d === btn; d.classList.toggle('is-on', on); d.setAttribute('aria-pressed', String(on)); });
      root.style.setProperty('--pf', btn.dataset.f);
      root.style.setProperty('--pfg', btn.dataset.g);
      finLabel.textContent = btn.dataset.name;
      if (!quiet) say(btn.dataset.name + ' finish selected');
    }
    dots.forEach(function (d) { d.addEventListener('click', function () { setFinish(d); }); });

    /* Cart */
    function setCount(n) {
      count = n;
      badge.dataset.count = String(n);
      badge.textContent = n > 99 ? '99+' : String(n);
      cart.setAttribute('aria-label', n ? 'Cart, ' + n + (n === 1 ? ' item' : ' items') : 'Cart, empty');
    }
    var resetAdd = initCta(addBtn, function () {
      setCount(count + 1);
      if (!reduced() && badge.animate) {
        badge.animate([{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 600, easing: EASE });
        var rr = root.getBoundingClientRect(), a = addBtn.getBoundingClientRect(), b = badge.getBoundingClientRect();
        var x1 = a.left + a.width / 2 - rr.left, y1 = a.top + a.height / 2 - rr.top;
        var x2 = b.left + b.width / 2 - rr.left, y2 = b.top + b.height / 2 - rr.top;
        var dot = document.createElement('i');
        dot.className = 'prod__fly';
        root.appendChild(dot);
        var an = dot.animate([
          { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(1)', opacity: 1 },
          { transform: 'translate(' + (x1 + x2) / 2 + 'px,' + (Math.min(y1, y2) - 36) + 'px) scale(0.8)', opacity: 1, offset: 0.5 },
          { transform: 'translate(' + x2 + 'px,' + y2 + 'px) scale(0.3)', opacity: 0.2 }
        ], { duration: 650, easing: EASE });
        an.onfinish = an.oncancel = function () { dot.remove(); };
      }
      var name = finLabel.textContent;
      say('Added ' + name + ' to cart. ' + count + (count === 1 ? ' item' : ' items') + ' in cart.');
    });

    /* Idle spin: only while visible, on this demo, and before the visitor touches it */
    function shouldSpin() { return spin && !reduced() && S.inView && S.docVisible && S.cur === 1 && !drag && !tw; }
    function tick(t) {
      raf = 0;
      if (!shouldSpin()) return;
      var dt = Math.min(0.05, (t - last) / 1000); last = t;
      st.yaw += dt * 9; render();
      raf = requestAnimationFrame(tick);
    }
    function sync() {
      if (shouldSpin()) { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }
    teardown.push(function () { if (raf) cancelAnimationFrame(raf); kill(); });

    render();
    demos[1] = {
      enter: function () { sync(); },
      leave: function () { sync(); },
      reset: function () {
        kill(); drag = null; view.classList.remove('is-drag', 'is-drag');
        st.yaw = OFF; render();
        setFinish(dots[0], true); setCount(0); resetAdd();
        root.classList.remove('is-touched'); spin = true; sync();
      },
      sync: sync
    };
  }

  /* ------------------------------------------------------------------
     DEMO 3: interactive landing page (scroll story inside its own scroller)
     ------------------------------------------------------------------ */
  function initStory() {
    var sc = $('#pg-story');
    var media = $('.story__media', sc), shade = $('.story__shade', sc);
    var ch1 = $('.story__ch--1', sc), ch2 = $('.story__ch--2', sc), ch3 = $('.story__ch--3', sc);
    var type = $('.story__type', sc), fill = $('.story__fill', sc);
    var lineSpans = $$('.story__line > span', sc);
    var rail = $('.story__rail i', sc);
    var L0 = $('.story__l0', sc), L1 = $('.story__l1', sc), L2 = $('.story__l2', sc);
    var replay = $('.story__replay', sc);
    var raf = 0, waveTimer = 0, centers = [], chars = [], ch1Op = 1;

    /* split the headline into word + letter spans (screen readers keep aria-label) */
    var text = type.getAttribute('data-text') || type.textContent;
    type.textContent = '';
    var idx = 0;
    text.split(' ').forEach(function (w, wi, arr) {
      var word = document.createElement('span');
      word.className = 'story__word';
      word.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < w.length; i++) {
        var c = document.createElement('span');
        c.className = 'story__char';
        c.style.setProperty('--i', idx++);
        c.textContent = w.charAt(i);
        word.appendChild(c); chars.push(c);
      }
      type.appendChild(word);
      if (wi < arr.length - 1) type.appendChild(document.createTextNode(' '));
    });

    function measure() {
      centers = chars.map(function (c) {
        var el = c, x = c.offsetWidth / 2, y = c.offsetHeight / 2;
        while (el && el !== ch1) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
        return { x: x, y: y };
      });
    }

    function update() {
      raf = 0;
      var max = sc.scrollHeight - sc.clientHeight;
      var p = max > 0 ? clamp(sc.scrollTop / max, 0, 1) : 0;

      var m = easeOut(seg(p, 0.06, 0.46));
      media.style.clipPath = 'circle(' + (125 * m).toFixed(1) + '% at 50% ' + (80 - 28 * m).toFixed(1) + '%)';
      media.style.transform = 'scale(' + (1 + 0.1 * p).toFixed(3) + ')';
      media.style.opacity = (1 - 0.6 * seg(p, 0.72, 0.9)).toFixed(3);
      L0.style.transform = 'translateY(' + (p * 46).toFixed(1) + 'px)';
      L1.style.transform = 'translateY(' + (-p * 38).toFixed(1) + 'px)';
      L2.style.transform = 'translateY(' + (-p * 84).toFixed(1) + 'px)';
      shade.style.opacity = seg(p, 0.3, 0.5).toFixed(3);

      var o1 = 1 - seg(p, 0.1, 0.28);
      ch1Op = o1;
      ch1.style.opacity = o1.toFixed(3);
      ch1.style.transform = 'translateY(' + (-36 * (1 - o1)).toFixed(1) + 'px)';
      ch1.style.pointerEvents = o1 < 0.05 ? 'none' : '';

      var o2 = seg(p, 0.27, 0.3) * (1 - seg(p, 0.66, 0.78));
      ch2.style.opacity = o2.toFixed(3);
      ch2.style.transform = 'translateY(' + (-30 * seg(p, 0.66, 0.78)).toFixed(1) + 'px)';
      lineSpans.forEach(function (s, i) {
        var t = easeOut(seg(p, 0.31 + 0.05 * i, 0.43 + 0.05 * i));
        s.style.transform = 'translateY(' + ((1 - t) * 112).toFixed(1) + '%)';
      });

      var o3 = seg(p, 0.78, 0.86);
      ch3.style.opacity = o3.toFixed(3);
      ch3.style.transform = 'translateY(' + ((1 - o3) * 22).toFixed(1) + 'px)';
      ch3.classList.toggle('is-on', o3 > 0.6);
      fill.style.setProperty('--w', (-14 + 114 * seg(p, 0.8, 0.96)).toFixed(1) + '%');
      rail.style.transform = 'scaleY(' + p.toFixed(3) + ')';
    }
    function queue() { if (!raf) raf = requestAnimationFrame(update); }
    sc.addEventListener('scroll', queue, { passive: true });

    /* Letters lift and glow toward the pointer / finger */
    var lastS = [];
    function react(e) {
      if (ch1Op < 0.3 || !centers.length) return;
      var r = ch1.getBoundingClientRect();
      var px = e.clientX - r.left, py = e.clientY - r.top;
      var R = Math.max(80, Math.min(140, sc.clientWidth * 0.16));
      for (var i = 0; i < chars.length; i++) {
        var dx = centers[i].x - px, dy = centers[i].y - py;
        var s = Math.pow(Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / R), 2);
        if (Math.abs(s - (lastS[i] || 0)) > 0.015) { lastS[i] = s; chars[i].style.setProperty('--s', s.toFixed(3)); }
      }
    }
    function calm() { lastS = []; chars.forEach(function (c) { c.style.setProperty('--s', '0'); }); }
    sc.addEventListener('pointermove', react);
    sc.addEventListener('pointerdown', react);
    sc.addEventListener('pointerleave', calm);
    sc.addEventListener('pointerup', function (e) { if (e.pointerType === 'touch') setTimeout(calm, 350); });
    sc.addEventListener('pointercancel', calm);

    function wave() {
      if (reduced() || sc.scrollTop > 40) return;
      chars.forEach(function (c) { c.classList.remove('is-wave'); });
      void type.offsetWidth;
      chars.forEach(function (c) { c.classList.add('is-wave'); });
      clearTimeout(waveTimer);
      waveTimer = setTimeout(function () { chars.forEach(function (c) { c.classList.remove('is-wave'); }); }, 1900);
    }

    replay.addEventListener('click', function () {
      sc.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
      sc.focus({ preventScroll: true });
      say('Story restarted');
    });

    var ro = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(function () { measure(); queue(); });
      ro.observe(sc); ro.observe(type);
      teardown.push(function () { ro.disconnect(); });
    }
    teardown.push(function () { if (raf) cancelAnimationFrame(raf); clearTimeout(waveTimer); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); });
    measure(); update();

    demos[2] = {
      enter: function () { measure(); update(); setTimeout(wave, 280); },
      leave: function () { calm(); },
      reset: function () { sc.scrollTop = 0; calm(); update(); },
      sync: function () {}
    };
  }

  /* ------------------------------------------------------------------
     Tabs, wipe transition, viewport toggle, reset
     ------------------------------------------------------------------ */
  var tabs = $$('.pg-tab');
  var panels = $$('.pg-panel');
  var wipe = $('.pg-wipe');
  var names = ['Business website', 'Product presentation', 'Interactive landing page'];
  var running = null;

  initSite(); initProduct(); initStory();
  panels.forEach(function (p, i) { if (i) p.inert = true; });

  function finish() {
    if (!running) return;
    running.anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    panels.forEach(function (p) { p.classList.remove('is-leaving', 'is-entering'); });
    running = null;
  }

  function select(i, o) {
    o = o || {};
    if (i === S.cur) { if (o.focus) tabs[i].focus(); return; }
    finish();
    var from = S.cur, dir = i > from ? 1 : -1;
    S.cur = i;
    tabs.forEach(function (t, k) { var on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    var pf = panels[from], pt = panels[i];
    pt.inert = false; pt.classList.add('is-active');
    pf.classList.remove('is-active'); pf.inert = true;
    demos[from].leave(); demos[i].enter();
    if (o.focus) tabs[i].focus();
    if (!o.instant && !reduced() && pt.animate) {
      pf.classList.add('is-leaving'); pt.classList.add('is-entering');
      var opts = { duration: 620, easing: EASE, fill: 'both' };
      var anims = [
        pt.animate([{ clipPath: dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0%)' }], opts),
        pf.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(' + (-dir * 7) + '%)', opacity: 0.35 }], opts)
      ];
      wipe.className = 'pg-wipe ' + (dir > 0 ? 'to-left' : 'to-right');
      anims.push(wipe.animate([
        { transform: 'translateX(' + (dir > 0 ? 100 : -100) + '%)', opacity: 0 },
        { opacity: 1, offset: 0.12 },
        { opacity: 1, offset: 0.8 },
        { transform: 'translateX(0)', opacity: 0 }
      ], { duration: 620, easing: EASE }));
      var token = running = { anims: anims };
      Promise.all(anims.map(function (a) { return a.finished; })).then(function () { if (running === token) finish(); }, function () {});
    }
    if (!o.silent) say('Showing ' + names[i] + ' demo');
    syncAll();
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(i); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = tabs.length, j = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % n;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + n) % n;
      else if (k === 'Home') j = 0;
      else if (k === 'End') j = n - 1;
      if (j < 0) return;
      e.preventDefault();
      select(j, { focus: true });
    });
  });

  var vpBtns = $$('.pg-vp__btn');
  function setVp(v, quiet) {
    stage.dataset.vp = v;
    vpBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.vp === v)); });
    if (!quiet) say('Preview width: ' + v);
  }
  vpBtns.forEach(function (b) { b.addEventListener('click', function () { setVp(b.dataset.vp); }); });

  var resetBtn = $('.pg-reset');
  resetBtn.addEventListener('click', function () {
    demos.forEach(function (d) { d.reset(); });
    setVp('desktop', true);
    select(0, { silent: true });
    resetBtn.classList.remove('is-spin'); void resetBtn.offsetWidth; resetBtn.classList.add('is-spin');
    say('All demos reset');
  });
  resetBtn.addEventListener('transitionend', function () { resetBtn.classList.remove('is-spin'); });

  /* Off-screen and hidden-tab pause */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      S.inView = en[0].isIntersecting;
      stage.classList.toggle('is-off', !S.inView);
      syncAll();
    }, { threshold: 0.05 });
    io.observe(stage);
    teardown.push(function () { io.disconnect(); });
  } else { S.inView = true; }
  var onVis = function () { S.docVisible = !document.hidden; syncAll(); };
  document.addEventListener('visibilitychange', onVis);
  var onMotion = function () { syncAll(); };
  if (reducedMQ.addEventListener) reducedMQ.addEventListener('change', onMotion);
  window.addEventListener('pagehide', function () {
    teardown.forEach(function (f) { f(); });
    document.removeEventListener('visibilitychange', onVis);
    if (reducedMQ.removeEventListener) reducedMQ.removeEventListener('change', onMotion);
  });
})();
