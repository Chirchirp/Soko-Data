/* =============================================================
   SokoData Solutions — js/main.js  (COMPLETE FILE)
   ============================================================= */

/* ── 1. AOS ──────────────────────────────────────────────────── */
AOS.init({
  once:     true,
  duration: 800,
  offset:   80,
  easing:   'ease-out-cubic'
});

/* ── 2. Preloader ────────────────────────────────────────────── */
window.addEventListener('load', () => {
  const el = document.getElementById('preloader');
  if (!el) return;
  el.style.transition = 'opacity .5s ease';
  el.style.opacity    = '0';
  setTimeout(() => el.remove(), 520);
});

/* ── 3. Image fallback (local → CDN) ─────────────────────────── */
document.querySelectorAll('img[data-fallback]').forEach(img => {
  function loadFallback() {
    if (img.dataset.fallbackLoaded) return;
    img.dataset.fallbackLoaded = '1';
    img.src = img.dataset.fallback;
  }
  img.addEventListener('error', loadFallback);
  if (img.complete && img.naturalWidth === 0) loadFallback();
});

/* ── 4. Hero Carousel ────────────────────────────────────────── */
class HeroCarousel {
  constructor(selector) {
    this.wrap  = document.querySelector(selector);
    if (!this.wrap) return;
    this.items = Array.from(this.wrap.querySelectorAll('.carousel-item'));
    this.idx   = 0;
    this.timer = null;
    this._buildDots();
    this._show(0);
    this._play();
    this._bind();
  }

  _buildDots() {
    const container = this.wrap.querySelector('.carousel-indicators');
    if (!container) return;
    this.items.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', `Go to slide ${i + 1}`);
      d.addEventListener('click', () => { this._show(i); this._play(); });
      container.appendChild(d);
    });
  }

  _show(i) {
    this.items.forEach((item, n) => item.classList.toggle('hidden', n !== i));
    this.wrap.querySelectorAll('.carousel-dot')
             .forEach((d, n) => d.classList.toggle('active', n === i));
    this.idx = i;
  }

  _next() { this._show((this.idx + 1) % this.items.length); }
  _prev() { this._show((this.idx - 1 + this.items.length) % this.items.length); }

  _play() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this._next(), 7000);
  }

  _bind() {
    document.getElementById('heroNext')
      ?.addEventListener('click', () => { this._next(); this._play(); });
    document.getElementById('heroPrev')
      ?.addEventListener('click', () => { this._prev(); this._play(); });

    this.wrap.addEventListener('mouseenter', () => clearInterval(this.timer));
    this.wrap.addEventListener('mouseleave', () => this._play());

    // Touch swipe
    let sx = null;
    this.wrap.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    this.wrap.addEventListener('touchend',   e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) { dx < 0 ? this._next() : this._prev(); this._play(); }
      sx = null;
    }, { passive: true });
  }
}

new HeroCarousel('#heroCarousel');

/* ── 5. Year ─────────────────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── 6. Mobile menu ──────────────────────────────────────────── */
const menuBtn    = document.getElementById('menuButton');
const mobileMenu = document.getElementById('mobileMenu');

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = !mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden', open);
    menuBtn.setAttribute('aria-expanded', String(!open));
  });

  document.addEventListener('click', e => {
    if (!menuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.add('hidden');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  mobileMenu.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ── 7. Stat counters ────────────────────────────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      obs.unobserve(entry.target);
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10) || 0;
      const dur    = 1800;
      const step   = Math.ceil(target / (dur / 16));
      let cur      = 0;
      const tick   = () => {
        cur = Math.min(cur + step, target);
        el.textContent = cur.toLocaleString();
        if (cur < target) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => obs.observe(c));
})();

/* ── 8. CSV browser uploader (PapaParse) ─────────────────────── */
const csvInput    = document.getElementById('csvUpload');
const csvPreview  = document.getElementById('csvPreview');
const uploadLabel = document.querySelector('.upload-label');

if (csvInput && csvPreview && typeof Papa !== 'undefined') {

  // Click-to-browse
  uploadLabel?.addEventListener('click', e => {
    if (e.target.tagName === 'A') return; // don't intercept download link
    csvInput.click();
  });

  // Drag-over
  uploadLabel?.addEventListener('dragover', e => {
    e.preventDefault();
    uploadLabel.style.borderColor = 'var(--primary)';
    uploadLabel.style.background  = 'rgba(26,115,232,.2)';
  });
  uploadLabel?.addEventListener('dragleave', () => {
    uploadLabel.style.borderColor = '';
    uploadLabel.style.background  = '';
  });
  uploadLabel?.addEventListener('drop', e => {
    e.preventDefault();
    uploadLabel.style.borderColor = '';
    uploadLabel.style.background  = '';
    const file = e.dataTransfer?.files[0];
    if (file && file.name.endsWith('.csv')) parseCSV(file);
  });

  csvInput.addEventListener('change', () => {
    const file = csvInput.files[0];
    if (file) parseCSV(file);
  });
}

function parseCSV(file) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete({ data, meta }) {
      if (!data.length) {
        csvPreview.innerHTML = '<p class="text-red-400 mt-3 text-sm">No data found in the CSV.</p>';
        return;
      }
      const cols    = meta.fields || [];
      const preview = data.slice(0, 8);
      const numCols = cols.filter(c => !isNaN(parseFloat(data[0]?.[c]))).length;

      // Stats pills
      const statsHtml = `
        <div class="csv-stats">
          <span class="csv-stat-pill">📄 ${esc(file.name)}</span>
          <span class="csv-stat-pill">🗂 ${data.length.toLocaleString()} rows</span>
          <span class="csv-stat-pill">📊 ${cols.length} columns</span>
          <span class="csv-stat-pill">🔢 ${numCols} numeric cols</span>
        </div>`;

      // Table
      let tableHtml = `
        <table role="table" aria-label="CSV preview">
          <thead><tr>${cols.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>
            ${preview.map(row =>
              `<tr>${cols.map(c => `<td>${esc(String(row[c] ?? ''))}</td>`).join('')}</tr>`
            ).join('')}
          </tbody>
        </table>`;

      if (data.length > 8) {
        tableHtml += `<p class="text-gray-400 text-xs mt-2 text-right">Showing 8 of ${data.length.toLocaleString()} rows.</p>`;
      }

      csvPreview.innerHTML = statsHtml + tableHtml;
    },
    error(err) {
      csvPreview.innerHTML = `<p class="text-red-400 mt-3 text-sm">Error: ${esc(err.message)}</p>`;
    }
  });
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

/* ── 9. Contact form feedback ────────────────────────────────── */
const contactForm    = document.getElementById('contactFormModal');
const formMsgEl      = document.getElementById('modalFormMessage');

if (contactForm && formMsgEl) {
  contactForm.addEventListener('submit', () => {
    formMsgEl.innerHTML =
      '<span style="color:#16a34a;font-weight:600;">✅ Your mail client will open. Alternatively, email us at ' +
      '<a href="mailto:hello@sokodatasolutions.com" style="text-decoration:underline;">hello@sokodatasolutions.com</a></span>';
  });
}

/* ── 10. Smooth-scroll for all same-page anchor links ─────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const headerH = document.getElementById('header')?.offsetHeight || 64;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
