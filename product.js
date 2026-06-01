// Product page logic. Reads ?id=<id> from URL, populates the template.
(function() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const product = id && window.PRODUCTS ? window.PRODUCTS[id] : null;

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
  let selectedColor = product.colors[0];
  let selectedSize = product.sizes.find(s => s.label === product.defaultSize && !s.soldOut)
    || product.sizes.find(s => !s.soldOut)
    || null;
  let qty = 1;

  // ── Helpers ──
  const formatPrice = (v) => `₪${v.toLocaleString('he-IL')}`;
  const escapeHTML = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const SHIRT_SVG = '<svg class="shirt-placeholder" viewBox="0 0 200 240" fill="white"><path d="M130 20 L170 45 L155 65 L140 55 L140 200 L60 200 L60 55 L45 65 L30 45 L70 20 Q85 10 100 10 Q115 10 130 20Z"/></svg>';

  // ── Populate static fields ──
  document.title = `OBSIZE — ${product.name}`;
  document.getElementById('pdpBreadcrumbName').textContent = product.name;
  document.getElementById('pdpTag').textContent = product.tag || '';
  document.getElementById('pdpName').textContent = product.name;
  document.getElementById('pdpPrice').textContent = formatPrice(product.price);
  document.getElementById('pdpDescription').textContent = product.description;

  // ── SEO meta tags ──
  const BASE_URL = 'https://obsize.com';
  const productUrl = `${BASE_URL}/product.html?id=${encodeURIComponent(product.id)}`;
  const productImageUrl = product.images && product.images[0]
    ? `${BASE_URL}/${encodeURI(product.images[0])}`
    : `${BASE_URL}/favicon.svg`;
  const shortDesc = product.description.length > 160
    ? product.description.slice(0, 157) + '…'
    : product.description;
  const seoTitle = `${product.name} — OBSIZE`;

  const setMeta = (id, attr, value) => {
    const el = document.getElementById(id);
    if (el) el.setAttribute(attr, value);
  };
  setMeta('metaDescription', 'content', shortDesc);
  setMeta('metaCanonical', 'href', productUrl);
  setMeta('metaOgTitle', 'content', seoTitle);
  setMeta('metaOgDescription', 'content', shortDesc);
  setMeta('metaOgUrl', 'content', productUrl);
  setMeta('metaOgImage', 'content', productImageUrl);
  setMeta('metaTwTitle', 'content', seoTitle);
  setMeta('metaTwDescription', 'content', shortDesc);
  setMeta('metaTwImage', 'content', productImageUrl);

  // Schema.org Product JSON-LD
  const hasAvailableSize = product.sizes.some(s => !s.soldOut);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: productImageUrl,
    brand: { '@type': 'Brand', name: 'OBSIZE' },
    sku: product.id,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'ILS',
      price: product.price,
      availability: hasAvailableSize
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };
  const ldScript = document.getElementById('productJsonLd');
  if (ldScript) ldScript.textContent = JSON.stringify(jsonLd);

  // Main image / placeholder
  const mainImage = document.getElementById('pdpMainImage');
  if (product.images && product.images.length > 0) {
    mainImage.innerHTML = `<img src="${escapeHTML(product.images[0])}" alt="${escapeHTML(product.name)}" />`;
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
      const classes = ['pdp-size'];
      if (s.soldOut) classes.push('sold-out');
      if (isSelected) classes.push('selected');
      return `<button type="button" class="${classes.join(' ')}" data-index="${i}"${s.soldOut ? ' disabled aria-disabled="true"' : ''}>${escapeHTML(s.label)}</button>`;
    }).join('');
    if (selectedSize && selectedSize.soldOut) {
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

  // ── Size guide stub ──
  document.getElementById('pdpSizeGuide').addEventListener('click', () => {
    alert('מדריך מידות מפורט יתווסף בקרוב 📏');
  });

  // ── Related products ──
  const related = Object.values(window.PRODUCTS).filter(p => p.id !== product.id).slice(0, 3);
  if (related.length > 0) {
    const relatedSection = document.getElementById('pdpRelated');
    const relatedGrid = document.getElementById('pdpRelatedGrid');
    relatedGrid.innerHTML = related.map(p => {
      const img = p.images && p.images[0]
        ? `<img src="${escapeHTML(p.images[0])}" alt="${escapeHTML(p.name)}" />`
        : SHIRT_SVG;
      return `
        <a href="product.html?id=${encodeURIComponent(p.id)}" class="pdp-related-card">
          <div class="pdp-related-img">${img}</div>
          <p class="pdp-related-name">${escapeHTML(p.name)}</p>
          <p class="pdp-related-price">${formatPrice(p.price)}</p>
        </a>
      `;
    }).join('');
    relatedSection.hidden = false;
  }
})();
