import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { collection, getDocs, getFirestore, query, where } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { mergeScholarships } from './scholarship-catalog.js';

if (location.pathname.endsWith('/') || location.pathname.endsWith('/index.html')) {
  const cta = document.querySelector('.hero .cta');
  if (cta) cta.querySelectorAll('[data-social-placeholder]').forEach(node => node.remove());

  const stats = document.querySelectorAll('.stats .stat b');
  const cards = document.querySelector('.featured .cards');
  const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const theme = country => ({ 'روسيا': 'ru', 'المجر': 'hu', 'تركيا': 'tr', 'ألمانيا': 'de' }[country] || 'global');
  const formatDate = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString('ar-SA-u-ca-gregory', { year: 'numeric', month: 'short', day: 'numeric' }) : 'حسب الجهة';
  const daysLeft = item => {
    if (!item.deadline) return null;
    const date = new Date(`${item.deadline}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : Math.ceil((date.getTime() - Date.now()) / 86400000);
  };
  const benefit = item => {
    if (item.slug === 'open-doors') return 'الفائز يدرس ضمن الكوتة الحكومية الروسية وتموَّل عنه الرسوم.';
    if (item.slug === 'education-in-russia') return 'المقبول يحصل على مقعد حكومي روسي حسب بلد التقديم والترشيح.';
    const coverage = (item.coverage || []).find(text => /رسوم|ممولة|سكن|مخصص|تأمين|سفر|كوتة|دعم|إعفاء/i.test(text));
    return coverage || item.funding || 'افتح الدليل لمعرفة ما تغطيه المنحة.';
  };
  const hook = item => {
    if (item.slug === 'open-doors') return 'ممتازة للملفات القوية في الحاسب والذكاء الاصطناعي والهندسة.';
    if (item.slug === 'education-in-russia') return 'قوتها في أن المقعد رسمي، لكن اختيار الجامعات والمواعيد يحتاج انتباه.';
    if (item.country === 'تركيا') return 'تجذب الطلاب لأنها تجمع الرسوم والسكن والدعم المعيشي.';
    return 'اقرأ التفاصيل قبل التقديم لتعرف التمويل والمراحل والمستندات.';
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
    link.href = 'homepage-scholarships.css?v=3';
    link.dataset.homeScholarships = '';
    document.head.appendChild(link);
  }

  const renderCards = () => {
    const featured = items.filter(item => item.featured).slice(0, 3);
    const chosen = featured.length >= 3 ? featured : items.slice(0, 3);
    if (!cards || !chosen.length) return;
    cards.innerHTML = chosen.map(item => {
      const href = `scholarship.html?slug=${encodeURIComponent(item.slug || item.id)}`;
      const left = daysLeft(item);
      const countdown = left == null ? 'موعد متغير' : left >= 0 ? `${left.toLocaleString('ar')} يوم` : 'مغلقة الآن';
      const levels = (item.studyLevels || []).slice(0, 3).join(' • ');
      return `<article class="card home-scholarship theme-${theme(item.country)}"><div class="home-card-head"><span>${esc(item.country || 'دولي')}</span><b>${esc(countdown)}</b></div><h3>${esc(item.title || 'منحة')}</h3><p class="home-provider">${esc(item.provider || 'جهة مانحة')}</p><div class="home-winner"><small>وش يحصل الفائز؟</small><strong>${esc(benefit(item))}</strong></div><p class="home-hook">${esc(hook(item))}</p><div class="home-strip"><div><small>الإغلاق</small><b>${esc(formatDate(item.deadline))}</b></div><div><small>التمويل</small><b>${esc(item.funding || 'حسب البرنامج')}</b></div></div>${levels ? `<div class="home-levels">${esc(levels)}</div>` : ''}<a class="detail" href="${href}">عرض المنحة</a></article>`;
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
