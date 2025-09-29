
// 年度
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

// 主題切換
(function initTheme(){
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'themeToggle') {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }
});

// Reveal on scroll
const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); }
}, { threshold: 0.08 }) : null;
if (io) document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// 複製 Email
const copyBtn = document.getElementById('copyEmail');
if (copyBtn) {
  copyBtn.addEventListener('click', (e) => {
    const email = (copyBtn.textContent || '').trim();
    if (navigator.clipboard && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      navigator.clipboard.writeText(email).then(() => {
        alert('Email 已複製：' + email);
      });
    }
  });
}

// 表單送出回饋（Formspree/Netlify endpoint）
const form = document.getElementById('contactForm');
const formMsg = document.getElementById('formMsg');
if (form && form.action && form.action.startsWith('https://')) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (formMsg) formMsg.textContent = '傳送中...';
    try {
      const fd = new FormData(form);
      const res = await fetch(form.action, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' }});
      if (res.ok) { form.reset(); if (formMsg) formMsg.textContent = '已送出，謝謝！'; }
      else { if (formMsg) formMsg.textContent = '送出失敗，請稍後再試。'; }
    } catch (err) { if (formMsg) formMsg.textContent = '網路異常，請稍後再試。'; }
  });
}

// 無障礙：鍵盤導覽焦點可見
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') document.documentElement.classList.add('show-focus');
});

// 頁面卷軸進度條 + 回到頂部顯示控制
const progress = document.getElementById('scrollProgress');
const backToTop = document.getElementById('backToTop');
function onScrollUpdate(){
  const scrolled = window.scrollY;
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docH > 0 ? (scrolled / docH) * 100 : 0;
  if (progress) progress.style.width = pct + '%';
  if (backToTop) {
    if (scrolled > 400) backToTop.classList.add('show'); else backToTop.classList.remove('show');
  }
}
window.addEventListener('scroll', onScrollUpdate, { passive: true });
onScrollUpdate();

// 回到頂部
if (backToTop) {
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// Hero 輕微視差（prefers-reduced-motion: reduce 時停用）
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) {
  const hero = document.querySelector('.hero');
  window.addEventListener('scroll', () => {
    if (!hero) return;
    const y = window.scrollY * 0.1;
    hero.style.transform = `translateY(${y}px)`;
  }, { passive: true });
}

// 卡片 3D tilt 跟隨滑鼠（桌面端）
function attachTilt(el){
  let rect;
  function updateRect(){ rect = el.getBoundingClientRect(); }
  updateRect(); window.addEventListener('resize', updateRect);
  el.addEventListener('mousemove', (e) => {
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const rx = ((y / rect.height) - 0.5) * -6; // rotateX
    const ry = ((x / rect.width)  - 0.5) *  6; // rotateY
    el.style.transform = `translateY(-2px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform=''; });
}
document.querySelectorAll('.tilt').forEach(attachTilt);
