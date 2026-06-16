// ─────────────────────────────────────────────────────────────────────────
// OBSIZE cookie consent.
//
// Analytics / marketing trackers (Google Analytics, Meta Pixel) are loaded
// ONLY after the visitor accepts. The cart's localStorage is strictly
// necessary for the site to function and is not gated.
//
// Choice is stored in localStorage under 'obsize_cookie_consent'
// ('granted' | 'denied'). Visitors can change it anytime via the footer
// "ניהול עוגיות" link, which calls window.OBSIZE_openCookieSettings().
// ─────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  var CONSENT_KEY = 'obsize_cookie_consent';

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
  }

  function loadAnalytics() {
    if (window.OBSIZE_ANALYTICS && typeof window.OBSIZE_ANALYTICS.load === 'function') {
      window.OBSIZE_ANALYTICS.load();
    }
  }

  // ── Banner DOM ──
  var banner = null;

  function buildBanner() {
    if (banner) return banner;
    banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'הסכמה לשימוש בעוגיות');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML =
      '<div class="cookie-banner-inner">' +
        '<p class="cookie-banner-text">' +
          'אנחנו משתמשים בעוגיות חיוניות לתפעול האתר, ובכפוף להסכמתך גם בעוגיות ' +
          'אנליטיקה ושיווק. למידע נוסף ראו ' +
          '<a href="privacy.html">מדיניות הפרטיות</a>.' +
        '</p>' +
        '<div class="cookie-banner-actions">' +
          '<button type="button" class="btn btn-outline cookie-btn" data-consent="denied">דחייה</button>' +
          '<button type="button" class="btn btn-primary cookie-btn" data-consent="granted">אישור</button>' +
        '</div>' +
      '</div>';

    banner.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      var choice = btn.getAttribute('data-consent');
      setConsent(choice);
      hideBanner();
      if (choice === 'granted') loadAnalytics();
    });

    document.body.appendChild(banner);
    return banner;
  }

  function showBanner() {
    buildBanner();
    // Force a reflow so the browser registers the off-screen start state,
    // then add .open so the slide-in transition runs. (Reflow is reliable
    // even when requestAnimationFrame is throttled in a background tab.)
    void banner.offsetWidth;
    banner.classList.add('open');
  }

  function hideBanner() {
    if (banner) banner.classList.remove('open');
  }

  // Public: lets a footer link reopen the choice.
  window.OBSIZE_openCookieSettings = function () {
    buildBanner();
    showBanner();
  };

  // ── On load ──
  function init() {
    // Wire any "manage cookies" trigger (footer link) to reopen the banner.
    document.querySelectorAll('[data-cookie-settings]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        window.OBSIZE_openCookieSettings();
      });
    });

    var consent = getConsent();
    if (consent === 'granted') {
      loadAnalytics();          // returning visitor who already accepted
    } else if (consent === 'denied') {
      /* do nothing — trackers stay off */
    } else {
      showBanner();             // first visit — ask
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
