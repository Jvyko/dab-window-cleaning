// ═══════════════════════════════════════════════════════
// DAB WINDOW CLEANING — Site interactions
// ═══════════════════════════════════════════════════════

// Nav scroll state
const nav = document.getElementById('nav');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y > 60) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
  lastScroll = y;
});

// Mobile menu toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    navLinks.style.flexDirection = 'column';
    navLinks.style.position = 'absolute';
    navLinks.style.top = '100%';
    navLinks.style.right = '1.5rem';
    navLinks.style.background = 'rgba(28, 28, 30, 0.98)';
    navLinks.style.padding = '1.5rem 2rem';
    navLinks.style.border = '1px solid rgba(255, 255, 255, 0.07)';
  });
}

// Scroll reveal — fade sections in as they enter view
const revealElements = document.querySelectorAll('.service-card, .testimonial, .gallery-item, .point, .section-head');
revealElements.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

revealElements.forEach(el => observer.observe(el));

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Quote form — intercept, build mailto fallback if Formspree not configured
const form = document.getElementById('quoteForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    const action = form.getAttribute('action') || '';
    // If user hasn't set up Formspree yet, fall back to mailto
    if (action.includes('YOUR_FORMSPREE_ID') || !action) {
      e.preventDefault();
      const data = new FormData(form);
      const body = [
        `Name: ${data.get('name')}`,
        `Phone: ${data.get('phone')}`,
        `Email: ${data.get('email')}`,
        `City: ${data.get('city')}`,
        `Service: ${data.get('service')}`,
        `Windows: ${data.get('windows')}`,
        '',
        `Details:`,
        data.get('notes') || '(none)'
      ].join('\n');
      const subject = `Quote Request from ${data.get('name')}`;
      window.location.href = `mailto:dabwindowcleaningutah@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
    // Otherwise let Formspree handle it normally
  });
}

// Smooth scroll offset compensation for fixed nav
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      // Close mobile menu if open
      if (window.innerWidth < 960 && navLinks) navLinks.style.display = 'none';
    }
  });
});
