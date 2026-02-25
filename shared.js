/* ============================================================
   RAHMA ISLAMIC CENTRE — shared.js  v5
   La classe .active dans la nav est définie STATIQUEMENT
   dans chaque page HTML — aucune détection JS n'est nécessaire.
============================================================ */

/* ---------- LOADER ---------- */
window.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    var l = document.getElementById('loader');
    if (l) l.classList.add('hidden');
  }, 600);
});

/* ---------- NAVBAR SCROLL ---------- */
window.addEventListener('scroll', function() {
  var nb = document.getElementById('navbar');
  if (nb) nb.classList.toggle('scrolled', window.scrollY > 60);
});

/* ---------- MOBILE MENU ---------- */
var _mOpen = false;
function toggleMobile() {
  _mOpen = !_mOpen;
  var mm = document.getElementById('mobileMenu');
  var hb = document.getElementById('hamburger');
  if (mm) mm.classList.toggle('active', _mOpen);
  if (hb) hb.classList.toggle('active', _mOpen);
  document.body.style.overflow = _mOpen ? 'hidden' : '';
}
function closeMobile() {
  _mOpen = false;
  var mm = document.getElementById('mobileMenu');
  var hb = document.getElementById('hamburger');
  if (mm) mm.classList.remove('active');
  if (hb) hb.classList.remove('active');
  document.body.style.overflow = '';
}

/* ---------- REVEAL ON SCROLL ---------- */
document.addEventListener('DOMContentLoaded', function() {
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.07 });
  document.querySelectorAll('.reveal').forEach(function(el) { obs.observe(el); });
});

/* ---------- FORMAT TIME 24h -> 12h ---------- */
function formatTime(raw) {
  if (!raw) return '—';
  var t = raw.split(' ')[0];
  var parts = t.split(':');
  var h = parseInt(parts[0], 10);
  var mm = parts[1];
  var ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + mm + ' ' + ap;
}

/* ---------- NEWSLETTER ---------- */
function subscribeNewsletter(e) {
  e.preventDefault();
  var btn = e.target.querySelector('button[type="submit"]') || e.target.querySelector('.newsletter-btn');
  if (!btn) return;
  var orig = btn.textContent;
  btn.textContent = '✓ Subscribed!';
  setTimeout(function() { btn.textContent = orig; e.target.reset(); }, 3000);
}

/* ---------- ADD MINUTES ---------- */
function _addMins(timeStr, mins) {
  if (!timeStr) return null;
  var parts = timeStr.split(':').map(Number);
  var total = parts[0] * 60 + parts[1] + mins;
  return String(Math.floor(total / 60) % 24).padStart(2,'0') + ':' + String(total % 60).padStart(2,'0');
}

/* ============================================================
   PRAYER TIMES LOADER — Mawaqit primary, Aladhan fallback
============================================================ */
async function loadMawaqitPrayers(opts) {
  opts = opts || {};
  var timings = null;
  var MW_SLUG = 'rahma-islamic-centre-winnipeg';

  try {
    var r = await fetch('https://mawaqit.net/api/2.0/mosque/by-slug/' + MW_SLUG + '/prayer-times');
    if (r.ok) {
      var d = await r.json();
      if (d.times && d.times.length >= 6) {
        timings = { Fajr:d.times[0], Dhuhr:d.times[2], Asr:d.times[3], Maghrib:d.times[4], Isha:d.times[5], _src:'mawaqit' };
      }
    }
  } catch(err) {}

  if (!timings) {
    try {
      var now = new Date();
      var url = 'https://api.aladhan.com/v1/timings/'
        + now.getDate() + '-' + (now.getMonth()+1) + '-' + now.getFullYear()
        + '?latitude=49.8951&longitude=-97.1384&method=2';
      var res = await fetch(url);
      var data = await res.json();
      if (data.code === 200) { timings = Object.assign({}, data.data.timings, { _src:'aladhan' }); }
    } catch(err) {}
  }

  if (!timings) {
    timings = { Fajr:'05:30', Dhuhr:'12:45', Asr:'15:30', Maghrib:'18:15', Isha:'19:45', _src:'static' };
  }

  var badge = document.getElementById(opts.badgeId || 'apiBadge');
  if (badge) {
    var colors = { mawaqit:'#4ade80', aladhan:'#fbbf24', static:'#9ca3af' };
    var labels = { mawaqit:'Mawaqit.net ✓', aladhan:'Aladhan API', static:'Horaires statiques' };
    badge.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'
      + colors[timings._src] + ';margin-right:8px"></span>' + labels[timings._src];
  }

  var keyMap = { fajr:'Fajr', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha' };
  var iqOff  = { fajr:20, dhuhr:20, asr:15, maghrib:5, isha:15 };

  if (opts.timeIds) {
    Object.keys(opts.timeIds).forEach(function(key) {
      var el = document.getElementById(opts.timeIds[key]);
      if (el && timings[keyMap[key]]) {
        el.textContent = formatTime(timings[keyMap[key]]);
        el.classList.remove('loading');
      }
    });
  }
  if (opts.iqamahIds) {
    Object.keys(opts.iqamahIds).forEach(function(key) {
      var el = document.getElementById(opts.iqamahIds[key]);
      if (el && timings[keyMap[key]]) {
        el.textContent = 'Iqamah : ' + formatTime(_addMins(timings[keyMap[key]], iqOff[key]));
      }
    });
  }
  if (opts.cardIds) {
    var n = new Date(), nm = n.getHours()*60 + n.getMinutes();
    var ks = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
    var is = ['fajr','dhuhr','asr','maghrib','isha'];
    var active = 'isha';
    ks.forEach(function(k, i) {
      if (timings[k]) {
        var p = timings[k].split(':').map(Number);
        if (nm >= p[0]*60+p[1]) active = is[i];
      }
    });
    is.forEach(function(id) {
      var c = document.getElementById(opts.cardIds[id]);
      if (c) c.classList.toggle('active-prayer', id === active);
    });
  }
  return timings;
}
