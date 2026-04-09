/**
 * ============================================
 * EFFECTS & ANIMATIONS — SmartBook 3D v2.0
 * ============================================
 */

/* ---- TOAST NOTIFICATIONS ---- */
function showToast(type = 'info', title, message, duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const id = 'toast-' + Date.now();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.id = id;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="removeToast('${id}')">✕</button>
  `;

  container.appendChild(toast);

  setTimeout(() => removeToast(id), duration);
}

function removeToast(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none';
  el.style.opacity = '0';
  el.style.transform = 'translateX(100%)';
  el.style.transition = 'all 0.3s ease';
  setTimeout(() => el.remove(), 300);
}

/* ---- PAGE LOADER ---- */
function hidePageLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 1000);
  }
}

/* ---- SCROLL REVEAL ---- */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Một lần reveal là đủ
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children')
    .forEach(el => observer.observe(el));
}

/* ---- PARALLAX HERO ---- */
function initParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (scrollY < window.innerHeight) {
          const gridLines = hero.querySelector('.hero-grid-lines');
          if (gridLines) {
            gridLines.style.transform = `translateY(${scrollY * 0.3}px)`;
          }
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* ---- HEADER SCROLL EFFECT ---- */
function initHeaderScroll() {
  const header = document.getElementById('main-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* ---- COUNT UP ANIMATION ---- */
function initCountUp() {
  const counters = document.querySelectorAll('.count-up');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target || '0');
      const duration = 1800;
      const start = Date.now();

      function update() {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        // Easing: ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        el.textContent = current.toLocaleString('vi-VN') + (el.dataset.suffix || '');
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target.toLocaleString('vi-VN') + (el.dataset.suffix || '');
      }

      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

/* ---- FLOATING PARTICLES ---- */
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 18; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size   = Math.random() * 8 + 3;  // 3–11px
    const left   = Math.random() * 100;
    const delay  = Math.random() * 15;     // 0–15s
    const dur    = Math.random() * 20 + 15; // 15–35s
    const opac   = Math.random() * 0.25 + 0.08;

    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      opacity: ${opac};
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
    `;

    container.appendChild(particle);
  }
}

/* ---- SMOOTH NAVIGATION ---- */
function initSmoothNav() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 88; // header height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ---- CARD TILT EFFECT ---- */
function initCardTilt() {
  document.querySelectorAll('.feature-card, .room-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const maxTilt = 4;
      const tiltX = ((y - centerY) / centerY) * maxTilt;
      const tiltY = ((x - centerX) / centerX) * maxTilt;
      card.style.transform = `perspective(600px) rotateX(${-tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ---- INIT ALL ---- */
document.addEventListener('DOMContentLoaded', () => {
  // Ẩn loader
  hidePageLoader();

  // Khởi tạo tất cả effects
  initScrollReveal();
  initParallax();
  initHeaderScroll();
  initCountUp();
  initParticles();
  initSmoothNav();

  // Khởi tạo AuthManager
  AuthManager.init();

  // Card tilt (desktop only)
  if (window.innerWidth > 768) initCardTilt();

  // Set ngày tối thiểu trong search
  const dateInput = document.getElementById('search-date');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
    dateInput.value = new Date().toISOString().split('T')[0];
  }
});