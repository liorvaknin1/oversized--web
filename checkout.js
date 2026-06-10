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
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
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

  // ── Submit ──
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fields = Object.keys(VALIDATORS);
    const results = fields.map(validateField);
    if (results.includes(false)) {
      const firstInvalid = fields[results.indexOf(false)];
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    // Simulate order processing
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    submitBtn.querySelector('.checkout-submit-label').textContent = 'מעבד הזמנה...';

    setTimeout(() => {
      placeOrder();
    }, 900);
  });

  function placeOrder() {
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

    // Send the order to the shop owner by email (no card data included).
    // Fire before clearing the cart; failures never block the confirmation.
    sendOrderNotification(orderNumber, customer);

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
  }

  // Build a human-readable order and POST it to Web3Forms.
  function sendOrderNotification(orderNumber, customer) {
    if (!WEB3FORMS_ACCESS_KEY) return; // not configured yet — no-op

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
      subject: `הזמנה חדשה ${orderNumber} — OBSIZE`,
      from_name: 'OBSIZE Orders',
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
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => { /* ignore network errors — order still confirmed on screen */ });
    } catch (e) { /* ignore */ }
  }

  function generateOrderNumber() {
    const ts = Date.now().toString(36).toUpperCase().slice(-5);
    const rnd = Math.random().toString(36).toUpperCase().slice(2, 5);
    return `OBS-${ts}${rnd}`;
  }
})();
