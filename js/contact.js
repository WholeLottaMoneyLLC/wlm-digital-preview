/* ==========================================================================
   WLM Digital — inquiry form
   --------------------------------------------------------------------------
   INTEGRATION POINT: set FORM_ENDPOINT to connect a real form backend.
     - ''  (empty, current): the form builds a mailto: link and opens the visitor's
       email app with the message ready. Nothing is sent until they press Send.
     - 'https://formspree.io/f/xxxxxxxx' or '/api/contact' (a Cloudflare Pages
       Function): the fields are POSTed as JSON and the real response decides
       whether the visitor sees success or failure.
   Never put secrets (API keys) in this file; see README.md "Inquiry form".
   ========================================================================== */
const FORM_CONFIG = {
  FORM_ENDPOINT: '',               // '' = mailto mode (see above)
  EMAIL: 'hello@wlmdigital.com',   // shown to visitors and used as the mailto recipient
  MIN_MESSAGE: 20,
  MAX_MESSAGE: 2000,
  MAILTO_MAX_LENGTH: 1800          // longer links get cut by some email apps; see openMail()
};

(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var summary = $('form-summary');
  var alertBox = $('form-alert');   // visually hidden role="alert" live region, announces the error count on submit
  var result = $('form-result');
  var submitBtn = $('form-submit');
  var submitLabel = submitBtn.querySelector('.btn__label');
  var note = $('form-note');
  var message = $('f-message');
  var count = $('count-message');
  var endpointMode = !!FORM_CONFIG.FORM_ENDPOINT;

  form.noValidate = true;   // we show our own messages (the HTML attributes still work without JS)

  /* ---- Copy that depends on the mode ---- */
  if (endpointMode) {
    submitLabel.textContent = 'Send inquiry';
    note.textContent = 'We read every message and reply by email.';
  }

  /* ---- Field definitions ---- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var fields = [
    { id: 'name', el: $('f-name'), err: $('err-name'), label: 'Name',
      check: function (v) { return v.trim() ? '' : 'Please tell us your name.'; } },
    { id: 'email', el: $('f-email'), err: $('err-email'), label: 'Email',
      check: function (v) {
        v = v.trim();
        if (!v) return 'Please enter your email address so we can reply.';
        return EMAIL_RE.test(v) ? '' : 'That email address doesn’t look right. It should look like name@example.com.';
      } },
    { id: 'type', el: $('f-type'), err: $('err-type'), label: 'Project type', radio: true,
      check: function () { return form.elements.project_type.value ? '' : 'Please choose New website or Redesign.'; } },
    { id: 'message', el: message, err: $('err-message'), label: 'Project description',
      check: function (v) {
        var n = v.trim().length;
        if (!n) return 'Please describe your project in a few sentences.';
        if (n < FORM_CONFIG.MIN_MESSAGE) return 'Please add a little more detail (at least ' + FORM_CONFIG.MIN_MESSAGE + ' characters, you have ' + n + ').';
        if (v.length > FORM_CONFIG.MAX_MESSAGE) return 'Please keep it under ' + FORM_CONFIG.MAX_MESSAGE + ' characters.';
        return '';
      } }
  ];
  var touched = {};
  var pointerDown = false, pending = [];
  document.addEventListener('pointerdown', function () { pointerDown = true; }, true);
  var pressEnd = function () {
    pointerDown = false;
    setTimeout(function () { var q = pending; pending = []; q.forEach(function (fn) { fn(); }); }, 60);
  };
  document.addEventListener('pointerup', pressEnd, true);
  document.addEventListener('pointercancel', pressEnd, true);

  function valueOf(f) { return f.radio ? form.elements.project_type.value : f.el.value; }
  function focusTarget(f) { return f.radio ? (form.querySelector('input[name="project_type"]:checked') || form.querySelector('input[name="project_type"]')) : f.el; }

  function showError(f, msg) {
    f.err.textContent = msg;
    f.err.hidden = !msg;
    if (msg) f.el.setAttribute('aria-invalid', 'true'); else f.el.removeAttribute('aria-invalid');
    /* aria-describedby already points at the error id; an empty/hidden <p> is ignored by screen readers */
  }
  function validateField(f) { var msg = f.check(valueOf(f)); showError(f, msg); return msg; }

  fields.forEach(function (f) {
    var run = function () { touched[f.id] = true; validateField(f); if (!summary.hidden) refreshSummary(); };
    if (f.radio) f.el.addEventListener('change', run);
    /* Blur while a tap/click is in progress (e.g. tapping Send right after typing) is deferred until the
       press ends: an error line appearing mid-press would shift the button and the tap would miss. */
    else f.el.addEventListener('blur', function () { if (pointerDown) pending.push(run); else run(); });
    /* Refresh the summary while typing, not on blur: a blur-time height change would shift the page under a tap in progress */
    if (!f.radio) f.el.addEventListener('input', function () { if (touched[f.id] || f.el.getAttribute('aria-invalid') === 'true') { validateField(f); if (!summary.hidden) refreshSummary(); } });
  });

  /* ---- Live counter ---- */
  function updateCount() {
    var n = message.value.length;
    count.textContent = n + ' / ' + FORM_CONFIG.MAX_MESSAGE;
    count.classList.toggle('is-near', n >= FORM_CONFIG.MAX_MESSAGE * 0.9 && n < FORM_CONFIG.MAX_MESSAGE);
    count.classList.toggle('is-max', n >= FORM_CONFIG.MAX_MESSAGE);
  }
  message.addEventListener('input', updateCount);
  updateCount();

  /* ---- Error summary (role="alert" live region) ---- */
  function refreshSummary() {
    var bad = fields.filter(function (f) { return f.err.textContent && !f.err.hidden; });
    if (!bad.length) { summary.hidden = true; summary.textContent = ''; return; }
    summary.textContent = '';
    var t = document.createElement('p');
    t.className = 'form-summary__title';
    t.textContent = bad.length === 1 ? 'One thing needs your attention:' : bad.length + ' things need your attention:';
    var ul = document.createElement('ul');
    bad.forEach(function (f) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + (f.radio ? 'f-type' : f.el.id);
      a.textContent = f.label + ': ' + f.err.textContent;
      a.addEventListener('click', function (e) { e.preventDefault(); focusTarget(f).focus(); });
      li.appendChild(a); ul.appendChild(li);
    });
    summary.appendChild(t); summary.appendChild(ul);
    summary.hidden = false;
  }

  /* ---- Build the message ---- */
  function collect() {
    return {
      name: $('f-name').value.trim().replace(/\s+/g, ' '),
      email: $('f-email').value.trim(),
      business: $('f-business').value.trim(),
      project_type: form.elements.project_type.value,
      message: message.value.trim()
    };
  }
  function subjectFor(d) { return 'Project inquiry — ' + d.name; }
  function bodyFor(d) {
    var lines = ['Hi WLM Digital,', '', d.message, '', '—', 'Name: ' + d.name, 'Email: ' + d.email];
    if (d.business) lines.push('Business: ' + d.business);
    lines.push('Project type: ' + d.project_type);
    return lines.join('\r\n');
  }
  function copyText(d) { return 'To: ' + FORM_CONFIG.EMAIL + '\nSubject: ' + subjectFor(d) + '\n\n' + bodyFor(d).replace(/\r\n/g, '\n'); }

  function mailtoUrl(d, body) {
    return 'mailto:' + FORM_CONFIG.EMAIL + '?subject=' + encodeURIComponent(subjectFor(d)) + '&body=' + encodeURIComponent(body);
  }
  /* Returns { url, shortened } and navigates to the mailto link. Very long links are cut by
     some email apps, so we trim the body and tell the visitor to use "Copy message". */
  function openMail(d) {
    var body = bodyFor(d), shortened = false, url = mailtoUrl(d, body);
    if (url.length > FORM_CONFIG.MAILTO_MAX_LENGTH) {
      shortened = true;
      var cut = d.message;
      while (url.length > FORM_CONFIG.MAILTO_MAX_LENGTH && cut.length > 80) {
        cut = cut.slice(0, Math.floor(cut.length * 0.85));
        url = mailtoUrl(d, bodyFor(Object.assign({}, d, { message: cut.trim() + '… (shortened, full text below)' })));
      }
    }
    window.location.href = url;
    return { url: url, shortened: shortened };
  }

  /* ---- Button loading state ---- */
  function setBusy(on) {
    submitBtn.disabled = on;
    if (on) submitBtn.setAttribute('aria-busy', 'true'); else submitBtn.removeAttribute('aria-busy');
    submitLabel.textContent = on ? (endpointMode ? 'Sending…' : 'Opening your email…') : (endpointMode ? 'Send inquiry' : 'Email my inquiry');
  }

  /* ---- Result panel ---- */
  var ICON_OK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_MAIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16v11H4z M4.5 7l7.5 6 7.5-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_ERR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v6M12 16.6v.1" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  var mailLink = '<a href="mailto:' + FORM_CONFIG.EMAIL + '">' + FORM_CONFIG.EMAIL + '</a>';

  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function btn(label, cls, onClick) { var b = el('button', 'btn btn--sm ' + cls); b.type = 'button'; b.textContent = label; b.addEventListener('click', onClick); return b; }

  function showResult(state, d, opts) {
    opts = opts || {};
    result.textContent = '';
    result.setAttribute('data-state', state);
    var icon = el('div', 'form-result__icon', state === 'error' ? ICON_ERR : state === 'sent' ? ICON_OK : ICON_MAIL);
    var title, text;
    if (state === 'mailto') {
      title = 'Your email app should be opening';
      text = 'We’ve prepared your message to ' + mailLink + '. <strong>Nothing has been sent yet</strong>: it goes out only when you press Send in your email app.' +
        (opts.shortened ? ' Your message is long, so the email may be shortened. Use “Copy message” below to get the full text.' : '');
    } else if (state === 'sent') {
      title = 'Thanks, your inquiry was sent';
      text = 'It reached our inbox. We’ll reply to ' + escapeHtml(d.email) + '. If you need to add anything, email ' + mailLink + '.';
    } else {
      title = 'That didn’t go through';
      text = 'Something went wrong sending your inquiry, and it has <strong>not</strong> been delivered. Please try again, or email ' + mailLink + ' directly. Your message is kept below.';
    }
    result.appendChild(icon);
    result.appendChild(el('h3', null, title));
    result.appendChild(el('p', null, text));

    if (state !== 'sent') {
      if (state === 'mailto') result.appendChild(el('p', null, 'Nothing opened? Email ' + mailLink + ' directly, or copy your message and paste it into any email.'));
      var ta = el('textarea', 'form-result__preview'); ta.readOnly = true; ta.value = copyText(d); ta.setAttribute('aria-label', 'Your message');
      ta.addEventListener('focus', function () { ta.select(); });
      result.appendChild(ta);
      var actions = el('div', 'form-result__actions');
      var copyBtn = btn('Copy message', 'btn--ghost', function () {
        copyToClipboard(ta.value, ta).then(function (ok) {
          copyBtn.textContent = ok ? 'Copied' : 'Press Ctrl+C to copy';
          copyBtn.classList.toggle('is-done', ok);
          setTimeout(function () { copyBtn.textContent = 'Copy message'; copyBtn.classList.remove('is-done'); }, 2200);
        });
      });
      actions.appendChild(copyBtn);
      if (state === 'mailto') {
        var again = btn('Open email app again', 'btn--ghost', function () { openMail(d); });
        actions.appendChild(again);
      } else {
        actions.appendChild(btn('Try again', 'btn--primary', function () { backToForm(); form.requestSubmit ? form.requestSubmit() : submitForm(); }));
      }
      result.appendChild(actions);
    }
    var back = btn(state === 'sent' ? 'Send another inquiry' : 'Edit my message', 'form-result__edit text-link', function () { backToForm(state === 'sent'); });
    result.appendChild(back);

    form.hidden = true;
    result.hidden = false;
    result.focus({ preventScroll: true });
    var panel = $('contact-panel'), top = panel.getBoundingClientRect().top;
    if (top < 80 || top > window.innerHeight * 0.6) panel.scrollIntoView({ block: 'start', behavior: window.WLM && WLM.reduced() ? 'auto' : 'smooth' });
  }
  function escapeHtml(s) { return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function backToForm(reset) {
    if (reset) { form.reset(); touched = {}; fields.forEach(function (f) { showError(f, ''); }); updateCount(); }
    result.hidden = true; result.textContent = '';
    form.hidden = false;
    (reset ? $('f-name') : $('f-message')).focus({ preventScroll: true });
  }

  function copyToClipboard(text, ta) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(ta); });
    }
    return Promise.resolve(legacyCopy(ta));
  }
  function legacyCopy(ta) {
    try { ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); return document.execCommand('copy'); } catch (e) { return false; }
  }

  /* ---- Submit ---- */
  function submitForm() {
    var firstBad = null;
    fields.forEach(function (f) { touched[f.id] = true; if (validateField(f) && !firstBad) firstBad = f; });
    refreshSummary();
    if (firstBad) {
      var bad = fields.filter(function (f) { return f.err.textContent && !f.err.hidden; });
      alertBox.textContent = '';
      setTimeout(function () { alertBox.textContent = 'The form has ' + (bad.length === 1 ? 'one error' : bad.length + ' errors') + ': ' + bad.map(function (f) { return f.label; }).join(', ') + '.'; }, 60);
      focusTarget(firstBad).focus();
      return;
    }
    alertBox.textContent = '';

    /* Honeypot: people never see this field. Bots do, so quietly pretend it worked. */
    if ($('f-gotcha').value) { showResult(endpointMode ? 'sent' : 'mailto', collect()); return; }

    var d = collect();
    setBusy(true);
    if (!endpointMode) {
      /* Brief pause so the loading state is perceptible, then hand off to the email app */
      setTimeout(function () {
        var out = openMail(d);
        setBusy(false);
        showResult('mailto', d, { shortened: out.shortened });
      }, 450);
      return;
    }
    var payload = { name: d.name, email: d.email, business: d.business, project_type: d.project_type, message: d.message, _subject: subjectFor(d) };
    fetch(FORM_CONFIG.FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setBusy(false);
      showResult('sent', d);
    }).catch(function () {
      setBusy(false);
      showResult('error', d);
    });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); if (!submitBtn.disabled) submitForm(); });

  /* ---- Prefill from service cards: <a href="#contact" data-service="Website Redesigns"> ---- */
  var PREFIX = 'I’m interested in: ';
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-service]');
    if (!a) return;
    var service = a.getAttribute('data-service').trim();
    if (!service) return;

    var line = PREFIX + service + '.';
    var cur = message.value;
    if (!cur.trim()) message.value = line + ' ';
    else if (cur.indexOf('interested in:') === -1) message.value = line + '\n\n' + cur;
    updateCount();

    var wanted = /redesign/i.test(service) ? 'Redesign' : 'New website';
    var chosen = form.elements.project_type.value;
    if (wanted === 'Redesign' || !chosen) {
      var radio = form.querySelector('input[name="project_type"][value="' + wanted + '"]');
      if (radio) { radio.checked = true; if (!form.hidden) { touched.type = true; validateField(fields[2]); } }
    }
    if (form.hidden) backToForm();

    /* Let the link scroll normally, then focus Name without a second scroll jump */
    var done = false;
    var focusName = function () {
      if (done) return; done = true;
      window.removeEventListener('scrollend', focusName);
      $('f-name').focus({ preventScroll: true });
    };
    window.addEventListener('scrollend', focusName);
    setTimeout(focusName, 900);
  });
})();
