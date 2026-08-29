import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { collection, getDocs, getFirestore, query, where } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { mergeScholarships } from './scholarship-catalog.js';

const cards = document.querySelector('#scholarship-cards');
if (cards) {
  const count = document.querySelector('#scholarship-count');
  const empty = document.querySelector('#scholarship-empty');
  const sourceState = document.querySelector('#scholarship-source-state');
  const search = document.querySelector('#scholarship-search');
  const level = document.querySelector('#scholarship-level');
  const status = document.querySelector('#scholarship-status');
  const countryButtons = [...document.querySelectorAll('[data-country]')];
  let country = 'all';
  let scholarships = mergeScholarships([]).filter(item => item.publishStatus === 'published');

  const esc = (value = '') => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const parseDate = value => { if (!value) return null; const date = new Date(String(value).length === 10 ? `${value}T00:00:00` : value); return Number.isNaN(date.getTime()) ? null : date; };
  const formatDate = value => { const date = parseDate(value); return date ? date.toLocaleDateString('ar-SA-u-ca-gregory', { year: 'numeric', month: 'long', day: 'numeric' }) : 'حسب الجهة'; };
  const flag = value => ({ 'روسيا': '🇷🇺', 'المجر': '🇭🇺', 'تركيا': '🇹🇷', 'ألمانيا': '🇩🇪', 'السعودية': '🇸🇦', 'فرنسا': '🇫🇷', 'إيطاليا': '🇮🇹', 'الصين': '🇨🇳', 'اليابان': '🇯🇵' }[value] || '🌍');

  function dateState(item) {
    const now = Date.now();
    const opens = parseDate(item.openDate || item.openingDate);
    const closes = parseDate(item.deadline || item.closeDate || item.endDate);
    if (!opens && !closes) return { key: 'unknown', label: 'الموعد حسب الجهة', date: 'راجع المصدر الرسمي' };
    if (opens && now < opens) return { key: 'open', label: 'يفتح قريبًا', date: formatDate(opens) };
    if (closes && now <= closes) return { key: 'open', label: 'مفتوحة الآن', date: `حتى ${formatDate(closes)}` };
    return { key: 'closed', label: 'مغلقة حاليًا', date: closes ? `أغلقت ${formatDate(closes)}` : 'راجع المصدر' };
  }

  function searchable(item) {
    return [item.title, item.country, item.provider, item.shortDescription, item.funding, ...(item.studyLevels || []), ...(item.subjectAreas || [])].filter(Boolean).join(' ').toLowerCase();
  }

  function filtered() {
    const term = search.value.trim().toLowerCase();
    return scholarships.filter(item => {
      const matchesCountry = country === 'all' || item.country === country;
      const matchesLevel = level.value === 'all' || (item.studyLevels || []).includes(level.value);
      const matchesStatus = status.value === 'all' || dateState(item).key === status.value;
      const matchesSearch = !term || searchable(item).includes(term);
      return matchesCountry && matchesLevel && matchesStatus && matchesSearch;
    });
  }

  function render() {
    const items = filtered();
    count.textContent = `${items.length} منحة`;
    empty.hidden = items.length > 0;
    cards.hidden = items.length === 0;
    cards.innerHTML = items.map(item => {
      const slug = item.slug || item.id;
      const state = dateState(item);
      const levels = (item.studyLevels || []).slice(0, 4);
      return `<article class="scholarship-card"><div class="scholarship-card-top"><div class="country-badge-large"><span class="country-flag">${flag(item.country)}</span><span class="country-name">${esc(item.country || 'دولي')}</span></div><button type="button" class="scholarship-favorite-btn" data-favorite-slug="${esc(slug)}" data-favorite-title="${esc(item.title)}" data-favorite-country="${esc(item.country || '')}" aria-label="حفظ ${esc(item.title)}" aria-pressed="false">♡</button></div><div class="scholarship-provider">${esc(item.provider || 'جهة مانحة')}</div><h2>${esc(item.title)}</h2><p class="scholarship-summary">${esc(item.shortDescription || '')}</p><div class="scholarship-status-row"><span class="status-chip status-${state.key}">${esc(state.label)}</span><b>${esc(state.date)}</b></div><div class="scholarship-meta-row"><div><small>التمويل</small><b>${esc(item.funding || 'حسب البرنامج')}</b></div><div><small>المراحل</small><b>${levels.map(esc).join(' • ') || 'حسب البرنامج'}</b></div></div><a class="btn primary scholarship-details-btn" href="scholarship.html?slug=${encodeURIComponent(slug)}">عرض دليل المنحة ←</a></article>`;
    }).join('');
    document.dispatchEvent(new CustomEvent('shadrat:scholarships-rendered'));
  }

  countryButtons.forEach(button => button.addEventListener('click', () => {
    country = button.dataset.country || 'all';
    countryButtons.forEach(node => node.classList.toggle('is-active', node === button));
    render();
  }));
  [search, level, status].forEach(control => control.addEventListener(control === search ? 'input' : 'change', render));
  document.querySelector('#reset-scholarship-filters')?.addEventListener('click', () => {
    search.value = ''; level.value = 'all'; status.value = 'all'; country = 'all'; countryButtons.forEach(button => button.classList.toggle('is-active', button.dataset.country === 'all')); render(); search.focus();
  });

  render();
  const refresh = async () => {
    try {
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      const snapshot = await getDocs(query(collection(getFirestore(app), 'scholarships'), where('publishStatus', '==', 'published')));
      const remote = snapshot.docs.map(document => ({ id: document.id, ...document.data() }));
      if (remote.length) scholarships = mergeScholarships(remote).filter(item => item.publishStatus === 'published');
      sourceState.textContent = 'تم تحديث الدليل من قاعدة البيانات';
      render();
    } catch (error) {
      sourceState.textContent = 'نعرض النسخة الموثقة المحفوظة';
      console.warn('[Shadrat] scholarship refresh unavailable', error);
    }
  };
  ('requestIdleCallback' in window ? requestIdleCallback(refresh, { timeout: 1800 }) : setTimeout(refresh, 700));
}
