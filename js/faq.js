/* WLM Digital — FAQ accordion.
   Progressive enhancement: the HTML ships with every panel open (aria-expanded="true"),
   this script collapses them and wires mouse / touch / keyboard. */
(function () {
  'use strict';
  var list = document.querySelector('.faq__list');
  if (!list) return;

  var items = Array.prototype.slice.call(list.querySelectorAll('.faq-item'));
  var buttons = items.map(function (it) { return it.querySelector('.faq-q__btn'); });

  function setOpen(item, open) {
    var btn = item.querySelector('.faq-q__btn');
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  }

  /* Collapse everything on load (CSS only collapses once .faq--ready is set) */
  items.forEach(function (it) { setOpen(it, false); });
  list.classList.add('faq--ready');

  list.addEventListener('click', function (e) {
    var btn = e.target.closest('.faq-q__btn');
    if (!btn || !list.contains(btn)) return;
    var item = btn.closest('.faq-item');
    setOpen(item, btn.getAttribute('aria-expanded') !== 'true');
  });

  /* Up / Down / Home / End move between question buttons (Enter / Space are native on <button>) */
  list.addEventListener('keydown', function (e) {
    var i = buttons.indexOf(document.activeElement);
    if (i < 0) return;
    var next = -1;
    if (e.key === 'ArrowDown') next = (i + 1) % buttons.length;
    else if (e.key === 'ArrowUp') next = (i - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    if (next < 0) return;
    e.preventDefault();
    buttons[next].focus();
  });

  /* Deep link: opening the page at #faq-q-3 (or a panel id) opens that question */
  if (location.hash) {
    var target = document.querySelector(location.hash.replace(/[^#\w-]/g, ''));
    var hit = target && target.closest && target.closest('.faq-item');
    if (hit) setOpen(hit, true);
  }

  /* Soft entrance: rows rise in as the list scrolls into view (only with motion allowed).
     IntersectionObserver rather than ScrollTrigger positions: lazy images above can change the
     page height after load, which would leave stale trigger positions and rows stuck hidden. */
  if (window.WLM && WLM.hasGSAP && 'IntersectionObserver' in window) {
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', function () {
      gsap.set(items, { autoAlpha: 0, y: 18 });
      var queue = [], timer = null;
      var flush = function () {
        timer = null;
        var batch = queue; queue = [];
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.07, overwrite: true, clearProps: 'transform,opacity,visibility' });
      };
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.unobserve(en.target); queue.push(en.target);
        });
        if (queue.length && !timer) timer = setTimeout(flush, 60);
      }, { rootMargin: '0px 0px -6% 0px' });
      items.forEach(function (it) { io.observe(it); });
      return function () { io.disconnect(); clearTimeout(timer); gsap.set(items, { clearProps: 'all' }); };
    });
  }
})();
