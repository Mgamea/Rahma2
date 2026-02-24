/* ============================================================
   RAHMA ISLAMIC CENTRE — shared.js  v3
   - Loader
   - Navbar scroll
   - Mobile menu (toggleMobile / closeMobile)
   - Reveal on scroll
   - formatTime helper
   - subscribeNewsletter
   - loadMawaqitPrayers  (Mawaqit → Aladhan fallback)
============================================================ */

/* ---------- LOADER ---------- */
window.addEventListener('load', () => {
  setTimeout(() => {
    const l = document.getElementById('loader');
    if (l) l.classList.add('hidden');
  }, 1600);
});

/* ---------- NAVBAR ---------- */
window.addEventListener('scroll', () => {
  const nb = document.getElementById('navbar');
  if (nb) nb.classList.toggle('scrolled', window.scrollY > 60);
});

/* ---------- MOBILE MENU ---------- */
let _mOpen = false;
function toggleMobile() {
  _mOpen = !_mOpen;
  document.getElementById('mobileMenu')?.classList.toggle('active', _mOpen);
  document.getElementById('hamburger')?.classList.toggle('active', _mOpen);
  document.body.style.overflow = _mOpen ? 'hidden' : '';
}
function closeMobile() {
  _mOpen = false;
  document.getElementById('mobileMenu')?.classList.remove('active');
  document.getElementById('hamburger')?.classList.remove('active');
  document.body.style.overflow = '';
}

/* ---------- REVEAL ON SCROLL ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.07 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
});

/* ---------- FORMAT TIME 24h → 12h ---------- */
function formatTime(raw) {
  if (!raw) return '—';
  const t = raw.split(' ')[0];          // strip timezone if any
  const [hh, mm] = t.split(':');
  let h = parseInt(hh, 10);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + mm + ' ' + ap;
}

/* ---------- NEWSLETTER ---------- */
function subscribeNewsletter(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]') || e.target.querySelector('.newsletter-btn');
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = '✓ Subscribed!';
  setTimeout(() => { btn.textContent = orig; e.target.reset(); }, 3000);
}

/* ---------- ADD MINUTES TO "HH:MM" ---------- */
function _addMins(timeStr, mins) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  return String(Math.floor(total / 60) % 24).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
}

/* ============================================================
   MAWAQIT PRAYER TIMES
   Usage on prayer-times.html and index.html:

   loadMawaqitPrayers({
     timeIds:  { fajr:'t-fajr', dhuhr:'t-dhuhr', asr:'t-asr', maghrib:'t-maghrib', isha:'t-isha' },
     cardIds:  { fajr:'tp-fajr', ... },   // optional – for active highlight
     iqamahIds: { fajr:'iq-fajr', ... },  // optional – shows iqamah +offset
     badgeId:  'apiBadge',                // optional – shows source
   });
============================================================ */
async function loadMawaqitPrayers(opts = {}) {
  let timings = null;

  /* 1 ▸ Mawaqit public API
     Replace the UUID below with the real UUID from your mosque's Mawaqit page.
     How to find it:
       a) Go to https://mawaqit.net and search "Rahma Winnipeg"
       b) Open the mosque page – the URL looks like:
          https://mawaqit.net/en/rahma-islamic-centre-winnipeg--uuid123
       c) The UUID is the last part after the dashes
     For now we try common slug patterns and fall through gracefully.
  */
  const MW_SLUG = 'rahma-islamic-centre-winnipeg'; // ← replace with real UUID if known
  const mwUrls = [
    `https://mawaqit.net/api/2.0/mosque/by-slug/${MW_SLUG}/prayer-times`,
    `https://mawaqit.net/fr/${MW_SLUG}?json=1`,
  ];
  for (const url of mwUrls) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const d = await r.json();
        // Format: { times: ["HH:MM", ...] }  0=Fajr 1=Shuruq 2=Dhuhr 3=Asr 4=Maghrib 5=Isha
        if (d.times && d.times.length >= 6) {
          timings = { Fajr: d.times[0], Sunrise: d.times[1], Dhuhr: d.times[2], Asr: d.times[3], Maghrib: d.times[4], Isha: d.times[5], _src: 'mawaqit' };
          break;
        }
      }
    } catch (_) { /* try next */ }
  }

  /* 2 ▸ Aladhan fallback (ISNA method, Winnipeg coordinates) */
  if (!timings) {
    try {
      const d = new Date();
      const url = `https://api.aladhan.com/v1/timings/${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}?latitude=49.8951&longitude=-97.1384&method=2`;
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = await r.json();
      if (data.code === 200) timings = { ...data.data.timings, _src: 'aladhan' };
    } catch (_) {}
  }

  /* 3 ▸ Static last-resort */
  if (!timings) {
    timings = { Fajr: '05:30', Dhuhr: '12:45', Asr: '15:30', Maghrib: '18:15', Isha: '19:45', _src: 'static' };
  }

  /* — Source badge — */
  const badge = document.getElementById(opts.badgeId || 'apiBadge');
  if (badge) {
    const colors = { mawaqit: '#4ade80', aladhan: '#fbbf24', static: '#9ca3af' };
    const labels = { mawaqit: 'Mawaqit.net ✓', aladhan: 'Aladhan API', static: 'Horaires statiques' };
    badge.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors[timings._src]};margin-right:8px"></span>${labels[timings._src]}`;
  }

  /* — Fill times — */
  const map = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
  const iqOffsets = { fajr: 20, dhuhr: 20, asr: 15, maghrib: 5, isha: 15 };

  if (opts.timeIds) {
    Object.entries(opts.timeIds).forEach(([key, elId]) => {
      const el = document.getElementById(elId);
      if (el && timings[map[key]]) {
        el.textContent = formatTime(timings[map[key]]);
        el.classList.remove('loading');
      }
    });
  }

  /* — Iqamah times — */
  if (opts.iqamahIds) {
    Object.entries(opts.iqamahIds).forEach(([key, elId]) => {
      const el = document.getElementById(elId);
      const raw = timings[map[key]];
      if (el && raw) {
        const iq = _addMins(raw, iqOffsets[key]);
        el.textContent = 'Iqamah : ' + formatTime(iq);
      }
    });
  }

  /* — Active prayer highlight — */
  if (opts.cardIds) {
    const now = new Date(), nm = now.getHours() * 60 + now.getMinutes();
    const keys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const ids  = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    let active = 'isha';
    keys.forEach((k, i) => {
      if (timings[k]) {
        const [h, m] = timings[k].split(':').map(Number);
        if (nm >= h * 60 + m) active = ids[i];
      }
    });
    ids.forEach(id => {
      const c = document.getElementById(opts.cardIds[id]);
      if (c) c.classList.toggle('active-prayer', id === active);
    });
  }

  return timings;
}
