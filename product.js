// Product page logic. Reads ?id=<id> from URL, populates the template.
(function() {
  // id comes from ?id=<id> (product.html) or from <body data-product-id>
  // (the static per-product pages generated for social-share OG tags).
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || document.body.dataset.productId || null;
  // hasOwnProperty guard: a crafted id like "__proto__" or "constructor" must
  // resolve to "not found", not to an Object.prototype member (which crashes).
  const product = id && window.PRODUCTS && Object.prototype.hasOwnProperty.call(window.PRODUCTS, id)
    ? window.PRODUCTS[id]
    : null;

  const pdp = document.getElementById('pdp');
  if (!pdp) return;

  if (!product) {
    pdp.innerHTML = `
      <div class="pdp-not-found">
        <h1>מוצר לא נמצא</h1>
        <p>הקישור שאליו הגעת אינו תקף.</p>
        <a href="index.html#products" class="btn btn-primary">חזרה לקולקציה</a>
      </div>
    `;
    document.title = 'OBSIZE — מוצר לא נמצא';
    return;
  }

  // ── State ──
  // Pre-launch products aren't purchasable at all, so per-size sold-out marks
  // are meaningless there (nothing has shipped yet). Treat every size as
  // pickable so the waitlist can capture which size the visitor actually wants.
  const isAvailable = product.available !== false;
  const sizeBlocked = (s) => isAvailable && s.soldOut;

  let selectedColor = product.colors[0];
  let selectedSize = product.sizes.find(s => s.label === product.defaultSize && !sizeBlocked(s))
    || product.sizes.find(s => !sizeBlocked(s))
    || null;
  let qty = 1;

  // ── Helpers ──
  const formatPrice = (v) => `₪${v.toLocaleString('he-IL')}`;
  const escapeHTML = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const SHIRT_SVG = '<svg class="shirt-placeholder" viewBox="0 0 200 240" fill="white"><path d="M130 20 L170 45 L155 65 L140 55 L140 200 L60 200 L60 55 L45 65 L30 45 L70 20 Q85 10 100 10 Q115 10 130 20Z"/></svg>';

  // ── Populate static fields ──
  document.title = `${product.name} — OBSIZE`;
  document.getElementById('pdpBreadcrumbName').textContent = product.name;
  // A pre-launch item must not be labelled "NEW DROP" — that reads as "out
  // now" and contradicts the waitlist directly below it.
  const tagEl = document.getElementById('pdpTag');
  tagEl.textContent = isAvailable ? (product.tag || '') : 'בקרוב';
  tagEl.classList.toggle('pdp-tag-soon', !isAvailable);
  document.getElementById('pdpName').textContent = product.name;
  document.getElementById('pdpPrice').textContent = formatPrice(product.price);
  document.getElementById('pdpDescription').textContent = product.description;

  // ── SEO meta tags ──
  const BASE_URL = 'https://obsize.com';
  // Canonical is the static per-product page (crawlable, real OG tags baked in)
  const productUrl = `${BASE_URL}/product-${encodeURIComponent(product.id)}.html`;
  // Social share image: a 1200x630 branded OG card per product when one exists,
  // otherwise the generic site card. Never the raw portrait photo — WhatsApp and
  // Facebook need a landscape 1.91:1 image to render the link preview correctly.
  const ogImageUrl = product.ogImage
    ? `${BASE_URL}/${product.ogImage}`
    : `${BASE_URL}/og-image.png`;
  const shortDesc = product.description.length > 160
    ? product.description.slice(0, 157) + '…'
    : product.description;
  const seoTitle = `${product.name} — OBSIZE`;
  const ogAlt = `OBSIZE — ${product.name}`;

  const setMeta = (id, attr, value) => {
    const el = document.getElementById(id);
    if (el) el.setAttribute(attr, value);
  };
  setMeta('metaDescription', 'content', shortDesc);
  setMeta('metaCanonical', 'href', productUrl);
  setMeta('metaOgTitle', 'content', seoTitle);
  setMeta('metaOgDescription', 'content', shortDesc);
  setMeta('metaOgUrl', 'content', productUrl);
  setMeta('metaOgImage', 'content', ogImageUrl);
  setMeta('metaOgImageSecure', 'content', ogImageUrl);
  setMeta('metaOgImageAlt', 'content', ogAlt);
  setMeta('metaTwTitle', 'content', seoTitle);
  setMeta('metaTwDescription', 'content', shortDesc);
  setMeta('metaTwImage', 'content', ogImageUrl);
  setMeta('metaTwImageAlt', 'content', ogAlt);

  // Schema.org Product JSON-LD — prefers the real product photo (Google product
  // rich results accept any aspect ratio), falling back to the branded OG card.
  const schemaImageUrl = product.images && product.images[0]
    ? `${BASE_URL}/${encodeURI(product.images[0])}`
    : ogImageUrl;
  const hasAvailableSize = product.sizes.some(s => !s.soldOut);
  // Pre-launch → PreOrder (an honest "not yet released"), rather than
  // OutOfStock which tells Google the catalog is dead stock.
  const schemaAvailability = !isAvailable
    ? 'https://schema.org/PreOrder'
    : (hasAvailableSize ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: schemaImageUrl,
    brand: { '@type': 'Brand', name: 'OBSIZE' },
    sku: product.id,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'ILS',
      price: product.price,
      availability: schemaAvailability,
    },
  };
  const ldScript = document.getElementById('productJsonLd');
  if (ldScript) ldScript.textContent = JSON.stringify(jsonLd);

  // Analytics: viewing a product page is a view_item event
  if (window.OBSIZE_ANALYTICS) {
    window.OBSIZE_ANALYTICS.viewItem({ id: product.id, name: product.name, price: product.price });
  }

  // Main image + thumbnail gallery
  const mainImage = document.getElementById('pdpMainImage');
  const thumbsEl = document.getElementById('pdpThumbnails');
  const toWebp = (p) => p.replace(/\.(jpe?g|png)$/i, '.webp');
  const galleryImgs = (product.images || []).filter(Boolean);
  function renderMainImage(src) {
    mainImage.innerHTML = `
      <picture>
        <source srcset="${escapeHTML(toWebp(src))}" type="image/webp" />
        <img src="${escapeHTML(src)}" alt="${escapeHTML(product.name)}" />
      </picture>`;
  }
  if (galleryImgs.length > 0) {
    renderMainImage(galleryImgs[0]);
    if (galleryImgs.length > 1) {
      thumbsEl.innerHTML = galleryImgs.map((src, i) => `
        <button type="button" class="pdp-thumb${i === 0 ? ' active' : ''}" data-src="${escapeHTML(src)}" aria-label="תצוגה ${i + 1} של ${escapeHTML(product.name)}"${i === 0 ? ' aria-current="true"' : ''}>
          <picture>
            <source srcset="${escapeHTML(toWebp(src))}" type="image/webp" />
            <img src="${escapeHTML(src)}" alt="" loading="lazy" />
          </picture>
        </button>`).join('');
      thumbsEl.hidden = false;
      thumbsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.pdp-thumb');
        if (!btn) return;
        renderMainImage(btn.dataset.src);
        thumbsEl.querySelectorAll('.pdp-thumb').forEach(b => {
          const on = b === btn;
          b.classList.toggle('active', on);
          if (on) b.setAttribute('aria-current', 'true');
          else b.removeAttribute('aria-current');
        });
      });
    }
  } else {
    mainImage.innerHTML = SHIRT_SVG;
    mainImage.classList.add('is-placeholder');
  }

  // Details list
  const detailsList = document.getElementById('pdpDetailsList');
  detailsList.innerHTML = product.details.map(d => `<li>${escapeHTML(d)}</li>`).join('');

  // ── Colors ──
  const colorsEl = document.getElementById('pdpColors');
  const colorNameEl = document.getElementById('pdpColorName');
  function renderColors() {
    colorsEl.innerHTML = product.colors.map((c, i) => {
      const isSelected = c.name === selectedColor.name;
      const border = c.border ? `border-color:${c.border};` : '';
      return `<button type="button" class="pdp-color${isSelected ? ' selected' : ''}" data-index="${i}" style="background:${c.hex};${border}" aria-label="${escapeHTML(c.name)}" title="${escapeHTML(c.name)}"></button>`;
    }).join('');
    colorNameEl.textContent = selectedColor.name;
  }
  colorsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.pdp-color');
    if (!btn) return;
    const idx = parseInt(btn.dataset.index, 10);
    selectedColor = product.colors[idx];
    renderColors();
  });
  renderColors();

  // ── Sizes ──
  const sizesEl = document.getElementById('pdpSizes');
  const sizeNoteEl = document.getElementById('pdpSizeNote');
  function renderSizes() {
    sizesEl.innerHTML = product.sizes.map((s, i) => {
      const isSelected = selectedSize && s.label === selectedSize.label;
      const blocked = sizeBlocked(s);
      const classes = ['pdp-size'];
      if (blocked) classes.push('sold-out');
      if (isSelected) classes.push('selected');
      return `<button type="button" class="${classes.join(' ')}" data-index="${i}"${blocked ? ' disabled aria-disabled="true"' : ''}>${escapeHTML(s.label)}</button>`;
    }).join('');
    if (selectedSize && sizeBlocked(selectedSize)) {
      sizeNoteEl.hidden = false;
      sizeNoteEl.textContent = 'המידה אזלה — תהיה זמינה במלאי בקרוב';
    } else {
      sizeNoteEl.hidden = true;
    }
  }
  sizesEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.pdp-size');
    if (!btn || btn.disabled) return;
    const idx = parseInt(btn.dataset.index, 10);
    selectedSize = product.sizes[idx];
    renderSizes();
  });
  renderSizes();

  // ── Quantity ──
  const qtyEl = document.getElementById('pdpQty');
  document.querySelectorAll('.pdp-qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'inc') qty = Math.min(99, qty + 1);
      else if (action === 'dec') qty = Math.max(1, qty - 1);
      qtyEl.textContent = qty;
    });
  });

  // ── Add to cart ──
  const addBtn = document.getElementById('pdpAdd');
  addBtn.addEventListener('click', () => {
    if (!isAvailable) return; // pre-launch: the waitlist form replaces this
    if (!selectedSize || selectedSize.soldOut) {
      addBtn.classList.add('shake');
      setTimeout(() => addBtn.classList.remove('shake'), 400);
      return;
    }
    // Use the shared cart API exposed by script.js
    if (window.OBSIZE_CART && typeof window.OBSIZE_CART.add === 'function') {
      window.OBSIZE_CART.add({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images && product.images[0] ? product.images[0] : '',
        size: selectedSize.label,
        color: selectedColor.name,
        qty,
      });
      window.OBSIZE_CART.open();
    } else {
      // Fallback: write directly to localStorage
      try {
        const key = 'obsize_cart_v1';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const sig = `${product.id}::${selectedSize.label}::${selectedColor.name}`;
        const found = existing.find(it => `${it.id}::${it.size}::${it.color}` === sig);
        if (found) found.qty += qty;
        else existing.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images && product.images[0] ? product.images[0] : '',
          size: selectedSize.label,
          color: selectedColor.name,
          qty,
        });
        localStorage.setItem(key, JSON.stringify(existing));
        window.location.reload();
      } catch (e) {}
    }
  });

  // ── Pre-launch ("בקרוב") waitlist ──
  // Swaps the buy controls for a notify-me form and posts signups to the shop
  // owner via Web3Forms, including the size/colour the visitor picked — that is
  // the whole point: it tells us what to actually order before we hold stock.
  (function() {
    const form = document.getElementById('pdpNotifyForm');
    if (!form) return;

    const qtySection = document.getElementById('pdpQtySection');
    if (isAvailable) {
      form.hidden = true;
      return;
    }

    // Pre-launch layout: no quantity picker, no add-to-cart, show the waitlist.
    if (qtySection) qtySection.hidden = true;
    addBtn.hidden = true;
    form.hidden = false;

    // Same access key as the order form; it has hCaptcha Captcha Protection
    // enabled, so a token is mandatory here too.
    const WEB3FORMS_ACCESS_KEY = '4a44305b-2c8b-47c6-8a17-d873e3c84ee8';
    const emailInput = document.getElementById('pdpNotifyEmail');
    const btn = document.getElementById('pdpNotifyBtn');
    const msg = document.getElementById('pdpNotifyMsg');

    function showMsg(text, ok) {
      msg.textContent = text;
      msg.hidden = false;
      msg.classList.toggle('is-error', !ok);
    }
    function getToken() {
      const el = form.querySelector('[name="h-captcha-response"]');
      return el && el.value ? el.value.trim() : '';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.hidden = true;

      const email = (emailInput.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMsg('כתובת אימייל לא תקינה', false);
        emailInput.focus();
        return;
      }
      const token = getToken();
      if (!token) {
        showMsg('אנא אשרו שאתם לא רובוט.', false);
        return;
      }

      btn.disabled = true;
      btn.textContent = 'שולח...';

      const variant = [selectedSize && selectedSize.label, selectedColor && selectedColor.name]
        .filter(Boolean).join(' · ');
      const payload = {
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `רישום לרשימת המתנה — ${product.name}`,
        from_name: 'OBSIZE Waitlist',
        'h-captcha-response': token,
        product: product.name,
        product_id: product.id,
        variant: variant || '(לא נבחר)',
        email,
        message:
          `רישום חדש לרשימת המתנה\n\n` +
          `מוצר: ${product.name} (${product.id})\n` +
          `מידה/צבע מבוקשים: ${variant || '(לא נבחר)'}\n` +
          `אימייל: ${email}`,
      };

      let ok = false;
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        ok = res.ok && data && data.success === true;
      } catch (err) { ok = false; }

      if (ok) {
        form.reset();
        try { if (window.hcaptcha) window.hcaptcha.reset(); } catch (err) {}
        btn.hidden = true;
        showMsg('נרשמת! נעדכן אותך ברגע שהפריט יוצא 🖤', true);
      } else {
        // Never claim success we didn't get — the signup would be lost silently.
        btn.disabled = false;
        btn.textContent = 'עדכנו אותי כשיוצא';
        try { if (window.hcaptcha) window.hcaptcha.reset(); } catch (err) {}
        showMsg('אירעה תקלה. נסו שוב בעוד רגע.', false);
      }
    });
  })();

  // ── Size guide modal ──
  // NOTE: measurements below are standard oversized drop-shoulder specs —
  // verify against the actual garments and adjust here if needed.
  (function() {
    const SIZE_CHART = [
      { size: 'S',   chest: 55, length: 70, shoulder: 52 },
      { size: 'M',   chest: 57, length: 72, shoulder: 54 },
      { size: 'L',   chest: 59, length: 74, shoulder: 56 },
      { size: 'XL',  chest: 61, length: 76, shoulder: 58 },
      { size: 'XXL', chest: 63, length: 78, shoulder: 60 },
    ];

    let modal = null;
    let lastFocus = null;

    function buildModal() {
      if (modal) return modal;
      modal = document.createElement('div');
      modal.className = 'size-guide-backdrop';
      modal.innerHTML = `
        <div class="size-guide-modal" role="dialog" aria-modal="true" aria-labelledby="sizeGuideTitle">
          <div class="size-guide-header">
            <h2 id="sizeGuideTitle">מדריך מידות</h2>
            <button type="button" class="size-guide-close" aria-label="סגירה">×</button>
          </div>
          <p class="size-guide-note">כל המידות בס"מ, נמדדות כשהחולצה שטוחה. הגזרה oversized — לגזרה צמודה יותר, רדו מידה.</p>
          <table class="size-guide-table">
            <thead>
              <tr><th>מידה</th><th>רוחב חזה</th><th>אורך</th><th>כתפיים</th></tr>
            </thead>
            <tbody>
              ${SIZE_CHART.map(r => `<tr><td>${r.size}</td><td>${r.chest}</td><td>${r.length}</td><td>${r.shoulder}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>`;

      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('.size-guide-close')) closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
      });
      document.body.appendChild(modal);
      return modal;
    }

    function openModal() {
      lastFocus = document.activeElement;
      buildModal();
      void modal.offsetWidth; // reflow so the open transition runs
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      modal.querySelector('.size-guide-close').focus();
    }

    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }

    document.getElementById('pdpSizeGuide').addEventListener('click', openModal);
  })();

  // ── Related products ──
  const related = Object.values(window.PRODUCTS).filter(p => p.id !== product.id).slice(0, 3);
  if (related.length > 0) {
    const relatedSection = document.getElementById('pdpRelated');
    const relatedGrid = document.getElementById('pdpRelatedGrid');
    relatedGrid.innerHTML = related.map(p => {
      const img = p.images && p.images[0]
        ? `<img src="${escapeHTML(p.images[0])}" alt="${escapeHTML(p.name)}" loading="lazy" />`
        : SHIRT_SVG;
      // Carry the pre-launch state here too, otherwise these read as buyable
      // and the visitor only finds out after clicking through.
      const soonHTML = p.available === false
        ? '<span class="pdp-related-soon">בקרוב</span>'
        : '';
      return `
        <a href="product-${encodeURIComponent(p.id)}.html" class="pdp-related-card">
          <div class="pdp-related-img">${img}${soonHTML}</div>
          <p class="pdp-related-name">${escapeHTML(p.name)}</p>
          <p class="pdp-related-price">${formatPrice(p.price)}</p>
        </a>
      `;
    }).join('');
    relatedSection.hidden = false;
  }
})();
