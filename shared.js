// ================================================
//   RAHMA ISLAMIC CENTRE — SHARED JS
// ================================================

const MOSQUE_CONFIG = {
    latitude: 49.8951,
    longitude: -97.1384,
    method: 2,
    jumuahTime1: "12:30 pm",
    jumuahTime2: "1:20 pm",
    jumuahLocation: "Chalmers Community Centre",
    jumuahAddress: "480 Chalmers Ave, Winnipeg, MB R2L 0G5"
};

// Loader
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
    }, 2000);
});

// Navbar scroll
window.addEventListener('scroll', () => {
    const nb = document.getElementById('navbar');
    if (nb) nb.classList.toggle('scrolled', window.scrollY > 60);
});

// Mobile menu
let mobileOpen = false;
function toggleMobile() {
    mobileOpen = !mobileOpen;
    document.getElementById('mobileMenu').classList.toggle('active', mobileOpen);
    document.getElementById('hamburger').classList.toggle('active', mobileOpen);
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
}
function closeMobile() {
    mobileOpen = false;
    document.getElementById('mobileMenu').classList.remove('active');
    document.getElementById('hamburger').classList.remove('active');
    document.body.style.overflow = '';
}

// Reveal on scroll
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Format 24h → 12h
function formatTime(t) {
    const [h, m] = t.split(':');
    let hr = parseInt(h);
    const ap = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12 || 12;
    return hr + ':' + m + ' ' + ap;
}

// Newsletter
function subscribeNewsletter(e) {
    e.preventDefault();
    const btn = e.target.querySelector('.newsletter-btn');
    btn.textContent = '✓ Subscribed!';
    btn.style.color = 'var(--gold)';
    setTimeout(() => { btn.textContent = 'Subscribe'; btn.style.color = ''; e.target.reset(); }, 3000);
}
