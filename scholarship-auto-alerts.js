import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{collection,getFirestore,onSnapshot,query,where}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{firebaseConfig}from'./firebase-config.js';

if(!window.__shadratScholarshipAutoAlerts){window.__shadratScholarshipAutoAlerts=true;
const app=getApps().length?getApp():initializeApp(firebaseConfig),db=getFirestore(app);
let scholarships=[],timer=null;
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function norm(v=''){return String(v).toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[^a-z0-9\u0600-\u06ff]+/g,' ').trim()}
function ms(v){if(!v)return 0;if(typeof v?.toMillis==='function')return v.toMillis();if(typeof v?.toDate==='function')return v.toDate().getTime();if(typeof v==='number')return v;const s=String(v).trim();if(!s)return 0;const d=/^\d{4}-\d{2}-\d{2}$/.test(s)?new Date(`${s}T00:00:00`):new Date(s);return Number.isFinite(d.getTime())?d.getTime():0}
function endMs(v){const t=ms(v);if(!t)return 0;return /^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?t+86399999:t}
function isOpen(row,now=Date.now()){const start=ms(row.openDate||row.startDate||row.applicationOpenDate),end=endMs(row.deadline||row.endDate||row.applicationDeadline);if(!start)return false;if(end&&end<start)return false;return start<=now&&(!end||now<=end)}
function sid(row){return row.slug||row.id||norm(row.title||row.name||'scholarship').replace(/\s+/g,'-')}
function key(row){return`shz-sch-open:all:${sid(row)}:${ms(row.openDate||row.startDate)||'open'}`}
function seen(row){try{return localStorage.getItem(key(row))==='1'}catch{return false}}
function remember(row){try{localStorage.setItem(key(row),'1')}catch{}}
function ensureUi(){let stack=document.querySelector('.shz-scholarship-stack');if(stack)return stack;const style=document.createElement('style');style.id='shz-scholarship-alert-style';style.textContent=`.shz-scholarship-stack{position:fixed;left:14px;bottom:16px;z-index:2147482500;width:min(390px,calc(100vw - 28px));display:grid;gap:9px;direction:rtl}.shz-scholarship-alert{border:1px solid #bad3fb;border-radius:18px;background:linear-gradient(145deg,#fff,#f2f7ff);box-shadow:0 16px 42px rgba(15,39,70,.18);padding:15px;color:#17324f}.shz-scholarship-alert b{display:block;font-size:15px}.shz-scholarship-alert p{margin:6px 0 11px;color:#526b86;line-height:1.65;font-size:12.5px}.shz-scholarship-alert-actions{display:flex;gap:7px}.shz-scholarship-alert button,.shz-scholarship-alert a{border:0;border-radius:11px;padding:8px 11px;font:inherit;font-size:12px;font-weight:900;cursor:pointer;text-decoration:none}.shz-scholarship-alert a{background:#2563eb;color:#fff}.shz-scholarship-alert button{background:#e7eef8;color:#31506f}@media(max-width:520px){.shz-scholarship-stack{left:10px;bottom:10px;width:calc(100vw - 20px)}}`;document.head.appendChild(style);stack=document.createElement('div');stack.className='shz-scholarship-stack';stack.setAttribute('aria-live','polite');document.body.appendChild(stack);return stack}
function show(row){if(seen(row))return;remember(row);const stack=ensureUi(),el=document.createElement('article');el.className='shz-scholarship-alert';const href=`scholarship.html?slug=${encodeURIComponent(row.slug||row.id||'')}`;el.innerHTML=`<b>🎓 فتحت منحة جديدة</b><p><strong>${esc(row.title||row.name||'منحة جديدة')}</strong><br>متاحة الآن على شذرات. التنبيه يصل للجميع بدون الحاجة لتحديد المرحلة الدراسية.</p><div class="shz-scholarship-alert-actions"><a href="${esc(href)}">عرض المنحة</a><button type="button">إغلاق</button></div>`;el.querySelector('button').onclick=()=>el.remove();stack.appendChild(el)}
function schedule(){clearTimeout(timer);const now=Date.now(),next=scholarships.filter(r=>r.publishStatus==='published').map(r=>ms(r.openDate||r.startDate||r.applicationOpenDate)).filter(t=>t>now).sort((a,b)=>a-b)[0];if(!next)return;timer=setTimeout(evaluate,Math.min(Math.max(next-now+1200,1200),2147483000))}
function evaluate(){const now=Date.now();scholarships.filter(r=>r.publishStatus==='published'&&isOpen(r,now)&&!seen(r)).sort((a,b)=>ms(b.openDate||b.startDate)-ms(a.openDate||a.startDate)).slice(0,3).forEach(show);schedule()}
onSnapshot(query(collection(db,'scholarships'),where('publishStatus','==','published')),s=>{scholarships=s.docs.map(d=>({id:d.id,...d.data()}));evaluate()},e=>console.warn('[Shadrat] scholarship alerts',e));
setInterval(evaluate,15*60*1000);
window.ShadratScholarshipAlertTest={isOpen};
}
