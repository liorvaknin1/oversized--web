    // ── Render product grid from catalog ──
    (function() {
      const grid = document.getElementById('productsGrid');
      if (!grid || !window.PRODUCTS) return;

      const SHIRT_SVG = '<svg class="shirt-placeholder" viewBox="0 0 200 240" fill="white"><path d="M130 20 L170 45 L155 65 L140 55 L140 200 L60 200 L60 55 L45 65 L30 45 L70 20 Q85 10 100 10 Q115 10 130 20Z"/></svg>';

      const escapeHTML = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
      const formatPrice = (v) => `₪${v.toLocaleString('he-IL')}`;

      grid.innerHTML = Object.values(window.PRODUCTS).map((p, i) => {
        const imgHTML = p.images && p.images[0]
          ? `<img src="${escapeHTML(p.images[0])}" alt="${escapeHTML(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;object-position:center top;position:absolute;inset:0;" />`
          : SHIRT_SVG;

        const colorsHTML = p.colors.map(c => {
          const border = c.border ? `border-color:${c.border};` : '';
          return `<div class="color-dot" style="background:${c.hex};${border}" title="${escapeHTML(c.name)}"></div>`;
        }).join('');

        const dataAttrs = [
          `data-product-id="${escapeHTML(p.id)}"`,
          `data-product-name="${escapeHTML(p.name)}"`,
          `data-product-price="${p.price}"`,
          `data-product-size="${escapeHTML(p.defaultSize || '')}"`,
          `data-product-color="${escapeHTML(p.colors[0] ? p.colors[0].name : '')}"`,
          p.images && p.images[0] ? `data-product-image="${escapeHTML(p.images[0])}"` : '',
        ].filter(Boolean).join(' ');

        const delayClass = `reveal-delay-${(i % 4) + 1}`;

        return `
          <div class="product-card reveal ${delayClass}" ${dataAttrs}>
            <div class="product-img">
              ${imgHTML}
              <span class="product-badge">NEW</span>
              <button class="quick-add add-to-cart-btn" aria-label="הוספה מהירה לסל של ${escapeHTML(p.name)}">+</button>
            </div>
            <div class="product-info">
              <h3 class="product-name">${escapeHTML(p.name)}</h3>
              <p class="product-price">${formatPrice(p.price)}</p>
              <div class="product-colors">${colorsHTML}</div>
            </div>
          </div>
        `;
      }).join('');
    })();

    // ── Hero Parallax ──
    (function() {
      const hero = document.getElementById('hero');
      if (!hero) return;
      const layers = hero.querySelectorAll('[data-parallax-speed]');

      // Mouse-move parallax (desktop only)
      let mouseX = 0, mouseY = 0;
      let curX = 0, curY = 0;
      let rafId = null;

      function lerp(a, b, t) { return a + (b - a) * t; }

      function tick() {
        curX = lerp(curX, mouseX, 0.06);
        curY = lerp(curY, mouseY, 0.06);

        layers.forEach(el => {
          const speed = parseFloat(el.dataset.parallaxSpeed);
          const tx = curX * speed;
          const ty = curY * speed;
          el.style.transform = `translate(${tx}px, ${ty}px)`;
        });

        rafId = requestAnimationFrame(tick);
      }

      hero.addEventListener('mousemove', e => {
        const rect = hero.getBoundingClientRect();
        mouseX = (e.clientX - rect.left - rect.width  / 2);
        mouseY = (e.clientY - rect.top  - rect.height / 2);
      }, { passive: true });

      hero.addEventListener('mouseleave', () => {
        mouseX = 0; mouseY = 0;
      }, { passive: true });

      // Only run on non-touch devices
      if (window.matchMedia('(hover: hover)').matches) {
        tick();
      }

      // Scroll-based vertical shift for the visual card
      const heroVisual = hero.querySelector('.hero-visual');
      const heroContent = hero.querySelector('.hero-content');
      const ghostText   = hero.querySelector('.hero-ghost-text');

      window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY > window.innerHeight) return;
        const pct = scrollY / window.innerHeight;

        if (heroVisual)  heroVisual.style.transform  = `translateY(${pct * 60}px)`;
        if (heroContent) heroContent.style.transform = `translateY(${pct * 30}px)`;
        if (ghostText)   ghostText.style.transform   = `translate(-50%, calc(-50% + ${pct * 80}px))`;
      }, { passive: true });
    })();

    // ── Navbar scroll opacity ──
    const navbar = document.getElementById('navbar');
    if (navbar) {
      window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
      }, { passive: true });
    }

    // ── Mobile menu ──
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });
    }

    function closeMobileMenu() {
      if (!mobileMenu) return;
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    }

    // Close the mobile menu when any of its links is clicked.
    // (Wired here instead of inline onclick handlers so the CSP can forbid
    // inline scripts entirely.)
    if (mobileMenu) {
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
      });
    }

    // Close mobile menu on outside click
    if (navbar && mobileMenu) {
      document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
          closeMobileMenu();
        }
      });
    }

    // ── Scroll reveal ──
    const revealEls = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));

    // ── Size selection ──
    document.querySelectorAll('.product-sizes').forEach(group => {
      group.querySelectorAll('.size-btn:not(.sold-out)').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    });

    // ── Product color selection ──
    document.querySelectorAll('.product-colors').forEach(group => {
      const dots = group.querySelectorAll('.color-dot');
      // Mark the first dot as selected by default
      if (dots[0]) {
        dots[0].classList.add('selected');
        dots[0].style.outline = '2px solid rgba(255,255,255,0.6)';
        dots[0].style.outlineOffset = '2px';
      }
      dots.forEach(dot => {
        dot.addEventListener('click', () => {
          dots.forEach(d => {
            d.classList.remove('selected');
            d.style.outline = '';
          });
          dot.classList.add('selected');
          dot.style.outline = '2px solid rgba(255,255,255,0.6)';
          dot.style.outlineOffset = '2px';
        });
      });
    });

    // ── Smooth scroll for nav links ──
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });

    // ── Cart ──
    (function() {
      const STORAGE_KEY = 'obsize_cart_v1';
      const drawer = document.getElementById('cartDrawer');
      const backdrop = document.getElementById('cartBackdrop');
      const toggleBtn = document.getElementById('cartToggle');
      const closeBtn = document.getElementById('cartClose');
      const badge = document.getElementById('cartBadge');
      const itemsEl = document.getElementById('cartItems');
      const emptyEl = document.getElementById('cartEmpty');
      const footerEl = document.getElementById('cartFooter');
      const totalEl = document.getElementById('cartTotal');
      const checkoutBtn = document.getElementById('cartCheckout');

      if (!drawer || !backdrop || !toggleBtn || !itemsEl) return;

      let items = loadCart();

      function loadCart() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch (e) {
          return [];
        }
      }

      function saveCart() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {}
      }

      function itemKey(item) {
        return `${item.id}::${item.size}::${item.color}`;
      }

      function formatPrice(value) {
        return `₪${value.toLocaleString('he-IL')}`;
      }

      function getTotalCount() {
        return items.reduce((sum, it) => sum + it.qty, 0);
      }

      function getSubtotal() {
        return items.reduce((sum, it) => sum + it.price * it.qty, 0);
      }

      // Reusable shirt placeholder for products with no image
      const SHIRT_SVG = '<svg viewBox="0 0 200 240" aria-hidden="true"><path d="M130 20 L170 45 L155 65 L140 55 L140 200 L60 200 L60 55 L45 65 L30 45 L70 20 Q85 10 100 10 Q115 10 130 20Z"/></svg>';

      function render() {
        const hasItems = items.length > 0;
        emptyEl.hidden = hasItems;
        itemsEl.hidden = !hasItems;
        footerEl.hidden = !hasItems;

        const count = getTotalCount();
        if (count > 0) {
          badge.textContent = count > 99 ? '99+' : String(count);
          badge.hidden = false;
        } else {
          badge.hidden = true;
        }

        totalEl.textContent = formatPrice(getSubtotal());

        itemsEl.innerHTML = items.map(it => {
          const imgHTML = it.image
            ? `<img src="${escapeAttr(it.image)}" alt="${escapeAttr(it.name)}" />`
            : SHIRT_SVG;
          const meta = [it.size && `מידה ${it.size}`, it.color].filter(Boolean).join(' · ');
          const key = itemKey(it);
          return `
            <div class="cart-item" data-key="${escapeAttr(key)}">
              <div class="cart-item-img">${imgHTML}</div>
              <div class="cart-item-info">
                <p class="cart-item-name">${escapeHTML(it.name)}</p>
                <p class="cart-item-meta">${escapeHTML(meta)}</p>
                <div class="cart-item-qty">
                  <button class="cart-qty-btn" data-action="dec" aria-label="הפחת"${it.qty <= 1 ? ' disabled' : ''}>−</button>
                  <span class="cart-qty-value">${it.qty}</span>
                  <button class="cart-qty-btn" data-action="inc" aria-label="הוסף">+</button>
                </div>
              </div>
              <div class="cart-item-right">
                <span class="cart-item-price">${formatPrice(it.price * it.qty)}</span>
                <button class="cart-item-remove" data-action="remove">הסר</button>
              </div>
            </div>
          `;
        }).join('');
      }

      function escapeHTML(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
      }
      function escapeAttr(s) { return escapeHTML(s); }

      function openDrawer() {
        drawer.classList.add('open');
        backdrop.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        // Re-enable interaction + screen-reader access while open
        drawer.removeAttribute('inert');
        document.body.style.overflow = 'hidden';
      }

      function closeDrawer() {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        // inert removes the off-screen drawer's controls from the tab order
        // and the accessibility tree while it is closed
        drawer.setAttribute('inert', '');
        document.body.style.overflow = '';
      }

      function addItem(newItem) {
        const key = itemKey(newItem);
        const existing = items.find(it => itemKey(it) === key);
        if (existing) {
          existing.qty += newItem.qty;
        } else {
          items.push(newItem);
        }
        saveCart();
        render();
        if (window.OBSIZE_ANALYTICS) window.OBSIZE_ANALYTICS.addToCart(newItem);
      }

      function updateQty(key, delta) {
        const it = items.find(x => itemKey(x) === key);
        if (!it) return;
        it.qty = Math.max(1, it.qty + delta);
        saveCart();
        render();
      }

      function removeItem(key) {
        items = items.filter(x => itemKey(x) !== key);
        saveCart();
        render();
      }

      // ── Toast ──
      let toastEl;
      let toastTimer;
      function showToast(message) {
        if (!toastEl) {
          toastEl = document.createElement('div');
          toastEl.className = 'cart-toast';
          document.body.appendChild(toastEl);
        }
        toastEl.textContent = message;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
      }

      // ── Wire up "Add to cart" buttons ──
      document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const card = btn.closest('.product-card');
          if (!card) return;

          const id = card.dataset.productId;
          const name = card.dataset.productName;
          const price = parseInt(card.dataset.productPrice, 10);
          const image = card.dataset.productImage || '';

          // Homepage cards have no size picker (sizes live on the PDP); the quick-add
          // uses the product's default size. A size button is still honored if present
          // (e.g. on other layouts).
          const activeSize = card.querySelector('.size-btn.active:not(.sold-out)');
          const size = activeSize ? activeSize.textContent.trim() : (card.dataset.productSize || '');
          const selectedColor = card.querySelector('.color-dot.selected');
          const color = selectedColor
            ? (selectedColor.getAttribute('title') || '')
            : (card.dataset.productColor || '');

          if (!size) {
            showToast('בחר מידה זמינה');
            return;
          }

          addItem({ id, name, price, image, size, color, qty: 1 });

          showToast('נוסף לעגלה');
          openDrawer();
        });
      });

      // ── Drawer events ──
      toggleBtn.addEventListener('click', openDrawer);
      closeBtn.addEventListener('click', closeDrawer);
      backdrop.addEventListener('click', closeDrawer);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
      });

      // ── Cart item actions (event delegation) ──
      itemsEl.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (!action) return;
        const row = e.target.closest('.cart-item');
        const key = row?.dataset.key;
        if (!key) return;

        if (action === 'inc') updateQty(key, 1);
        else if (action === 'dec') updateQty(key, -1);
        else if (action === 'remove') removeItem(key);
      });

      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
          window.location.href = 'checkout.html';
        });
      }

      render();

      // Public API for other pages (e.g. product.js)
      window.OBSIZE_CART = {
        add: (item) => { addItem(item); showToast('נוסף לעגלה'); },
        open: openDrawer,
        close: closeDrawer,
      };
    })();

    // ── Product card navigation (homepage) ──
    document.querySelectorAll('.product-card[data-product-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't navigate if user clicked an interactive element
        if (e.target.closest('button, a, .color-dot, .add-to-cart-btn')) return;
        const id = card.dataset.productId;
        if (id) window.location.href = `product.html?id=${encodeURIComponent(id)}`;
      });
    });

    // ── Newsletter signup (footer) ──
    // Submits to Web3Forms (same free relay used for orders). To disable, remove
    // the form or blank WEB3FORMS_KEY — it then just shows a thank-you message.
    (function() {
      const form = document.getElementById('newsletterForm');
      if (!form) return;
      const WEB3FORMS_KEY = '4a44305b-2c8b-47c6-8a17-d873e3c84ee8';
      const emailInput = document.getElementById('newsletterEmail');
      const msg = document.getElementById('newsletterMsg');

      function showMsg(text, ok) {
        if (!msg) return;
        msg.textContent = text;
        msg.hidden = false;
        msg.classList.toggle('is-error', !ok);
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = (emailInput.value || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          showMsg('כתובת אימייל לא תקינה', false);
          return;
        }
        form.querySelector('.newsletter-btn').disabled = true;

        if (WEB3FORMS_KEY) {
          fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              access_key: WEB3FORMS_KEY,
              subject: 'OBSIZE — הרשמה לניוזלטר',
              from_name: 'OBSIZE Newsletter',
              email: email,
              message: 'הרשמה חדשה לניוזלטר: ' + email,
            }),
          }).catch(() => {});
        }
        form.reset();
        showMsg('תודה! קוד ההנחה בדרך אליך 🖤', true);
      });
    })();
