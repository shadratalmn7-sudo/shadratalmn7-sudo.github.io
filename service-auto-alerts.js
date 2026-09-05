import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{collection,getFirestore,onSnapshot,query,where}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{firebaseConfig}from'./firebase-config.js';

if(!window.__shadratServiceAutoAlerts){window.__shadratServiceAutoAlerts=true;
const app=getApps().length?getApp():initializeApp(firebaseConfig),db=getFirestore(app);
const FEATURE_EPOCH=Date.parse('2026-09-05T22:10:00Z');
const STATIC_SERVICES=[
 {id:'cv-builder',title:'منشئ السيرة الذاتية CV',body:'أنشئ سيرتك الذاتية من قوالب شذرات واحفظ نسخك في حسابك.',href:'cv-builder.html',icon:'📄'},
 {id:'motivation-letter',title:'منشئ Motivation Letter',body:'أنشئ خطاب الدافع تلقائيًا أو يدويًا مع قوالب جاهزة للتحميل.',href:'motivation-letter.html',icon:'✍️'},
 {id:'consult-open-doors',title:'استشارة Open Doors — مجانية',body:'استشارة مجانية لفهم المسارات والمراحل وتجهيز الملف قبل التقديم.',href:'service-request.html?service='+encodeURIComponent('استشارة Open Doors')+'&price='+encodeURIComponent('مجانية'),icon:'💬'},
 {id:'consult-education-russia',title:'استشارة Education in Russia — مجانية',body:'استشارة مجانية لشرح بوابة الكوتة والخيارات والخطوات العامة.',href:'service-request.html?service='+encodeURIComponent('استشارة Education in Russia')+'&price='+encodeURIComponent('مجانية'),icon:'🎓'}
];
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ms=v=>{if(!v)return 0;if(typeof v?.toMillis==='function')return v.toMillis();if(typeof v?.seconds==='number')return v.seconds*1000;if(typeof v==='number')return v;const t=new Date(v).getTime();return Number.isFinite(t)?t:0};
const key=(id,stamp='v1')=>`shz-service-alert:${id}:${stamp}`;
function seen(id,stamp){try{return localStorage.getItem(key(id,stamp))==='1'}catch{return false}}
function remember(id,stamp){try{localStorage.setItem(key(id,stamp),'1')}catch{}}
function ensureUi(){let stack=document.querySelector('.shz-service-alert-stack');if(stack)return stack;const style=document.createElement('style');style.id='shz-service-alert-style';style.textContent=`.shz-service-alert-stack{position:fixed;right:14px;bottom:16px;z-index:2147482490;width:min(400px,calc(100vw - 28px));display:grid;gap:9px;direction:rtl}.shz-service-alert{border:1px solid #bdd3f5;border-radius:18px;background:radial-gradient(circle at 90% 0,rgba(37,99,235,.13),transparent 32%),linear-gradient(145deg,#fff,#f3f8ff);box-shadow:0 16px 42px rgba(15,39,70,.19);padding:15px;color:#17324f}.shz-service-alert b{display:block;font-size:15px;line-height:1.55}.shz-service-alert p{margin:6px 0 11px;color:#526b86;line-height:1.65;font-size:12.5px}.shz-service-alert-actions{display:flex;gap:7px}.shz-service-alert button,.shz-service-alert a{border:0;border-radius:11px;padding:8px 11px;font:inherit;font-size:12px;font-weight:900;cursor:pointer;text-decoration:none}.shz-service-alert a{background:#2563eb;color:#fff}.shz-service-alert button{background:#e7eef8;color:#31506f}@media(max-width:520px){.shz-service-alert-stack{right:10px;bottom:10px;width:calc(100vw - 20px)}}`;document.head.appendChild(style);stack=document.createElement('div');stack.className='shz-service-alert-stack';stack.setAttribute('aria-live','polite');document.body.appendChild(stack);return stack}
const queue=[];let draining=false;
function drain(){if(draining||!queue.length)return;draining=true;const item=queue.shift(),stack=ensureUi(),el=document.createElement('article');el.className='shz-service-alert';el.innerHTML=`<b>${esc(item.icon||'✨')} ${esc(item.heading||'خدمة جديدة في شذرات')}</b><p><strong>${esc(item.title)}</strong><br>${esc(item.body||'اكتشف الخدمة الجديدة الآن من شذرات.')}</p><div class="shz-service-alert-actions"><a href="${esc(item.href||'services.html')}">عرض الخدمة</a><button type="button">إغلاق</button></div>`;const finish=()=>{el.remove();draining=false;setTimeout(drain,350)};el.querySelector('button').onclick=finish;el.querySelector('a').addEventListener('click',()=>{draining=false});stack.appendChild(el);setTimeout(()=>{if(el.isConnected)finish()},14000)}
function enqueue(item,stamp='v1'){if(seen(item.id,stamp))return;remember(item.id,stamp);queue.push(item);drain()}
function staticAlerts(){STATIC_SERVICES.forEach((item,index)=>setTimeout(()=>enqueue({...item,heading:'خدمة متاحة لك في شذرات'},'static-v2'),700+index*450))}
function serviceHref(row){return row.href||row.url||`service-request.html?service=${encodeURIComponent(row.title||'خدمة شذرات')}&price=${encodeURIComponent(row.category==='free'?'مجانية':(row.price?`${row.price}$`:''))}`}
function serviceBody(row){if(row.category==='free')return row.description?`مجانية — ${row.description}`:'خدمة مجانية متاحة الآن.';if(row.description)return row.description;return'خدمة جديدة متاحة الآن في شذرات.'}
let initialized=false;
function startDynamic(){onSnapshot(query(collection(db,'services'),where('publishStatus','==','published')),snapshot=>{const changes=snapshot.docChanges();for(const change of changes){const row={id:change.doc.id,...change.doc.data()};const created=ms(row.createdAt);const shouldNotify=(initialized&&change.type==='added')||(!initialized&&created>=FEATURE_EPOCH);if(!shouldNotify)continue;const stamp=created||'live-v1';enqueue({id:`live-${row.id}`,heading:'✨ خدمة جديدة في شذرات',title:row.title||'خدمة جديدة',body:serviceBody(row),href:serviceHref(row),icon:row.category==='free'?'🎁':'✨'},stamp)}initialized=true},error=>console.warn('[Shadrat] service auto alerts unavailable',error))}
staticAlerts();startDynamic();
window.ShadratServiceAlertTest={STATIC_SERVICES,serviceHref,serviceBody,featureEpoch:FEATURE_EPOCH};
}
