/* WLM Digital — shared site behaviour: header state, mobile menu, active nav, year.
   Section scripts (hero.js, services.js, ...) can rely on window.WLM. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var WLM = window.WLM = {
    reduced: function () { return reduceMQ.matches; },
    finePointer: window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    hasGSAP: typeof window.gsap !== 'undefined'
  };
  if (WLM.hasGSAP) {
    var plugins = [window.ScrollTrigger, window.SplitText].filter(Boolean);
    if (plugins.length) gsap.registerPlugin.apply(gsap, plugins);
    gsap.defaults({ ease: 'power3.out', duration: 0.8 });
  }

  /* Year */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Header: glass once scrolled */
  var header = document.getElementById('site-header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  var toggle = header.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  var setMenu = function (open, returnFocus) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (open) { var first = menu.querySelector('a'); if (first) setTimeout(function () { first.focus(); }, 60); }
    else if (returnFocus) toggle.focus();
  };
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (!menu.classList.contains('is-open')) return;
    if (e.key === 'Escape') { setMenu(false, true); return; }
    if (e.key === 'Tab') { /* keep focus inside toggle + menu */
      var items = [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll('a')));
      var i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  /* Active nav link */
  var links = document.querySelectorAll('.nav a[href^="#"]');
  if ('IntersectionObserver' in window && links.length) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var a = byId[en.target.id]; if (a) a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }
})();
