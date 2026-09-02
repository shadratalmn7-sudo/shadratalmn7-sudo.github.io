import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { collection, getDocs, getFirestore, query, where } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { mergeScholarships } from './scholarship-catalog.js?v=20260902branches';

if (!window.__shadratScholarshipsLiveReady) {
window.__shadratScholarshipsLiveReady = true;
const cards = document.querySelector('#scholarship-cards');
if (cards) {
  const count = document.querySelector('#scholarship-count');
  const empty = document.querySelector('#scholarship-empty');
  const sourceState = document.querySelector('#scholarship-source-state');
  const search = document.querySelector('#scholarship-search');
  const level = document.querySelector('#scholarship-level');
  const status = document.querySelector('#scholarship-status');
  const branchButtons = [...document.querySelectorAll('[data-scholarship-branch]')];
  const countryButtons = [...document.querySelectorAll('[data-country]')];
  const branchHeadlines = {all:'المنح الدراسية المتاحة','open-now':'المنح المفتوحة الآن',olympiads:'أولمبيادات القبول والمنح',universities:'فرص الجامعات'};
  let country = 'all';
  let branch = 'open-now';
  let scholarships = mergeScholarships([]).filter(item => item.publishStatus === 'published');
  const esc = (value='') => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parseDate = value => { if(!value) return null; const d=new Date(String(value).length===10?`${value}T00:00:00`:value); return Number.isNaN(d.getTime())?null:d; };
  const formatDate = value => { const d=parseDate(value); return d?d.toLocaleDateString('ar-SA-u-ca-gregory',{year:'numeric',month:'short',day:'numeric'}):'غير محدد'; };
  const flag = value => ({'روسيا':'🇷🇺','المجر':'🇭🇺','تركيا':'🇹🇷','ألمانيا':'🇩🇪','السعودية':'🇸🇦','فرنسا':'🇫🇷','إيطاليا':'🇮🇹','الصين':'🇨🇳','اليابان':'🇯🇵'}[value]||'🌍');
  const heartIcon = `<svg class="favorite-heart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>`;
  function dateState(item){const now=Date.now(),opens=parseDate(item.openDate||item.openingDate),closes=parseDate(item.deadline||item.closeDate||item.endDate);if(opens&&now<opens)return{key:'open',tone:'upcoming',label:'تفتح قريبًا'};if(closes&&now>closes)return{key:'closed',tone:'closed',label:'مغلقة'};if(opens||closes)return{key:'open',tone:'open',label:'مفتوحة'};return{key:'unknown',tone:'unknown',label:'الموعد غير محدد'};}
  function searchable(item){return[item.title,item.country,item.provider,item.shortDescription,item.funding,...(item.studyLevels||[]),...(item.subjectAreas||[])].filter(Boolean).join(' ').toLowerCase();}
  function branchType(item){const text=[item.slug,item.title,item.provider,item.shortDescription,item.funding].filter(Boolean).join(' ').toLowerCase();if(/olympiad|open doors|высшая|أولمبياد|الومبياد|بطولة|mgimo/.test(text))return'olympiads';if(/university|جامعة|rudn|nsu|ulstu|novosibirsk|ulyanovsk|belgorod/.test(text))return'universities';return'general';}
  function branchMatch(item){const state=dateState(item);if(branch==='open-now')return state.tone==='open';if(branch==='olympiads')return branchType(item)==='olympiads';if(branch==='universities')return branchType(item)==='universities';return true;}
  function filtered(){const term=search.value.trim().toLowerCase();return scholarships.filter(item=>branchMatch(item)&&(country==='all'||item.country===country)&&(level.value==='all'||(item.studyLevels||[]).includes(level.value))&&(status.value==='all'||dateState(item).key===status.value)&&(!term||searchable(item).includes(term)));}
  function render(){const items=filtered();document.querySelector('.scholarship-result-head h2').textContent=branchHeadlines[branch]||branchHeadlines.all;count.textContent=`${items.length} منحة`;empty.hidden=items.length>0;cards.hidden=items.length===0;cards.innerHTML=items.map(item=>{const slug=item.slug||item.id,state=dateState(item),opens=item.openDate||item.openingDate,closes=item.deadline||item.closeDate||item.endDate;return `<article class="scholarship-card scholarship-card-clean status-${state.tone}" data-scholarship-card><div class="scholarship-card-head"><div class="country-badge-large"><span>${flag(item.country)}</span><b>${esc(item.country||'دولي')}</b></div><span class="scholarship-state ${state.tone}"><i></i>${esc(state.label)}</span></div><div class="scholarship-provider">${esc(item.provider||'جهة مانحة')}</div><h2>${esc(item.title)}</h2><div class="scholarship-dates"><div><small>يفتح</small><b>${formatDate(opens)}</b></div><div><small>يغلق</small><b>${formatDate(closes)}</b></div></div><div class="scholarship-card-actions"><button type="button" class="scholarship-favorite-btn" data-favorite-slug="${esc(slug)}" data-favorite-title="${esc(item.title)}" data-favorite-country="${esc(item.country||'')}" aria-label="حفظ المنحة" aria-pressed="false">${heartIcon}</button><a class="btn primary scholarship-details-btn" href="scholarship.html?slug=${encodeURIComponent(slug)}">عرض التفاصيل</a></div></article>`;}).join('');document.dispatchEvent(new CustomEvent('shadrat:scholarships-rendered'));}
  branchButtons.forEach(button=>button.addEventListener('click',()=>{branch=button.dataset.scholarshipBranch||'all';branchButtons.forEach(n=>n.classList.toggle('is-active',n===button));render();}));
  countryButtons.forEach(button=>button.addEventListener('click',()=>{country=button.dataset.country||'all';countryButtons.forEach(n=>n.classList.toggle('is-active',n===button));render();}));
  [search,level,status].forEach(control=>control.addEventListener(control===search?'input':'change',render));
  document.querySelector('#reset-scholarship-filters')?.addEventListener('click',()=>{search.value='';level.value='all';status.value='all';country='all';branch='open-now';branchButtons.forEach(b=>b.classList.toggle('is-active',b.dataset.scholarshipBranch==='open-now'));countryButtons.forEach(b=>b.classList.toggle('is-active',b.dataset.country==='all'));render();search.focus();});
  render();
  const refresh=async()=>{try{const app=getApps().length?getApp():initializeApp(firebaseConfig);const snapshot=await getDocs(query(collection(getFirestore(app),'scholarships'),where('publishStatus','==','published')));const remote=snapshot.docs.map(document=>({id:document.id,...document.data()}));if(remote.length)scholarships=mergeScholarships(remote).filter(item=>item.publishStatus==='published');sourceState.textContent='تم تحديث الدليل من قاعدة البيانات';render();}catch(error){sourceState.textContent='نعرض النسخة الموثقة المحفوظة';console.warn('[Shadrat] scholarship refresh unavailable',error);}};
  ('requestIdleCallback'in window?requestIdleCallback(refresh,{timeout:1800}):setTimeout(refresh,700));
}
}
