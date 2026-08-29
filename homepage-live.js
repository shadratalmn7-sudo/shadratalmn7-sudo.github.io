import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { collection, getDocs, getFirestore, query, where } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { mergeScholarships } from './scholarship-catalog.js';

if (location.pathname.endsWith('/') || location.pathname.endsWith('/index.html')) {
  const stats = document.querySelectorAll('.stats .stat b');
  const cards = document.querySelector('.featured .cards');
  const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const theme = country => ({ 'روسيا': 'ru', 'المجر': 'hu', 'تركيا': 'tr', 'ألمانيا': 'de' }[country] || 'global');
  const formatDate = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString('ar-SA-u-ca-gregory', { month: 'short', day: 'numeric' }) : 'حسب الجهة';
  const daysLeft = item => {
    if (!item.deadline) return null;
    const date = new Date(`${item.deadline}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : Math.ceil((date.getTime() - Date.now()) / 86400000);
  };
  const paintStats = items => {
    const countries = new Set(items.map(item => item.country).filter(Boolean));
    if (stats[0]) stats[0].textContent = items.length.toLocaleString('ar');
    if (stats[1]) stats[1].textContent = countries.size.toLocaleString('ar');
    if (stats[2]) stats[2].textContent = 'محدثة';
  };

  let items = mergeScholarships([]).filter(item => item.publishStatus === 'published').sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  paintStats(items);

  if (!document.querySelector('link[data-home-scholarships]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'homepage-scholarships.css?v=5';
    link.dataset.homeScholarships = '';
    document.head.appendChild(link);
  }

  const renderCards = () => {
    const featured = items.filter(item => item.featured).slice(0, 6);
    const chosen = featured.length ? featured : items.slice(0, 6);
    if (!cards || !chosen.length) return;
    cards.innerHTML = chosen.map(item => {
      const href = `scholarship.html?slug=${encodeURIComponent(item.slug || item.id)}`;
      const left = daysLeft(item);
      const countdown = left == null ? 'موعد متغير' : left >= 0 ? `${left.toLocaleString('ar')} يوم` : 'مغلقة';
      const level = (item.studyLevels || [])[0] || 'مراحل متعددة';
      const status = item.statusLabel || item.status || 'متاحة حسب الموعد';
      return `<article class="card home-scholarship theme-${theme(item.country)}"><div class="home-card-head"><span>${esc(item.country || 'دولي')}</span><b>${esc(countdown)}</b></div><h3>${esc(item.title || 'منحة')}</h3><p class="home-provider">${esc(item.provider || 'جهة مانحة')}</p><div class="home-mini-info"><span>${esc(status)}</span><span>${esc(level)}</span></div><div class="home-strip"><div><small>الإغلاق</small><b>${esc(formatDate(item.deadline))}</b></div><div><small>التمويل</small><b>${esc(item.funding || 'حسب البرنامج')}</b></div></div><a class="detail" href="${href}">التفاصيل</a></article>`;
    }).join('');
  };
  renderCards();

  const refresh = async () => {
    try {
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const snap = await getDocs(query(collection(db, 'scholarships'), where('publishStatus', '==', 'published')));
      const remote = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (remote.length) {
        items = mergeScholarships(remote).filter(item => item.publishStatus === 'published').sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
        paintStats(items);
        renderCards();
      }
    } catch (error) {
      console.warn('Homepage remote data unavailable; using verified catalog.', error);
    }
  };
  ('requestIdleCallback' in window ? requestIdleCallback(refresh, { timeout: 2200 }) : setTimeout(refresh, 900));
}