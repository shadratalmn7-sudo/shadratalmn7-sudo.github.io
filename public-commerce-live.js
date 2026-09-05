import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { collection, getDocs, getFirestore, query, where } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const esc = (value = '') => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const russianGovernmentService = item => /Education in Russia|منحة الحكومة الروسية|الحكومة الروسية/i.test(`${item.title || ''} ${item.description || ''}`);
const displayPrice = item => russianGovernmentService(item) ? 30 : Number(item.price || 0);
const displayTerms = item => russianGovernmentService(item) ? 'عرض شخصين: 50$ بدل 60$.' : item.terms;

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

function addStudentBuilders(){
  if(!location.pathname.endsWith('/services.html')||document.querySelector('[data-student-builders]'))return;
  const first=document.querySelector('.service-section');
  if(!first)return;
  const section=document.createElement('section');
  section.className='service-section';section.dataset.studentBuilders='';
  section.innerHTML='<div class="container"><div class="service-head"><span class="tag">مجانية</span><h2>أدوات تجهيز ملف الطالب</h2><p>أدوات ذاتية تساعدك على تجهيز مستندات التقديم مباشرة.</p></div><div class="service-shelf"><article class="service-card"><span class="tag">مجانية</span><h3>منشئ السيرة الذاتية CV</h3><p>أدخل بياناتك وتعليمك وشهاداتك ومهاراتك، واختر قالبًا مناسبًا للتقديم الأكاديمي.</p><a class="btn outline" href="cv-builder.html">إنشاء CV</a></article><article class="service-card"><span class="tag">مجانية</span><h3>منشئ Motivation Letter</h3><p>ابدأ برفع شهاداتك ثم أضف أهدافك ومعلوماتك ليُبنى خطاب الدافع حول إنجازاتك.</p><a class="btn outline" href="motivation-letter.html">إنشاء خطاب الدافع</a></article></div></div>';
  first.insertAdjacentElement('beforebegin',section);
}

if (location.pathname.endsWith('/offers.html')) renderOffers();
if (location.pathname.endsWith('/services.html')) addStudentBuilders();