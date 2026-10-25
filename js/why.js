/* WLM Digital — why: masked word reveal of the heading, a spine line that draws with
   scroll (scrubbed, never pinned) lighting each node, panels rising in, shard parallax.
   Everything below runs only when reduced motion is NOT requested; otherwise the
   section stays fully visible and static. Hidden states are set from here only. */
(function () {
  'use strict';
  var section = document.getElementById('why');
  if (!section) return;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  if (!gsap || !ST) return;
  var $ = function (s, c) { return (c || section).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || section).querySelectorAll(s)); };

  var wrapWords = function (node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
          var wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = part;
          w.appendChild(wi); frag.appendChild(w);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1) wrapWords(n);
    });
  };

  var mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    /* ---- Heading: masked words rise (aria-label keeps the full text for readers) ---- */
    var title = $('.why__title'), html = title.innerHTML, label = title.textContent.replace(/\s+/g, ' ').trim();
    title.setAttribute('aria-label', label);
    wrapWords(title);
    var words = $$('.wi', title);
    gsap.set(words, { yPercent: 118 });
    ST.create({
      trigger: title, start: 'top 82%', once: true,
      onEnter: function () { gsap.to(words, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06 }); }
    });

    /* ---- Spine: draws with scroll; each node lights as the line reaches it ---- */
    var flow = $('.why__flow'), fill = $('.why__spine-fill'), tip = $('.why__tip'), items = $$('.why__item');
    var th = [], H = 1;
    var measure = function () {
      var fr = flow.getBoundingClientRect(); H = fr.height || 1;
      th = items.map(function (it) { var r = $('.why__node', it).getBoundingClientRect(); return r.top + r.height / 2 - fr.top; });
    };
    var paint = function (p) {
      var y = p * H;
      gsap.set(tip, { y: y, opacity: p > 0.004 && p < 0.996 ? 1 : 0 });
      items.forEach(function (it, i) { it.classList.toggle('is-dim', y < th[i] - 2); });
    };
    items.forEach(function (it) { it.classList.add('is-dim'); });
    gsap.set(tip, { opacity: 0 });
    gsap.fromTo(fill, { strokeDashoffset: 1 }, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: {
        trigger: flow, start: 'top 68%', end: 'bottom 60%', scrub: 0.5,
        onRefresh: function (self) { measure(); paint(self.progress); },
        onUpdate: function (self) { paint(self.progress); }
      }
    });

    /* ---- Panels: staggered clip-path rise, plate and branch follow ---- */
    items.forEach(function (it) {
      var panel = $('.why__panel', it), plate = $('.why__plate', it), branch = $('.why__branch', it);
      gsap.set(panel, { opacity: 0, y: 56, clipPath: 'inset(20% 0% 0% 0% round 24px)' });
      gsap.set(plate, { opacity: 0, scale: 0.94 });
      gsap.set(branch, { scaleX: 0 });
      ST.create({
        trigger: it, start: 'top 86%', once: true,
        onEnter: function () {
          gsap.timeline()
            .to(plate, { opacity: 1, scale: 1, duration: 1, ease: 'power3.out', clearProps: 'transform,opacity' }, 0)
            .to(panel, { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1, ease: 'power3.out', clearProps: 'clipPath,transform,opacity' }, 0.08)
            .to(branch, { scaleX: 1, duration: 0.7, ease: 'power3.out' }, 0.3);
        }
      });
    });

    /* ---- CTA ---- */
    var cta = $('.why__cta');
    gsap.set(cta, { opacity: 0, y: 32 });
    ST.create({ trigger: cta, start: 'top 92%', once: true, onEnter: function () { gsap.to(cta, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', clearProps: 'transform,opacity' }); } });

    /* ---- Shards: slight parallax ---- */
    $$('.shard').forEach(function (el) {
      var s = (parseFloat(el.getAttribute('data-speed')) || 10) * 1.6;
      gsap.fromTo(el, { yPercent: -s }, { yPercent: s, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    return function () { title.innerHTML = html; title.removeAttribute('aria-label'); items.forEach(function (it) { it.classList.remove('is-dim'); }); };
  });
})();
