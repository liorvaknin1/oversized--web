// Checkout page: validates form, renders order summary, simulates order placement.
(function() {
  // ───────────────────────────────────────────────────────────────────────
  // Order notifications via Web3Forms (free, no backend).
  // SETUP: get a free access key at https://web3forms.com (enter the email
  // address where you want to receive orders) and paste it below. Until it is
  // set, orders still complete on screen but no email is sent.
  // The key is a public submit key — safe to keep in client code; it only
  // delivers to the email you registered.
  //
  // The destination email is NOT stored here (on purpose — this file is
  // public). It is configured against this access key in the Web3Forms
  // dashboard at https://web3forms.com — view or change the recipient there.
  //
  // NOTE: credit-card fields are deliberately NEVER sent here.
  // ───────────────────────────────────────────────────────────────────────
  const WEB3FORMS_ACCESS_KEY = '4a44305b-2c8b-47c6-8a17-d873e3c84ee8';

  const STORAGE_KEY = 'obsize_cart_v1';
  const SHIRT_SVG = '<svg viewBox="0 0 200 240" aria-hidden="true"><path d="M130 20 L170 45 L155 65 L140 55 L140 200 L60 200 L60 55 L45 65 L30 45 L70 20 Q85 10 100 10 Q115 10 130 20Z"/></svg>';

  const checkoutMain = document.getElementById('checkout');
  const emptyView = document.getElementById('checkoutEmpty');
  const successView = document.getElementById('checkoutSuccess');
  const form = document.getElementById('checkoutForm');
  const submitBtn = document.getElementById('checkoutSubmit');
  const submitAmount = document.getElementById('checkoutSubmitAmount');
  const itemsEl = document.getElementById('checkoutItems');
  const subtotalEl = document.getElementById('checkoutSubtotal');
  const totalEl = document.getElementById('checkoutTotal');

  const items = loadCart();

  // Empty cart → show empty state and stop
  if (items.length === 0) {
    checkoutMain.hidden = true;
    emptyView.hidden = false;
    return;
  }

  function loadCart() {
    // Harden against corrupted/tampered localStorage: keep only well-formed
    // items and coerce numeric fields so math never sees strings/NaN.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(it => it && typeof it === 'object' && it.id && it.name)
        .map(it => ({
          id: String(it.id),
          name: String(it.name),
          price: Math.max(0, Number(it.price) || 0),
          image: typeof it.image === 'string' ? it.image : '',
          size: typeof it.size === 'string' ? it.size : '',
          color: typeof it.color === 'string' ? it.color : '',
          qty: Math.min(99, Math.max(1, Math.floor(Number(it.qty)) || 1)),
        }))
        .map(reviseAgainstCatalog)
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  // SECURITY: the cart lives in localStorage, which the customer fully
  // controls. Never trust its price/name — re-derive them from the shared
  // catalog (products.js) by id, so the order email can't show a spoofed
  // total. Items whose id is no longer in the catalog are dropped.
  function reviseAgainstCatalog(it) {
    const catalog = window.PRODUCTS;
    if (!catalog || !Object.prototype.hasOwnProperty.call(catalog, it.id)) return null;
    const p = catalog[it.id];
    // Pre-launch items can never become an order: a cart saved before the
    // product was marked `available: false` must not reach the owner's inbox
    // as something we cannot ship.
    if (p.available === false) return null;
    return {
      ...it,
      name: p.name,
      price: p.price,
      image: p.images && p.images[0] ? p.images[0] : it.image,
    };
  }

  function formatPrice(value) {
    return `₪${value.toLocaleString('he-IL')}`;
  }

  function escapeHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function getSubtotal() {
    return items.reduce((sum, it) => sum + it.price * it.qty, 0);
  }

  // ── Render order summary ──
  itemsEl.innerHTML = items.map(it => {
    const imgHTML = it.image
      ? `<img src="${escapeHTML(it.image)}" alt="${escapeHTML(it.name)}" />`
      : SHIRT_SVG;
    const meta = [it.size && `מידה ${it.size}`, it.color].filter(Boolean).join(' · ');
    return `
      <div class="checkout-item">
        <div class="checkout-item-img">
          ${imgHTML}
          <span class="checkout-item-badge">${it.qty}</span>
        </div>
        <div class="checkout-item-info">
          <p class="checkout-item-name">${escapeHTML(it.name)}</p>
          <p class="checkout-item-meta">${escapeHTML(meta)}</p>
        </div>
        <span class="checkout-item-price">${formatPrice(it.price * it.qty)}</span>
      </div>
    `;
  }).join('');

  const subtotal = getSubtotal();
  subtotalEl.textContent = formatPrice(subtotal);
  totalEl.textContent = formatPrice(subtotal);
  submitAmount.textContent = `· ${formatPrice(subtotal)}`;

  // Analytics: reaching checkout with items is a begin_checkout event
  if (window.OBSIZE_ANALYTICS) window.OBSIZE_ANALYTICS.beginCheckout(items);

  // ── Card number / expiry input formatting ──
  const cardInput = document.getElementById('cardNumber');
  cardInput.addEventListener('input', () => {
    const digits = cardInput.value.replace(/\D/g, '').slice(0, 16);
    cardInput.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  });

  const expInput = document.getElementById('cardExpiry');
  expInput.addEventListener('input', () => {
    const digits = expInput.value.replace(/\D/g, '').slice(0, 4);
    expInput.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  });

  const cvvInput = document.getElementById('cardCvv');
  cvvInput.addEventListener('input', () => {
    cvvInput.value = cvvInput.value.replace(/\D/g, '').slice(0, 4);
  });

  const zipInput = document.getElementById('zip');
  zipInput.addEventListener('input', () => {
    zipInput.value = zipInput.value.replace(/\D/g, '').slice(0, 7);
  });

  // ── Validation ──
  const VALIDATORS = {
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'כתובת אימייל לא תקינה',
    phone: (v) => /^[0-9\-+()\s]{9,}$/.test(v) || 'מספר טלפון לא תקין',
    firstName: (v) => v.trim().length >= 2 || 'שם פרטי נדרש',
    lastName: (v) => v.trim().length >= 2 || 'שם משפחה נדרש',
    address: (v) => v.trim().length >= 4 || 'כתובת מלאה נדרשת',
    city: (v) => v.trim().length >= 2 || 'עיר נדרשת',
    zip: (v) => /^\d{5,7}$/.test(v) || 'מיקוד 5–7 ספרות',
    cardNumber: (v) => v.replace(/\s/g, '').length >= 13 || 'מספר כרטיס לא תקין',
    cardExpiry: (v) => {
      const m = /^(\d{2})\/(\d{2})$/.exec(v);
      if (!m) return 'תוקף בפורמט MM/YY';
      const month = parseInt(m[1], 10);
      if (month < 1 || month > 12) return 'חודש לא תקין';
      // Reject cards that are already expired (valid through end of MM/YY)
      const year = 2000 + parseInt(m[2], 10);
      const now = new Date();
      if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
        return 'הכרטיס פג תוקף';
      }
      return true;
    },
    cardCvv: (v) => /^\d{3,4}$/.test(v) || 'CVV 3–4 ספרות',
  };

  function clearError(field) {
    const errEl = form.querySelector(`.checkout-error[data-for="${field}"]`);
    if (errEl) errEl.textContent = '';
    const input = document.getElementById(field);
    if (input) input.classList.remove('has-error');
  }

  function setError(field, msg) {
    const errEl = form.querySelector(`.checkout-error[data-for="${field}"]`);
    if (errEl) errEl.textContent = msg;
    const input = document.getElementById(field);
    if (input) input.classList.add('has-error');
  }

  function validateField(field) {
    const input = document.getElementById(field);
    const value = input.value.trim();
    if (!value) {
      setError(field, 'שדה חובה');
      return false;
    }
    const result = VALIDATORS[field](value);
    if (result === true) {
      clearError(field);
      return true;
    }
    setError(field, result);
    return false;
  }

  // Clear error as user types
  Object.keys(VALIDATORS).forEach(field => {
    const input = document.getElementById(field);
    input.addEventListener('input', () => {
      if (input.classList.contains('has-error')) clearError(field);
    });
    input.addEventListener('blur', () => {
      if (input.value.trim()) validateField(field);
    });
  });

  // ── hCaptcha helpers ──
  // Web3Forms' Captcha Protection (hCaptcha) is enabled on this access key, so
  // every submission must carry a valid h-captcha-response token or the API
  // rejects it. The widget (rendered by web3forms client script) writes the
  // token into a hidden field inside the form once solved.
  const formError = document.getElementById('checkoutFormError');
  function getCaptchaToken() {
    const el = form.querySelector('[name="h-captcha-response"]');
    return el && el.value ? el.value.trim() : '';
  }
  function showFormError(msg) {
    if (!formError) return;
    formError.textContent = msg;
    formError.hidden = false;
  }
  function clearFormError() {
    if (!formError) return;
    formError.textContent = '';
    formError.hidden = true;
  }
  function resetCaptcha() {
    try { if (window.hcaptcha) window.hcaptcha.reset(); } catch (e) {}
  }
  function setLoading(on) {
    submitBtn.disabled = on;
    submitBtn.classList.toggle('is-loading', on);
    submitBtn.querySelector('.checkout-submit-label').textContent = on ? 'מעבד הזמנה...' : 'השלם הזמנה';
  }

  // ── Submit ──
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormError();

    const fields = Object.keys(VALIDATORS);
    const results = fields.map(validateField);
    if (results.includes(false)) {
      const firstInvalid = fields[results.indexOf(false)];
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    // Block until the captcha is solved — otherwise Web3Forms would reject the
    // order and (before this change) it would be lost silently.
    const token = getCaptchaToken();
    if (WEB3FORMS_ACCESS_KEY && !token) {
      showFormError('אנא אשרו שאתם לא רובוט לפני שליחת ההזמנה.');
      document.querySelector('.h-captcha')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    setLoading(true);
    const ok = await placeOrder(token);
    if (!ok) {
      // Keep the cart and the filled form; let the customer retry.
      setLoading(false);
      showFormError('אירעה תקלה בשליחת ההזמנה. נסו שוב — לא בוצע חיוב והפריטים נשמרו בעגלה.');
      resetCaptcha();
    }
  });

  async function placeOrder(token) {
    const orderNumber = generateOrderNumber();
    const val = (id) => (document.getElementById(id)?.value || '').trim();
    const customer = {
      email: val('email'),
      phone: val('phone'),
      firstName: val('firstName'),
      lastName: val('lastName'),
      address: val('address'),
      city: val('city'),
      zip: val('zip'),
    };

    // Only reveal the confirmation once the owner notification actually went
    // through — a captcha/network rejection must NOT look like a placed order.
    const sent = await sendOrderNotification(orderNumber, customer, token);
    if (!sent) return false;

    // Show success view
    checkoutMain.hidden = true;
    successView.hidden = false;
    document.getElementById('orderNumber').textContent = orderNumber;
    document.getElementById('orderEmail').textContent = customer.email;
    document.getElementById('orderTotal').textContent = formatPrice(subtotal);

    // Analytics: completed order is a purchase event (fire before clearing cart)
    if (window.OBSIZE_ANALYTICS) window.OBSIZE_ANALYTICS.purchase(orderNumber, items);

    // Clear cart
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}

    // Scroll to top
    window.scrollTo(0, 0);
    return true;
  }

  // Build a human-readable order and POST it to Web3Forms.
  // Returns true only when the API confirms delivery (success:true), so the
  // caller can keep the order intact on any failure.
  async function sendOrderNotification(orderNumber, customer, token) {
    if (!WEB3FORMS_ACCESS_KEY) return true; // not configured — pure demo, complete

    const lines = items.map(it => {
      const meta = [it.size && `מידה ${it.size}`, it.color].filter(Boolean).join(' · ');
      return `• ${it.name} (${meta}) ×${it.qty} — ${formatPrice(it.price * it.qty)}`;
    }).join('\n');

    const message =
      `הזמנה חדשה ${orderNumber}\n\n` +
      `— פריטים —\n${lines}\n\n` +
      `סה"כ: ${formatPrice(subtotal)}\n\n` +
      `— לקוח —\n` +
      `שם: ${customer.firstName} ${customer.lastName}\n` +
      `אימייל: ${customer.email}\n` +
      `טלפון: ${customer.phone}\n` +
      `כתובת: ${customer.address}, ${customer.city} ${customer.zip}`;

    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      // "[OBSIZE]" prefix is deliberate and must stay on every notification:
      // one inbox rule (subject contains "[OBSIZE]" → never spam) then catches
      // all of them. Web3Forms mail lands in spam by default, so this prefix is
      // what keeps a real order from being missed.
      subject: `[OBSIZE] הזמנה חדשה ${orderNumber}`,
      from_name: 'OBSIZE Orders',
      // Captcha Protection token — required, never a card field
      'h-captcha-response': token,
      // structured fields (also shown in the Web3Forms dashboard/email)
      order_number: orderNumber,
      customer_name: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      phone: customer.phone,
      address: `${customer.address}, ${customer.city} ${customer.zip}`,
      total: formatPrice(subtotal),
      message,
    };

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      return res.ok && data && data.success === true;
    } catch (e) {
      return false;
    }
  }

  function generateOrderNumber() {
    const ts = Date.now().toString(36).toUpperCase().slice(-5);
    const rnd = Math.random().toString(36).toUpperCase().slice(2, 5);
    return `OBS-${ts}${rnd}`;
  }
})();
