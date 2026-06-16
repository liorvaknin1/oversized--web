// ─────────────────────────────────────────────────────────────────────────
// OBSIZE analytics — Google Analytics 4 (GA4) + Meta Pixel
//
// SETUP: paste your IDs below. Until they are filled in, this file is a
// complete no-op — no scripts load, no requests are sent, nothing breaks.
//
//   GA4_ID        — GA4 Measurement ID, looks like "G-XXXXXXXXXX"
//                   (Google Analytics → Admin → Data Streams → your web stream)
//   META_PIXEL_ID — Meta Pixel ID, a numeric string like "123456789012345"
//                   (Meta Events Manager → Data Sources → your pixel)
//
// Each platform is independent: set one, both, or neither.
// ─────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  var CONFIG = {
    GA4_ID: '',          // e.g. 'G-XXXXXXXXXX'
    META_PIXEL_ID: '',   // e.g. '123456789012345'
  };

  var CURRENCY = 'ILS';

  var gaEnabled = isConfigured(CONFIG.GA4_ID) && /^G-[A-Z0-9]+$/i.test(CONFIG.GA4_ID);
  var pixelEnabled = isConfigured(CONFIG.META_PIXEL_ID) && /^\d{6,}$/.test(CONFIG.META_PIXEL_ID);

  function isConfigured(v) {
    return typeof v === 'string' && v.trim().length > 0;
  }

  var loaded = false;

  // Injects the GA4 and Meta Pixel scripts. Called ONLY after the visitor
  // grants cookie consent (see consent.js) — never on page load. Safe to call
  // more than once; it loads each provider at most once.
  function load() {
    if (loaded) return;
    loaded = true;

    // ── Load Google Analytics 4 ──
    if (gaEnabled) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.GA4_ID);
      document.head.appendChild(s);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', CONFIG.GA4_ID);
    }

    // ── Load Meta Pixel ──
    if (pixelEnabled) {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
        n.queue = []; t = b.createElement(e); t.async = !0;
        t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', CONFIG.META_PIXEL_ID);
      window.fbq('track', 'PageView');
    }
  }

  // ── Event name mapping: GA4 event → Meta standard event ──
  var META_EVENT = {
    view_item: 'ViewContent',
    add_to_cart: 'AddToCart',
    begin_checkout: 'InitiateCheckout',
    purchase: 'Purchase',
  };

  // Build a Meta-shaped payload from a GA4-shaped ecommerce payload.
  function toMetaParams(ga) {
    if (!ga) return {};
    var contents = (ga.items || []).map(function (it) {
      return { id: it.item_id, quantity: it.quantity || 1, item_price: it.price };
    });
    var params = {
      currency: ga.currency || CURRENCY,
      value: ga.value,
    };
    if (contents.length) {
      params.contents = contents;
      params.content_ids = contents.map(function (c) { return c.id; });
      params.content_type = 'product';
    }
    if (ga.transaction_id) params.order_id = ga.transaction_id;
    return params;
  }

  // ── Public API ──
  // track(eventName, ga4Params) sends to both platforms when enabled.
  function track(eventName, params) {
    params = params || {};
    if (gaEnabled && window.gtag) {
      window.gtag('event', eventName, params);
    }
    if (pixelEnabled && window.fbq) {
      var metaName = META_EVENT[eventName];
      if (metaName) {
        window.fbq('track', metaName, toMetaParams(params));
      } else {
        window.fbq('trackCustom', eventName, params);
      }
    }
  }

  // Normalize a cart line item → GA4 item shape.
  function toItem(line) {
    return {
      item_id: line.id,
      item_name: line.name,
      price: line.price,
      quantity: line.qty || line.quantity || 1,
      item_variant: [line.size, line.color].filter(Boolean).join(' / ') || undefined,
    };
  }

  function sum(items) {
    return (items || []).reduce(function (t, it) {
      return t + (it.price || 0) * (it.quantity || 1);
    }, 0);
  }

  window.OBSIZE_ANALYTICS = {
    enabled: gaEnabled || pixelEnabled,
    gaEnabled: gaEnabled,
    pixelEnabled: pixelEnabled,
    load: load,
    track: track,

    viewItem: function (line) {
      var item = toItem(line);
      track('view_item', { currency: CURRENCY, value: item.price, items: [item] });
    },

    addToCart: function (line) {
      var item = toItem(line);
      track('add_to_cart', {
        currency: CURRENCY,
        value: item.price * item.quantity,
        items: [item],
      });
    },

    beginCheckout: function (lines) {
      var items = (lines || []).map(toItem);
      track('begin_checkout', { currency: CURRENCY, value: sum(items), items: items });
    },

    purchase: function (orderId, lines) {
      var items = (lines || []).map(toItem);
      track('purchase', {
        transaction_id: orderId,
        currency: CURRENCY,
        value: sum(items),
        items: items,
      });
    },
  };
})();
