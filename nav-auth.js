import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc, getFirestore } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const OWNER_EMAIL = 'shadrat.almn7@gmail.com';

const svg = p => `<svg class="shadrat-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${p}"/></svg>`;
const adminIcon = svg('M12 3.5 19 6v5.4c0 4.3-2.7 7.6-7 9.1-4.3-1.5-7-4.8-7-9.1V6l7-2.5Zm0 4v6m-3-3h6');
const adminIcons = {
  overview: svg('M4 11.2 12 4l8 7.2v8.3H14.5v-5.5h-5V19.5H4v-8.3Z'),
  content: svg('M5 4h14v5H5V4Zm0 8h6v8H5v-8Zm9 0h5v8h-5v-8Z'),
  students: svg('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c.7-3.6 3-5.5 7-5.5s6.3 1.9 7 5.5'),
  staff: svg('M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c.4-3.3 2.2-5 5-5 2.1 0 3.6.9 4.4 2.6M13 20c.3-2.7 1.5-4 3.5-4s3.2 1.3 3.5 4'),
  support: svg('M5 5h14v14H5V5Zm3 4h8M8 13h5M8 17h7'),
  gamification: svg('M12 3l2.3 4.7 5.2.8-3.8 3.7.9 5.3-4.6-2.5-4.6 2.5.9-5.3-3.8-3.7 5.2-.8L12 3Z'),
  system: svg('M12 3 19 6v5c0 4.6-2.7 7.8-7 10-4.3-2.2-7-5.4-7-10V6l7-3Zm-3 9 2 2 4-4')
};

const link = (href, label, key) => `<a data-owner-link data-admin-section="${key}" href="${href}"><span class="admin-hamburger-icon">${adminIcons[key] || adminIcon}</span><span class="admin-hamburger-label">${label}</span><b class="admin-count-badge" data-admin-badge="${key}" hidden>0</b></a>`;
const adminEntries = [
  ['admin-analytics.html', 'الرئيسية الإدارية', 'overview', ['owner', 'admin', 'support', 'editor', 'communityModerator']],
  ['admin-homepage.html', 'إدارة المحتوى', 'content', ['owner', 'admin', 'editor']],
  ['admin-users.html', 'الطلاب', 'students', ['owner', 'admin', 'support']],
  ['admin-staff.html', 'الموظفون', 'staff', ['owner']],
  ['admin-orders.html', 'الطلبات والدعم', 'support', ['owner', 'admin', 'support']],
  ['admin-gamification.html', 'XP والإشعارات', 'gamification', ['owner', 'admin']],
  ['admin-security.html', 'النظام والدخل', 'system', ['owner', 'admin']]
];
const allowedEntries = role => adminEntries.filter(([, , , roles]) => roles.includes(role));
const staffLinks = role => `<div class="owner-menu-divider"></div><div class="owner-menu-heading"><span class="admin-hamburger-icon">${adminIcon}</span><span>لوحة الإدارة</span></div>${allowedEntries(role).map(([href, label, key]) => link(href, label, key)).join('')}`;
const staffCard = role => `<section class="hamburger-section owner-admin-section" data-admin-menu-card><div class="hamburger-section-title"><b>إدارة شذرات</b><small>تظهر للمالك والإدارة فقط</small></div><div class="hamburger-section-links">${allowedEntries(role).map(([href, label, key]) => link(href, label, key)).join('')}</div></section>`;
const adminAliases = {
  'admin-scholarships.html': 'admin-homepage.html',
  'admin-services.html': 'admin-homepage.html',
  'admin-offers.html': 'admin-homepage.html',
  'admin-videos.html': 'admin-homepage.html',
  'admin-messages.html': 'admin-orders.html',
  'admin-announcements.html': 'admin-gamification.html',
  'admin-revenue.html': 'admin-security.html'
};

function markCurrentAdminLink() {
  const current = location.pathname.split('/').pop() || 'index.html';
  const active = adminAliases[current] || current;
  document.querySelectorAll('[data-owner-link]').forEach(a => {
    const on = a.getAttribute('href') === active;
    a.classList.toggle('is-current', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

const logout = async () => { await signOut(auth); location.replace('index.html'); };

function addHamburgerLogout() {
  const hamburger = document.querySelector('.hamburger-auth-mini') || document.querySelector('.hamburger-sections') || document.querySelector('.global-menu-links');
  if (!hamburger || hamburger.querySelector('[data-auth-logout]')) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.authLogout = '';
  b.textContent = 'تسجيل الخروج';
  b.style.cssText = 'width:100%;margin-top:10px;border:0;border-radius:14px;padding:12px 18px;background:#b42318;color:#fff;font:inherit;font-weight:900;cursor:pointer';
  b.addEventListener('click', logout);
  hamburger.appendChild(b);
}

document.querySelectorAll('span.btn,span.dark').forEach(el => {
  if (/إنشاء|حساب/.test(el.textContent)) {
    el.setAttribute('role', 'link');
    el.tabIndex = 0;
    el.style.cursor = 'pointer';
    const go = () => location.href = 'register.html';
    el.addEventListener('click', go);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(); });
  }
});

onAuthStateChanged(auth, async user => {
  document.querySelectorAll('a[href="login.html"],a[href="register.html"]').forEach(a => {
    a.hidden = !!user;
    if (user) a.style.setProperty('display', 'none', 'important'); else a.style.removeProperty('display');
  });
  document.querySelectorAll('[data-auth-logout]').forEach(b => b.remove());
  document.querySelectorAll('[data-desktop-admin-link]').forEach(a => a.remove());

  if (!user) {
    document.body.dataset.role = 'student';
    return;
  }

  let role = user.email === OWNER_EMAIL ? 'owner' : 'student';
  if (role !== 'owner') {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const profile = snap.data() || {};
      role = profile.accountStatus === 'active' ? (profile.role || 'student') : 'student';
    } catch {}
  }
  document.body.dataset.role = role;

  if (['owner', 'admin', 'support', 'editor', 'communityModerator'].includes(role)) {
    const grouped = document.querySelector('.hamburger-sections');
    if (grouped && !grouped.querySelector('[data-admin-menu-card]')) grouped.insertAdjacentHTML('beforeend', staffCard(role));

    const flatLinks = document.querySelector('.global-menu-links');
    if (flatLinks && !flatLinks.querySelector('[data-owner-link]')) flatLinks.insertAdjacentHTML('beforeend', staffLinks(role));

    const slot = document.querySelector('.desktop-admin-slot');
    if (slot && !slot.querySelector('[data-desktop-admin-link]')) {
      slot.innerHTML = `<a data-desktop-admin-link href="admin-analytics.html"><span class="desktop-nav-icon" aria-hidden="true">${adminIcon}</span><span>لوحة الإدارة</span></a>`;
    }
    markCurrentAdminLink();
  }

  if (role === 'owner') {
    import('./owner-inline-tools.js?v=2').catch(error => console.warn('[Shadrat] owner tools', error));
  }

  addHamburgerLogout();
});
