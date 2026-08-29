import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { collection, getDocs, getFirestore, query, where } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const esc = (value = '') => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const russianGovernmentService = item => /Education in Russia|منحة الحكومة الروسية|الحكومة الروسية/i.test(`${item.title || ''} ${item.description || ''}`);
const displayPrice = item => russianGovernmentService(item) ? 30 : Number(item.price || 0);
const displayTerms = item => russianGovernmentService(item) ? 'عرض شخصين: 50$ بدل 60$.' : item.terms;

async function renderServices() {
  const sections = [...document.querySelectorAll('[data-section]')];
  if (!sections.length) return;
  try {
    const snapshot = await getDocs(query(collection(db, 'services'), where('publishStatus', '==', 'published')));
    if (snapshot.empty) return;
    sections.forEach(section => section.querySelector('.grid')?.replaceChildren());
    snapshot.docs.forEach(document => {
      const item = document.data();
      const category = item.category === 'free' ? 'free' : 'paid';
      const grid = document.querySelector(`[data-section="${category}"] .grid`);
      if (!grid) return;
      const title = russianGovernmentService(item) ? 'التقديم على منحة الحكومة الروسية' : item.title;
      const terms = displayTerms(item);
      grid.insertAdjacentHTML('beforeend', `<article class="card service-card ${category === 'paid' ? 'paid' : ''}" data-live-service="${document.id}"><span class="tag">${category === 'free' ? 'مجانية' : russianGovernmentService(item) ? 'تخفيض' : 'مدفوعة'}</span><h3>${esc(title)}</h3><p class="muted">${esc(item.description || '')}</p>${category === 'paid' ? `<p class="price">${displayPrice(item)}$</p>` : ''}${terms ? `<div class="scope-note">${esc(terms)}</div>` : ''}<a class="btn ${category === 'free' ? 'outline' : 'primary'}" href="contact.html?type=service&service=${encodeURIComponent(title)}&serviceId=${encodeURIComponent(document.id)}">${category === 'free' ? 'احجز استشارة' : 'اطلب الخدمة'}</a></article>`);
    });
    sections.forEach(section => { section.hidden = !section.querySelector('.grid')?.children.length; });
  } catch (error) {
    console.warn('[Shadrat] live services unavailable; using verified fallback', error);
  }
}

function activeOffer(item) {
  const now = Date.now();
  const start = item.startDate?.toDate?.()?.getTime?.() ?? (item.startDate ? new Date(item.startDate).getTime() : null);
  const end = item.endDate?.toDate?.()?.getTime?.() ?? (item.endDate ? new Date(item.endDate).getTime() : null);
  return (!start || Number.isNaN(start) || now >= start) && (!end || Number.isNaN(end) || now <= end);
}

async function renderOffers() {
  const grid = document.querySelector('#offers-grid');
  if (!grid) return;
  try {
    const snapshot = await getDocs(query(collection(db, 'offers'), where('publishStatus', '==', 'published')));
    const offers = snapshot.docs.map(document => ({ id: document.id, ...document.data() })).filter(activeOffer);
    if (!offers.length) return;
    grid.innerHTML = offers.map(item => {
      const title = russianGovernmentService(item) ? 'التقديم على منحة الحكومة الروسية' : item.title;
      const terms = displayTerms(item);
      const old = russianGovernmentService(item) ? 60 : Number(item.originalPrice || 0);
      return `<article class="card paid offer-card" data-live-offer="${item.id}"><span class="tag">عرض</span><h2>${esc(title)}</h2><p class="muted">${esc(item.description || '')}</p><div class="offer-price">${old ? `<span class="old">${old}$</span>` : ''}<span class="price">${displayPrice(item)}$</span></div>${terms ? `<div class="notice">${esc(terms)}</div>` : ''}<a class="btn primary" href="contact.html?type=service&service=${encodeURIComponent(title)}&offerId=${encodeURIComponent(item.id)}">اطلب العرض</a></article>`;
    }).join('');
  } catch (error) {
    console.warn('[Shadrat] live offers unavailable; using verified fallback', error);
  }
}

if (location.pathname.endsWith('/services.html')) renderServices();
if (location.pathname.endsWith('/offers.html')) renderOffers();
