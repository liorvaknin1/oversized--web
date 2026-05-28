    // ── Hero Parallax ──
    (function() {
      const hero = document.getElementById('hero');
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
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });

    // ── Mobile menu ──
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    function closeMobileMenu() {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    }

    // Close mobile menu on outside click
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
        closeMobileMenu();
      }
    });

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
      dots.forEach(dot => {
        dot.addEventListener('click', () => {
          dots.forEach(d => d.style.outline = '');
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
