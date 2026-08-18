import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { collection, getDocs, getFirestore, query, where } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { scholarshipCatalog, mergeScholarships } from './scholarship-catalog.js';
if(location.pathname.endsWith('/scholarships.html')){
 const cards=document.querySelector('#scholarship-cards'),count=document.querySelector('#scholarship-count'),empty=document.querySelector('#scholarship-empty');
 const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const flag=c=>({'روسيا':'🇷🇺','المجر':'🇭🇺','تركيا':'🇹🇷','ألمانيا':'🇩🇪','السعودية':'🇸🇦','فرنسا':'🇫🇷','إيطاليا':'🇮🇹','إسبانيا':'🇪🇸','الصين':'🇨🇳','اليابان':'🇯🇵','كوريا الجنوبية':'🇰🇷'}[c]||'🌍');
 const landmarkPath=c=>({
  'روسيا':'M4 20h16M7 20v-7h10v7M9 13V9h6v4M10 9V6h4v3M12 6V3M8 13l-2-2 2-2m8 4 2-2-2-2',
  'المجر':'M4 20h16M6 20v-9h12v9M8 11V8h8v3M10 8V5h4v3M12 5V3M5 11h14',
  'تركيا':'M4 20h16M6 20v-8h12v8M9 12V8h6v4M12 8V4M10 6h4M8 20v-4h8v4',
  'ألمانيا':'M4 20h16M6 20v-8h12v8M8 12V7h8v5M7 7h10M9 7V4h6v3M12 4V2',
  'فرنسا':'M8 21h8M9 21l3-18 3 18M10 8h4M9.5 12h5M9 16h6',
  'إيطاليا':'M4 20h16M6 20V9h12v11M8 9V6h8v3M10 6V3h4v3M8 13h8M8 16h8',
  'إسبانيا':'M4 20h16M6 20V8h12v12M8 8V5h8v3M10 5V3h4v2M9 12h6M9 16h6',
  'الصين':'M4 20h16M6 20V9h12v11M8 9l4-5 4 5M9 13h6M9 16h6',
  'اليابان':'M4 20h16M7 20V9h10v11M9 9l3-5 3 5M9 13h6M9 16h6',
  'السعودية':'M4 20h16M6 20v-7h12v7M8 13V9h8v4M10 9V6h4v3M12 6V3'
 }[c]||'M4 20h16M6 20V8h12v12M8 8l4-5 4 5M9 13h6M9 16h6');
 const landmark=c=>`<svg class="country-landmark" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${landmarkPath(c)}"/></svg>`;
 const date=v=>{if(!v)return null;const d=new Date(String(v).length===10?`${v}T00:00:00`:v);return isNaN(d)?null:d};
 const prettyDate=v=>{const d=date(v);return d?d.toLocaleDateString('ar-SA-u-ca-gregory',{year:'numeric',month:'long',day:'numeric'}):'بانتظار الإعلان'};
 const timer=s=>{const now=Date.now(),o=date(s.openDate||s.openingDate),c=date(s.deadline||s.closeDate||s.endDate);let t,l;if(o&&now<o){t=o;l='يفتح التقديم خلال'}else if(c&&now<c){t=c;l='ينتهي التقديم خلال'}else if(c&&now>=c)return{l:'حالة التقديم',v:'مغلق حاليًا'};else return{l:'موعد التقديم',v:s.statusLabel||'بانتظار الإعلان'};const total=Math.max(0,t-now),days=Math.floor(total/86400000),hours=Math.floor((total%86400000)/3600000),mins=Math.floor((total%3600000)/60000);let v;if(days>0)v=`${days} يوم${hours?` و ${hours} ساعة`:''}`;else if(hours>0)v=`${hours} ساعة${mins?` و ${mins} دقيقة`:''}`;else v=`${Math.max(1,mins)} دقيقة`;return{l,v}};
 let all=mergeScholarships([]).filter(x=>x.publishStatus==='published').sort((a,b)=>(a.sortOrder??999)-(b.sortOrder??999));let active='all';
 const heart='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 5.9l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.3a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
 function render(){const items=active==='all'?all:all.filter(s=>s.country===active);if(count)count.textContent=`${items.length} منحة`;if(empty)empty.hidden=!!items.length;if(!cards)return;cards.innerHTML=items.map(s=>{const slug=s.slug||s.id,t=timer(s),levels=(s.studyLevels||[]).slice(0,4).join(' • '),country=s.country||'دولي';return `<article class="scholarship-card scholarship-${country==='روسيا'?'ru':country==='المجر'?'hu':country==='تركيا'?'tr':country==='ألمانيا'?'de':'global'}"><div class="scholarship-accent"></div><div class="scholarship-card-top"><div class="country-favorite-group"><div class="country-badge-large"><span class="country-landmark-mini">${landmark(country)}</span><span class="country-name">${esc(country)}</span><span class="country-flag">${flag(country)}</span></div><button type="button" class="scholarship-favorite-btn" data-favorite-slug="${esc(slug)}" data-favorite-title="${esc(s.title||'')}" data-favorite-country="${esc(country)}" aria-label="إضافة للمفضلة" aria-pressed="false">${heart}</button></div><span class="status-chip">${esc(s.statusLabel||'منحة')}</span></div><div class="scholarship-provider">${esc(s.provider||'جهة مانحة')}</div><h2>${esc(s.title)}</h2><p class="scholarship-summary">${esc(s.shortDescription||'')}</p><div class="scholarship-countdown"><div class="countdown-copy"><small>${esc(t.l)}</small><strong>${esc(t.v)}</strong><span>تاريخ البداية: ${esc(prettyDate(s.openDate||s.openingDate))}</span></div><div class="countdown-clock" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg></div><div class="countdown-landmark">${landmark(country)}</div></div><div class="scholarship-meta-row"><div><small>التمويل</small><b>${esc(s.funding||'حسب البرنامج')}</b></div><div><small>المراحل الدراسية</small><b>${esc(levels||'حسب البرنامج')}</b></div></div><a class="btn primary scholarship-details-btn" href="scholarship.html?slug=${encodeURIComponent(slug)}"><span>عرض تفاصيل المنحة</span><i>←</i></a></article>`}).join('')}
 document.querySelectorAll('button.country-filter[data-country]').forEach(btn=>btn.onclick=e=>{e.preventDefault();e.stopPropagation();active=btn.dataset.country||'all';document.querySelectorAll('button.country-filter').forEach(x=>x.classList.toggle('is-active',x===btn));render();return false});
 render();
 requestAnimationFrame(async()=>{try{const app=getApps().length?getApp():initializeApp(firebaseConfig),db=getFirestore(app);const snap=await getDocs(query(collection(db,'scholarships'),where('publishStatus','==','published')));const remote=snap.docs.map(d=>({id:d.id,...d.data()}));if(remote.length){all=mergeScholarships(remote).filter(x=>x.publishStatus==='published').sort((a,b)=>(a.sortOrder??999)-(b.sortOrder??999));render()}}catch(e){console.warn('Scholarships background refresh skipped',e)}});
 setInterval(render,60000);
}
