import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { collection, getDocs, getFirestore, query, where } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { mergeScholarships } from './scholarship-catalog.js';
if(location.pathname.endsWith('/scholarships.html')){
  const app=getApps().length?getApp():initializeApp(firebaseConfig),db=getFirestore(app),cards=document.querySelector('#scholarship-cards')||document.querySelector('.cards'),count=document.querySelector('#scholarship-count'),empty=document.querySelector('#scholarship-empty');
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const countryIcon=c=>({'روسيا':'🇷🇺','المجر':'🇭🇺','تركيا':'🇹🇷'}[c]||'🌍');
  const niceDate=v=>{if(!v)return'بانتظار الإعلان';const d=new Date(`${v}T00:00:00`);return Number.isNaN(d.getTime())?v:d.toLocaleDateString('ar-SA',{year:'numeric',month:'short',day:'numeric'})};
  let remote=[];try{const snap=await getDocs(query(collection(db,'scholarships'),where('publishStatus','==','published')));remote=snap.docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.warn('Using local scholarship catalog',e)}
  const all=mergeScholarships(remote).filter(x=>x.publishStatus==='published').sort((a,b)=>(a.sortOrder??999)-(b.sortOrder??999));
  let active='all';
  function render(){
    const items=active==='all'?all:all.filter(s=>s.country===active);
    if(count)count.textContent=`${items.length} منحة`;
    if(empty)empty.hidden=items.length>0;
    if(!cards)return;
    cards.innerHTML=items.map(s=>{
      const slug=s.slug||s.id,href=`scholarship.html?slug=${encodeURIComponent(slug)}`;
      const levels=(s.studyLevels||[]).slice(0,2).join('، ')||'عدة مراحل';
      return `<article class="scholarship-card" data-scholarship-country="${esc(s.country||'')}">
        <div class="scholarship-card-top"><div class="country-chip">${countryIcon(s.country)} ${esc(s.country||'دولي')}</div><span class="status-chip">${esc(s.statusLabel||'راجع الحالة')}</span></div>
        <div class="scholarship-provider">${esc(s.provider||'جهة مانحة')}</div>
        <h2>${esc(s.title)}</h2>
        <p class="scholarship-summary">${esc(s.shortDescription||'')}</p>
        <div class="scholarship-quick-info">
          <div><small>بداية التقديم</small><b>${esc(niceDate(s.openDate))}</b></div>
          <div><small>التمويل</small><b>${esc(s.funding||'حسب البرنامج')}</b></div>
          <div><small>المراحل</small><b>${esc(levels)}</b></div>
        </div>
        <div class="scholarship-actions"><a class="btn primary" href="${href}">كل معلومات المنحة</a></div>
      </article>`;
    }).join('');
  }
  document.querySelectorAll('.country-filter[data-country]').forEach(btn=>btn.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    active=btn.dataset.country||'all';
    document.querySelectorAll('.country-filter[data-country]').forEach(x=>x.classList.toggle('is-active',x===btn));
    render();
  }));
  render();
}
