import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import{firebaseConfig}from'./firebase-config.js';
const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app);
function makeLink(el,href){if(!el||el.tagName==='A')return;const a=document.createElement('a');a.className=el.className;a.href=href;a.innerHTML=el.innerHTML;for(const attr of el.attributes)if(!['class'].includes(attr.name))a.setAttribute(attr.name,attr.value);el.replaceWith(a)}
function repairHomepage(){if(!location.pathname.endsWith('/')&&!location.pathname.endsWith('/index.html'))return;
 document.querySelectorAll('.featured article').forEach(card=>{const title=card.querySelector('h3')?.textContent||'';const detail=card.querySelector('.detail');if(/التركية|تركيا/.test(title))makeLink(detail,'turkiye-scholarships.html')});
 const all=[...document.querySelectorAll('.section-head b')].find(x=>/عرض جميع المنح/.test(x.textContent||''));makeLink(all,'scholarships.html');
 document.querySelectorAll('.cta .outline,.banner .dark').forEach(el=>{if(/حساب|ابدأ|إنشاء/.test(el.textContent||'')){el.dataset.guestOnly='';makeLink(el,'register.html')}})
}
repairHomepage();
onAuthStateChanged(auth,user=>{document.querySelectorAll('[data-guest-only]').forEach(el=>el.hidden=!!user);if(user){document.querySelectorAll('.cta').forEach(area=>{if(!area.querySelector('[data-account-cta]')){const a=document.createElement('a');a.href='profile.html';a.className='btn outline';a.dataset.accountCta='';a.textContent='اذهب إلى حسابي';area.appendChild(a)}});const banner=document.querySelector('.banner');if(banner){const b=banner.querySelector('b'),h=banner.querySelector('h2'),p=banner.querySelector('p');if(b)b.textContent='مرحبًا بعودتك';if(h)h.textContent='تابع فرصك وخطواتك من حسابك';if(p)p.textContent='راجع المنح المحفوظة والمهمات والطلبات والتنبيهات من مكان واحد.';if(!banner.querySelector('[data-account-banner]')){const a=document.createElement('a');a.href='profile.html';a.className='dark';a.dataset.accountBanner='';a.textContent='فتح حسابي';banner.appendChild(a)}}}});
