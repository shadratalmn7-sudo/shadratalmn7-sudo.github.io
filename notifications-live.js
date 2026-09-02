import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{collection,doc,getDocs,getFirestore,limit,orderBy,query,updateDoc,where}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import{firebaseConfig}from'./firebase-config.js';
const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style=document.createElement('style');style.textContent=`.shz-alert-stack{position:fixed;top:84px;left:18px;z-index:1100;width:min(390px,calc(100% - 36px));display:grid;gap:10px}.shz-alert{position:relative;overflow:hidden;background:radial-gradient(circle at 85% 5%,rgba(94,164,255,.24),transparent 34%),linear-gradient(135deg,#071a35 0%,#0e315b 52%,#174f83 100%);border:1px solid rgba(255,255,255,.16);border-radius:20px;padding:17px 18px;box-shadow:0 20px 48px rgba(5,22,48,.30);direction:rtl;color:#fff}.shz-alert:after{content:'';position:absolute;width:150px;height:150px;left:-70px;bottom:-90px;border-radius:50%;background:rgba(255,255,255,.07);pointer-events:none}.shz-alert b{position:relative;z-index:1;display:block;color:#fff;margin-bottom:6px;font-size:16px}.shz-alert p{position:relative;z-index:1;margin:0;color:#dceaff;line-height:1.75;font-size:13px}.shz-alert button{position:relative;z-index:1;margin-top:11px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.13);color:#fff;border-radius:11px;padding:8px 13px;font:inherit;font-weight:900;cursor:pointer;backdrop-filter:blur(6px)}.shz-alert button:hover{background:rgba(255,255,255,.2)}@media(max-width:520px){.shz-alert-stack{top:82px;left:12px;width:calc(100% - 24px)}.shz-alert{padding:15px 16px;border-radius:18px}}`;document.head.appendChild(style);
const stack=document.createElement('div');stack.className='shz-alert-stack';document.body.appendChild(stack);
const shown=new Set(JSON.parse(sessionStorage.getItem('shz_seen_alerts')||'[]'));
let generalItems=[],scheduleTimer=null;

function remember(id){shown.add(id);sessionStorage.setItem('shz_seen_alerts',JSON.stringify([...shown].slice(-50)))}
function toMillis(value){
  if(!value)return null;
  if(typeof value?.toMillis==='function')return value.toMillis();
  if(typeof value?.seconds==='number')return value.seconds*1000;
  if(typeof value==='number')return value;
  if(value instanceof Date)return value.getTime();
  if(typeof value==='string'){const normalized=/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T00:00:00':value;const t=new Date(normalized).getTime();return Number.isNaN(t)?null:t}
  return null;
}
function scheduleMillis(item,kind){
  const keys=kind==='start'?['startAt','startDateTime','startsAt','startDate','publishFrom']:['endAt','endDateTime','endsAt','endDate','publishUntil'];
  for(const key of keys){const ms=toMillis(item?.[key]);if(ms!==null)return ms}
  return null;
}
function isActive(item,now=Date.now()){
  if(item.publishStatus!=='published')return false;
  const start=scheduleMillis(item,'start')??toMillis(item.createdAt);
  const explicitEnd=scheduleMillis(item,'end');
  const end=explicitEnd??(start!==null?start+24*60*60*1000:null);
  if(start!==null&&now<start)return false;
  if(end!==null&&now>=end)return false;
  return true;
}
function removeExpired(){
  const now=Date.now();
  stack.querySelectorAll('[data-announcement-id]').forEach(el=>{
    const item=generalItems.find(x=>x.id===el.dataset.announcementId);
    if(!item||!isActive(item,now))el.remove();
  });
}
function showItem(id,title,body,onClose,announcementId=null){
  if(shown.has(id))return;
  if(announcementId&&stack.querySelector(`[data-announcement-id="${CSS.escape(announcementId)}"]`))return;
  const el=document.createElement('article');el.className='shz-alert';
  if(announcementId)el.dataset.announcementId=announcementId;
  el.innerHTML=`<b>${esc(title)}</b><p>${esc(body)}</p><button type="button">حسنًا</button>`;
  el.querySelector('button').onclick=async()=>{remember(id);el.remove();try{await onClose?.()}catch{}};
  stack.appendChild(el);
}
function renderGeneral(){
  const now=Date.now();
  removeExpired();
  generalItems.filter(x=>isActive(x,now)).sort((a,b)=>{
    const av=scheduleMillis(a,'start')??a.createdAt?.toMillis?.()??0,bv=scheduleMillis(b,'start')??b.createdAt?.toMillis?.()??0;return av-bv;
  }).slice(-3).forEach(x=>showItem(`a:${x.id}`,x.title,x.body,null,x.id));
  scheduleNextBoundary();
}
function scheduleNextBoundary(){
  clearTimeout(scheduleTimer);
  const now=Date.now(),boundaries=[];
  generalItems.forEach(x=>{
    const start=scheduleMillis(x,'start')??toMillis(x.createdAt),explicitEnd=scheduleMillis(x,'end'),end=explicitEnd??(start!==null?start+24*60*60*1000:null);
    if(start!==null&&start>now)boundaries.push(start);
    if(end!==null&&end>now)boundaries.push(end);
  });
  if(!boundaries.length)return;
  const next=Math.min(...boundaries),delay=Math.min(Math.max(next-now+250,250),2147483000);
  scheduleTimer=setTimeout(renderGeneral,delay);
}
async function loadGeneral(){
  try{
    const s=await getDocs(query(collection(db,'announcements'),where('publishStatus','==','published'),limit(30)));
    generalItems=s.docs.map(d=>({id:d.id,...d.data()}));
    renderGeneral();
  }catch(e){console.warn('[Shadrat] announcements unavailable',e)}
}
loadGeneral();

onAuthStateChanged(auth,async user=>{
  if(!user)return;
  try{
    const s=await getDocs(query(collection(db,'users',user.uid,'notifications'),orderBy('createdAt','desc'),limit(8)));
    s.docs.reverse().forEach(d=>{const x=d.data();if(x.read)return;showItem(`n:${d.id}`,x.title||'تنبيه من شذرات',x.body||'',()=>updateDoc(doc(db,'users',user.uid,'notifications',d.id),{read:true}))})
  }catch(e){console.warn('personal notifications unavailable',e)}
});
