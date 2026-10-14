/**
 * HOSPITALITY Agentic — app.js
 * Single behaviour script for the landing page + legal/thank-you pages.
 *
 * Dependency-free vanilla JS.
 * Contract: drive the DOM around window.SITE_CONFIG (config.js) and
 * ./content.json (language-major: {ru, it, en}). All behaviour is defensive:
 * it works on whatever [data-i18n] / [data-lang] / [data-netlify="true"] /
 * modal / reveal elements actually exist in the markup, and no single failure
 * stops the rest (each module runs in its own try/catch).
 *
 * Modules:
 *  - i18n engine        (applyLang + path lookup + lang switcher)
 *  - UTM capture        (utmsource / utmmedium / utmcampaign / gclid)
 *  - Forms              (4x form[data-netlify="true"] validation + submit)
 *  - Modals             ([data-open-modal], escape/backdrop close, focus trap)
 *  - Reveal on scroll   (IntersectionObserver adds .is-in)
 *  - Cookie consent     (#cookie-banner placeholder)
 *  - Age gate           ([data-vape-detail] in #vape section)
 *  - Static page render (legal.* / thankyou.* into #content)
 */
(function () {
  'use strict';

  var SITE_CONFIG = window.SITE_CONFIG || {};
  var DEFAULT_LANG = String(SITE_CONFIG.defaultLang || 'ru').toLowerCase();
  // Fallback email if config.js missing or incomplete (contract §1 default).
  var DEFAULT_EMAIL = 'alegra_007@proton.me';

  var CONTENT = null;                 // full content.json {ru,it,en}
  var activeLang = DEFAULT_LANG;
  var isReduced = (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  var activeModal = null;
  var lastFocused = null;

  /* ------------------------------------------------------------------ *
   * Utilities
   * ------------------------------------------------------------------ */

  function safe(fn) {
    try { fn(); }
    catch (err) { if (window.console && console.error) console.error('[HOSPITALITY/app]', err); }
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  /** Traverse content.json at {@lang} down a dotted {@path}; returns value or null. */
  function getPath(lang, path) {
    if (!CONTENT) return null;
    var node = CONTENT[String(lang).toLowerCase()];
    if (!node) return null;
    var parts = String(path).split('.');
    for (var i = 0; i < parts.length; i++) {
      if (node == null) return null;
      node = node[parts[i]];
    }
    return node;
  }

  /** Like getPath but falls back EN -> RU -> IT and returns a string or null. */
  function getText(path, lang) {
    var langs = [lang || activeLang, 'en', 'ru', 'it'];
    for (var i = 0; i < langs.length; i++) {
      var v = getPath(langs[i], path);
      if (typeof v === 'string' && v.length) return v;
      if (typeof v === 'number') return String(v);
    }
    return null;
  }

  /** Object getter (non-string payloads) with EN fallback. */
  function getObject(path) {
    var v = getPath(activeLang, path);
    if (v != null) return v;
    return getPath('en', path);
  }

  function setMeta(selector, value) {
    if (value == null) return;
    var el = document.querySelector(selector);
    if (el) el.setAttribute('content', value);
  }

  function storageGet(key, kind) {
    try { return (kind === 'session' ? sessionStorage : localStorage).getItem(key); }
    catch (e) { return null; }
  }
  function storageSet(key, value, kind) {
    try { (kind === 'session' ? sessionStorage : localStorage).setItem(key, value); }
    catch (e) { /* private mode — ignore */ }
  }

  /* ------------------------------------------------------------------ *
   * i18n engine
   * ------------------------------------------------------------------ */

  function applyLang(lang) {
    activeLang = String(lang || DEFAULT_LANG).toLowerCase();
    storageSet('lang', activeLang, 'local');
    document.documentElement.setAttribute('lang', activeLang);

    // SEO swap from content[activeLang].seo
    var seo = getPath(activeLang, 'seo') || getPath('en', 'seo') || {};
    if (seo.title) document.title = seo.title;
    setMeta('meta[name="description"]', seo.description);
    setMeta('meta[property="og:title"]', seo.ogTitle);
    setMeta('meta[property="og:description"]', seo.ogDesc);

    // Language switcher active state
    document.querySelectorAll('button[data-lang]').forEach(function (btn) {
      var on = String(btn.getAttribute('data-lang')).toLowerCase() === activeLang;
      btn.classList.toggle('is-active', on);
      if (typeof btn.setAttribute === 'function') {
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    });

    // textContent
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
          var key = el.getAttribute('data-i18n');
          var t = getText(key);
          if (t != null) el.textContent = t;
        });
        // Language buttons show their OWN language name (not the active one).
        document.querySelectorAll('button[data-lang]').forEach(function (btn) {
          var own = btn.getAttribute('data-lang');
          var name = getPath(own, 'langName');
          if (typeof name === 'string' && name.length) btn.textContent = name;
        });
    // placeholder
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var t = getText(el.getAttribute('data-i18n-ph'));
      if (t != null) el.setAttribute('placeholder', t);
    });
    // aria-label
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var t = getText(el.getAttribute('data-i18n-aria'));
      if (t != null) el.setAttribute('aria-label', t);
    });
    // title
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var t = getText(el.getAttribute('data-i18n-title'));
      if (t != null) el.setAttribute('title', t);
    });

    // Re-render legal / thank-you static pages.
    renderStaticPage();
  }

  function initLangSwitch() {
      var toggle = document.querySelector('.lang-toggle');
      var menu = document.querySelector('.lang-menu');

      function closeMenu() {
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
        if (menu) menu.setAttribute('hidden', '');
      }
      function openMenu() {
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
        if (menu) menu.removeAttribute('hidden');
      }

      if (toggle && menu) {
        toggle.addEventListener('click', function (e) {
          e.stopPropagation();
          var open = toggle.getAttribute('aria-expanded') === 'true';
          if (open) closeMenu(); else openMenu();
        });
        // Close on outside click
        document.addEventListener('click', function (e) {
          if (menu && !menu.hasAttribute('hidden') && !menu.contains(e.target) && e.target !== toggle) {
            closeMenu();
          }
        });
        // Close on Escape
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' || e.key === 'Esc') closeMenu();
        });
      }

      document.querySelectorAll('button[data-lang]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          closeAllModals();
          closeMenu();
          safe(function () { applyLang(btn.getAttribute('data-lang')); });
        });
      });
    }

  /* ------------------------------------------------------------------ *
   * Static page render (legal/privacy|cookies|disclaimer, thank-you)
   * ------------------------------------------------------------------ */

  function renderStaticPage() {
    var contentEl = document.querySelector('#content[data-legal-page], #content[data-thankyou]');
    if (!contentEl || !CONTENT) return;

    var legalPage = contentEl.getAttribute('data-legal-page');
    var key = legalPage ? ('legal.' + legalPage) : 'thankyou';
    var page = getPath(activeLang, key) || getPath('en', key);
    if (!page) return;

    var html = '';
    if (page.title) html += '<h1 class="h1">' + esc(page.title) + '</h1>';
    if (page.updated) html += '<p class="legal-updated">' + esc(page.updated) + '</p>';

    if (Array.isArray(page.body)) {
      page.body.forEach(function (block) {
        if (block && block.h) html += '<h2 class="h2">' + esc(block.h) + '</h2>';
        if (block && block.p) html += '<p>' + esc(block.p) + '</p>';
      });
    } else if (typeof page.text === 'string') {
      html += '<p>' + esc(page.text) + '</p>';
    }

    if (html) contentEl.innerHTML = html;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ------------------------------------------------------------------ *
   * UTM capture
   * ------------------------------------------------------------------ */

  function captureUTM() {
    if (typeof URLSearchParams === 'undefined') return;
    var p = new URLSearchParams(window.location.search);
    ['utmsource', 'utmmedium', 'utmcampaign', 'gclid'].forEach(function (n) {
      var val = p.get(n);
      if (!val) return;
      document.querySelectorAll('input[name="' + n + '"]').forEach(function (input) {
        input.value = val;
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Forms (validation + submit)
   * ------------------------------------------------------------------ */

  function formsError(key) {
    var v = getText('forms.errors.' + key);
    return v || getText('forms.errors.required') || 'Please fill this field.';
  }

  function fieldErrorText(field) {
    if (field.validity && field.validity.valueMissing) {
      if (String(field.name || '').toLowerCase() === 'name') return formsError('name');
      if (String(field.name || '').toLowerCase() === 'email') return formsError('email');
      return formsError('required');
    }
    if (field.validity && field.validity.typeMismatch) {
      if (String(field.type || '').toLowerCase() === 'email') return formsError('email');
      return formsError('email');
    }
    return formsError('required');
  }

  function clearErrors(form) {
    form.querySelectorAll('[aria-invalid="true"]').forEach(function (el) {
      el.removeAttribute('aria-invalid');
    });
    // keep the class but empty the text of error nodes, then remove empty ones
    form.querySelectorAll('.error-text[role="alert"]').forEach(function (el) { el.remove(); });
  }

  function markInvalid(form, field, msg) {
    field.setAttribute('aria-invalid', 'true');
    var id = (field.name || 'field') + '-error';
    var existing = document.getElementById(id);
    if (existing) {
      existing.textContent = msg;
    } else {
      var p = document.createElement('p');
      p.className = 'error-text';
      p.id = id;
      p.setAttribute('role', 'alert');
      p.textContent = msg;
      if (field.parentNode) field.parentNode.insertBefore(p, field.nextSibling);
    }
  }

  function formTitle(form, id) {
    var list = getObject('forms.forms');
    if (Array.isArray(list)) {
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].id === id && list[i].title) return list[i].title;
      }
    }
    return getText('forms.title') || ('avibe-hospitality form — ' + (id || ''));
  }

  function showFormSuccess(form, msg) {
    form.style.display = 'none';
    var box = document.createElement('div');
    box.className = 'success-box';
    box.setAttribute('role', 'status');
    var p = document.createElement('p');
    p.textContent = msg || getText('forms.success') || 'Thank you — your message has been prepared.';
    box.appendChild(p);
    var a = document.createElement('a');
    a.href = 'thank-you.html';
    a.className = 'btn btn--gold';
    a.textContent = getText('thankyou.back') || getText('forms.success') || 'Done';
    box.appendChild(a);
    if (form.parentNode) form.parentNode.insertBefore(box, form.nextSibling);
  }

  function showFormError(form, msg) {
    var existing = form.querySelector('.form-error[role="alert"]');
    if (existing) { existing.textContent = msg; return; }
    var box = document.createElement('p');
    box.className = 'form-error error-text';
    box.setAttribute('role', 'alert');
    box.textContent = msg || getText('forms.errors.required') || 'Something went wrong. Please try again.';
    if (form.parentNode) form.parentNode.insertBefore(box, form.nextSibling);
  }

  function buildPayload(form) {
    var data = new FormData(form);
    // always record current lang + form id
    data.set('lang', activeLang);
    data.set('form_id', form.id || form.getAttribute('name') || 'unspecified');

    var body = {};
    data.forEach(function (v, k) {
      if (body[k] === undefined) {
        body[k] = v;
      } else {
        body[k] = Array.isArray(body[k]) ? body[k] : [body[k]];
        body[k].push(v);
      }
    });
    return body;
  }

  function buildMailto(payload, subject) {
    var email = (SITE_CONFIG.CONTACT && SITE_CONFIG.CONTACT.email) || DEFAULT_EMAIL;
    var text = JSON.stringify(payload, null, 2);
    return 'mailto:' + encodeURIComponent(email) +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(text);
  }

  function submitForm(form) {
    var endpoint = SITE_CONFIG.formEndpoint || '';
    var id = form.id || '';
    var payload = buildPayload(form);
    var subject = formTitle(form, id) + ' (' + activeLang + ')';

    if (endpoint) {
      // POST JSON to configured webhook.
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (res.ok) {
            showFormSuccess(form);
          } else {
            showFormError(form);
          }
        })
        .catch(function () { showFormError(form); });
    } else {
      // Default: compose a mailto: and open it. No real endpoint is touched.
      var mail = buildMailto(payload, subject);
      showFormSuccess(form);
      // brief delay so the success note is rendered before navigating away
      window.setTimeout(function () { window.location.href = mail; }, 300);
    }
  }

  function initForms() {
    var forms = document.querySelectorAll('form[data-netlify="true"]');
    Array.prototype.forEach.call(forms, function (form) {
      // We run our own accessible validation; disable native browser bubbles.
      if (!form.hasAttribute('novalidate')) form.setAttribute('novalidate', 'novalidate');

      form.addEventListener('submit', function (ev) {
        ev.preventDefault();

        // Honeypot: if a hidden 'website_url' field is filled, silently drop.
        var honeypot = form.querySelector('input[name="website_url"]');
        if (honeypot && String(honeypot.value || '').trim() !== '') return;

        clearErrors(form);
        var valid = true;
        var firstInvalid = null;

        // Per-field validation (native validity + required/type).
        Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (field) {
          if (field.disabled) return;
          if (String(field.name || '') === 'website_url') return; // honeypot
          if (String(field.name || '') === 'consent') return;     // handled below
          if (typeof field.checkValidity === 'function' && !field.checkValidity()) {
            valid = false;
            markInvalid(form, field, fieldErrorText(field));
            if (!firstInvalid) firstInvalid = field;
          }
        });

        // GDPR consent is mandatory.
        var consent = form.querySelector('input[name="consent"]');
        if (consent && !consent.checked) {
          valid = false;
          markInvalid(form, consent, formsError('consent'));
          if (!firstInvalid) firstInvalid = consent;
        }

        if (!valid) {
          if (firstInvalid && firstInvalid.focus) firstInvalid.focus();
          return;
        }

        submitForm(form);
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Modals
   * ------------------------------------------------------------------ */

  function getFocusables(modal) {
    var nodes = modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    return Array.prototype.filter.call(nodes, function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function trapTab(e, modal) {
    if (e.key !== 'Tab') return;
    var focusables = getFocusables(modal);
    if (!focusables.length) { e.preventDefault(); return; }
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function closeAllModals() {
    if (activeModal) {
      var toClose = activeModal;
      activeModal = null;
      closeModal(toClose);
    }
    // safety: catch any modal left open
    document.querySelectorAll('.modal.is-open').forEach(closeModal);
  }

  function closeModal(modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-modal', 'false');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('hidden', '');
    setSiblingsHidden(modal, false);
    if (lastFocused && lastFocused.focus) {
      try { lastFocused.focus(); } catch (e) { /* ignore */ }
    }
  }

  function setSiblingsHidden(modal, hide) {
    var val = hide ? 'true' : 'false';
    if (modal.parentNode) {
      Array.prototype.forEach.call(modal.parentNode.children, function (c) {
        if (c !== modal) c.setAttribute('aria-hidden', val);
      });
    }
  }

  function openModal(id) {
    closeAllModals();
    var modal = document.getElementById(id);
    if (!modal) return;

    lastFocused = document.activeElement;
    activeModal = modal;

    modal.classList.add('is-open');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'false');
    modal.removeAttribute('hidden');
    setSiblingsHidden(modal, true);

    // Best-effort backdrop handling (sibling or first child .modal-backdrop).
    var backdrop = null;
    if (modal.previousElementSibling &&
        modal.previousElementSibling.classList.contains('modal-backdrop')) {
      backdrop = modal.previousElementSibling;
    } else {
      backdrop = modal.querySelector(':scope > .modal-backdrop');
    }
    if (backdrop) {
      backdrop.classList.add('is-open');
      backdrop.removeAttribute('hidden');
    }

    var focusables = getFocusables(modal);
    if (focusables.length) focusables[0].focus();
  }

  function initModals() {
    document.querySelectorAll('[data-open-modal]').forEach(function (opener) {
      opener.addEventListener('click', function (e) {
        e.preventDefault();
        safe(function () { openModal(opener.getAttribute('data-open-modal')); });
      });
    });

    document.querySelectorAll('.modal-close').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var modal = btn.closest('.modal');
        if (modal) closeModal(modal);
      });
    });

    // Close on backdrop click (click strictly on the modal shell / backdrop).
    document.addEventListener('click', function (e) {
      var t = e.target;
      var modal = null;
      if (t.classList && t.classList.contains('modal-backdrop')) {
        modal = t.parentNode && t.parentNode.classList.contains('modal') ? t.parentNode : (t.closest && t.closest('.modal'));
      } else if (t.classList && t.classList.contains('modal')) {
        modal = t;
      } else if (t.closest) {
        var mc = t.closest('.modal-close');
        // handled above; nothing here
      }
      if (modal && modal.classList.contains('is-open')) closeModal(modal);
    });

    // Escape + focus trap.
    document.addEventListener('keydown', function (e) {
      if (!activeModal) return;
      if (e.key === 'Escape' || e.key === 'Esc') closeAllModals();
      else if (e.key === 'Tab') trapTab(e, activeModal);
    });

    // Close all modals when navigating to an in-page anchor (before scrolling).
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a[href^="#"]')) closeAllModals();
    });
  }

  /* ------------------------------------------------------------------ *
     * Module accordion (inline expandable descriptions, no overlay)
     * ------------------------------------------------------------------ */

    function initModuleAccordion() {
      var toggles = document.querySelectorAll('[data-module-toggle]');
      Array.prototype.forEach.call(toggles, function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-module-toggle');
          var panel = document.getElementById('module-' + id);
          var isOpen = btn.getAttribute('aria-expanded') === 'true';

          // Close all other open modules (single-open accordion).
          document.querySelectorAll('[data-module-toggle]').forEach(function (other) {
            if (other !== btn) {
              other.setAttribute('aria-expanded', 'false');
              var op = document.getElementById('module-' + other.getAttribute('data-module-toggle'));
              if (op) op.setAttribute('hidden', '');
            }
          });

          if (isOpen) {
            btn.setAttribute('aria-expanded', 'false');
            if (panel) panel.setAttribute('hidden', '');
          } else {
            btn.setAttribute('aria-expanded', 'true');
            if (panel) panel.removeAttribute('hidden');
          }
        });
      });
    }

    /* ------------------------------------------------------------------ *
         * Reveal on scroll
         *   * ------------------------------------------------------------------ */

  function initReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (isReduced || typeof IntersectionObserver === 'undefined') {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------ *
   * Cookie consent placeholder
   * ------------------------------------------------------------------ */

  function initCookie() {
    var banner = document.getElementById('cookie-banner');
    if (!banner) return;
    var stored = storageGet('cookie', 'local');
    if (stored === 'accepted' || stored === 'declined' || stored === '1' || stored === 'true') {
      banner.remove();
      return;
    }
    banner.removeAttribute('hidden');
    var accept = banner.querySelector('[data-cookie="accept"]');
    var decline = banner.querySelector('[data-cookie="decline"]');
    function choose(val) {
      storageSet('cookie', val, 'local');
      banner.remove();
    }
    if (accept) accept.addEventListener('click', function () { choose('accepted'); });
    if (decline) decline.addEventListener('click', function () { choose('declined'); });
  }

  /* ------------------------------------------------------------------ *
   * Age-gate placeholder (vape section)
   * ------------------------------------------------------------------ */

  function initAgeGate() {
    var section = document.getElementById('vape') || document.querySelector('[data-vape]');
    if (!section) return;
    var detail = section.querySelector('[data-vape-detail]');
    var already = storageGet('vapeAA', 'session') === '1';
    if (!detail) return;

    if (already) {
      detail.removeAttribute('hidden');
      return;
    }
    detail.setAttribute('hidden', '');

    var okBtn = section.querySelector('[data-vape-ok]');
    var noBtn = section.querySelector('[data-vape-no]');
    if (okBtn) {
      okBtn.addEventListener('click', function () {
        storageSet('vapeAA', '1', 'session');
        detail.removeAttribute('hidden');
      });
    }
    if (noBtn) {
      noBtn.addEventListener('click', function () {
        detail.setAttribute('hidden', '');
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * Fallback used when ./content.json cannot be loaded
   * ------------------------------------------------------------------ */

  function showContentFallback() {
    if (window.console) console.error('[HOSPITALITY/app] Unable to load ./content.json');
    var target = document.querySelector('#content') || document.body;
    var el = document.createElement('div');
    el.className = 'error-text';
    el.setAttribute('role', 'alert');
    el.textContent = 'Warning: content.json could not be loaded. Please publish it next to this page.';
    if (target.firstChild) target.insertBefore(el, target.firstChild);
    else target.appendChild(el);
  }

  /* ------------------------------------------------------------------ *
     * Boot
     * ------------------------------------------------------------------ */

    /** Resolve the site root from the app.js <script> src, so content.json
     *  loads correctly from subdirectories (e.g. legal/). */
    function getBasePath() {
      var scripts = document.getElementsByTagName('script');
      for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].getAttribute('src') || '';
        if (/app\.js(\?.*)?$/.test(src)) {
          var dir = src.replace(/app\.js(\?.*)?$/, '');
          return dir || './';
        }
      }
      return './';
    }

    onReady(function () {
      // Set a provisional language flag immediately to avoid a flash.
      var pre = storageGet('lang', 'local') || DEFAULT_LANG;
      document.documentElement.setAttribute('lang', pre.toLowerCase());

      fetch(getBasePath() + 'content.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        CONTENT = json;
        safe(function () { applyLang(storageGet('lang', 'local') || DEFAULT_LANG); });
        safe(initLangSwitch);
        safe(initForms);
        safe(captureUTM);
        safe(initModals);
        safe(initModuleAccordion);
        safe(initReveal);
        safe(initCookie);
        safe(initAgeGate);
      })
      .catch(function () {
        showContentFallback();
        // Still boot every module (forms/mailto/config/defaults keep working).
        safe(function () { applyLang(storageGet('lang', 'local') || DEFAULT_LANG); });
        safe(initLangSwitch);
        safe(initForms);
        safe(captureUTM);
        safe(initModals);
        safe(initModuleAccordion);
        safe(initReveal);
        safe(initCookie);
        safe(initAgeGate);
      });
  });
})();
