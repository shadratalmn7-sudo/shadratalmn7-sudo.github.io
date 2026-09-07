import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import{collection,getDocs,getFirestore}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{firebaseConfig}from'./firebase-config.js';

const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ms=v=>v?.toMillis?.()||v?.toDate?.()?.getTime?.()||new Date(v||0).getTime()||0;
const dateFormatter=new Intl.DateTimeFormat('en-GB',{calendar:'gregory',numberingSystem:'latn',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
const when=v=>{const t=ms(v);return t?dateFormatter.format(new Date(t)):'—'};
const num=v=>Number(v||0).toLocaleString('en-US',{numberingSystem:'latn'});
const read=async name=>{try{const s=await getDocs(collection(db,name));return s.docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.warn('[Shadrat activity]',name,e);return[]}};
const seenKey='shadrat-admin-activity-seen-at';
const seenAt=()=>Number(localStorage.getItem(seenKey)||0);
const markSeen=t=>localStorage.setItem(seenKey,String(t||Date.now()));

function event(uid,title,row,kind='نشاط',href=''){
  const time=row.savedAt||row.createdAt||row.updatedAt||null;
  return{uid,title,kind,time,sort:ms(time),href};
}
function activityTitle(row){
  if(row.type==='artifact')return row.artifactType==='motivation'?'أنشأ/حفظ Motivation Letter':'أنشأ/حفظ CV';
  if(row.type==='scholarship')return'حفظ منحة';
  if(row.type==='activity')return row.label||row.activityType||'استخدم أداة';
  return row.label||'نشاط على الحساب';
}
function paintBadge(key,count){
  document.querySelectorAll(`[data-admin-badge="${key}"]`).forEach(b=>{b.textContent=num(count);b.hidden=!count});
}

function ensureStyles(){
  if(document.getElementById('admin-activity-center-style'))return;
  const st=document.createElement('style');
  st.id='admin-activity-center-style';
  st.textContent=`
  .admin-activity-bell-wrap{position:relative;margin-inline-start:auto;z-index:2147483000}
  .admin-activity-bell{position:relative;border:1px solid #cfe0f5;background:#fff;border-radius:12px;width:42px;height:42px;font-size:20px;cursor:pointer}
  .admin-activity-bell-count{position:absolute;top:-6px;right:-6px;min-width:19px;height:19px;padding:0 4px;border-radius:999px;background:#dc2626;color:#fff;font:800 11px/19px Arial;text-align:center}
  .admin-activity-menu{position:absolute;top:48px;left:0;width:min(430px,calc(100vw - 24px));max-height:70vh;overflow:auto;padding:12px;border:1px solid #dbe7f3;border-radius:18px;background:#fff;box-shadow:0 22px 55px rgba(15,39,70,.2);z-index:2147483600}
  .admin-activity-menu[hidden]{display:none!important}
  .admin-activity-menu-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:9px}
  .admin-activity-row{display:grid;gap:7px;padding:12px 13px;border:1px solid #dce7f4;border-radius:15px;margin-top:9px;background:#fff;color:inherit;text-decoration:none;box-shadow:0 4px 14px rgba(33,69,110,.045)}
  .admin-activity-row.is-new{background:#f3f7ff;border-color:#b9d1f5}
  .admin-activity-row-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;color:#6b7f95;font-size:12px}
  .admin-activity-time{direction:ltr;unicode-bidi:isolate;font-family:Arial,sans-serif;font-variant-numeric:tabular-nums}
  .admin-activity-mark{border:0;background:#e8f0fb;color:#1748b5;border-radius:9px;padding:7px 9px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
  .admin-activity-center-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .admin-activity-center-card{display:grid;gap:8px;padding:14px;border:1px solid #dbe7f3;border-radius:16px;background:#fff;color:inherit;text-decoration:none;box-shadow:0 5px 16px rgba(33,69,110,.045)}
  .admin-activity-center-card:hover{border-color:#b9d1f5;background:#f8fbff}
  .admin-activity-center-card .meta{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;color:#6b7f95;font-size:12px}
  @media(max-width:700px){
    .site-header{position:relative!important;z-index:2147483646!important;overflow:visible!important}
    .site-header .nav{overflow:visible!important}
    .admin-activity-bell-wrap{z-index:2147483647!important}
    .admin-activity-menu{position:fixed!important;top:68px!important;right:12px!important;left:12px!important;width:auto!important;max-height:calc(100dvh - 84px)!important;overflow:auto!important;overscroll-behavior:contain;background:#fff!important;z-index:2147483647!important;box-shadow:0 18px 60px rgba(15,39,70,.28)!important}
    body.admin-activity-open{overflow:hidden!important}
    .admin-activity-center-grid{grid-template-columns:1fr}
  }`;
  document.head.appendChild(st);
}

function ensureBell(){
  const nav=document.querySelector('.site-header .nav');
  if(!nav)return null;
  ensureStyles();
  let wrap=nav.querySelector('.admin-activity-bell-wrap');
  if(wrap)return wrap;
  wrap=document.createElement('div');
  wrap.className='admin-activity-bell-wrap';
  wrap.innerHTML=`<button class="admin-activity-bell" type="button" aria-label="نشاط الطلاب" aria-expanded="false">🔔<span class="admin-activity-bell-count" hidden>0</span></button><section class="admin-activity-menu" hidden><div class="admin-activity-menu-head"><b>آخر نشاط الطلاب</b><button type="button" class="admin-activity-mark">تحديد الكل كمقروء</button></div><div class="admin-activity-list"></div></section>`;
  nav.appendChild(wrap);
  const button=wrap.querySelector('.admin-activity-bell'),menu=wrap.querySelector('.admin-activity-menu');
  const setOpen=open=>{
    menu.hidden=!open;
    button.setAttribute('aria-expanded',String(open));
    document.body.classList.toggle('admin-activity-open',open&&matchMedia('(max-width:700px)').matches);
  };
  button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setOpen(menu.hidden)});
  wrap.querySelector('.admin-activity-mark').addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    markSeen(Date.now());
    renderBell(window.ShadratAdminActivity?.events||[],window.ShadratAdminActivity?.byUid||new Map());
  });
  document.addEventListener('click',e=>{if(!wrap.contains(e.target))setOpen(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
  window.addEventListener('resize',()=>{if(menu.hidden)document.body.classList.remove('admin-activity-open')});
  return wrap;
}

function renderBell(events,byUid){
  const wrap=ensureBell();if(!wrap)return;
  const seen=seenAt(),unread=events.filter(e=>e.sort>seen).length,count=wrap.querySelector('.admin-activity-bell-count');
  count.textContent=unread>99?'99+':String(unread);count.hidden=!unread;
  const list=wrap.querySelector('.admin-activity-list');
  list.innerHTML=events.slice(0,40).map(e=>{
    const u=byUid.get(e.uid)||{};
    return`<a class="admin-activity-row ${e.sort>seen?'is-new':''}" href="${esc(e.href||`admin-student.html?uid=${encodeURIComponent(e.uid)}`)}"><b>${esc(u.fullName||u.username||'طالب')}: ${esc(e.title)}</b><span class="admin-activity-row-meta"><span>${esc(e.kind)}</span><time class="admin-activity-time" datetime="${e.sort?new Date(e.sort).toISOString():''}">${esc(when(e.time))}</time></span></a>`;
  }).join('')||'<div class="muted">لا توجد نشاطات بعد.</div>';
}

async function load(){
  const admin=auth.currentUser;if(!admin)return;
  const [users,saved,orders,messages]=await Promise.all([read('users'),read('savedCommunityPosts'),read('orders'),read('messages')]);
  const students=users.filter(u=>(u.role||'student')==='student').map(u=>({uid:u.uid||u.id,...u}));
  const byUid=new Map(students.map(u=>[u.uid,u])),events=[];
  students.forEach(u=>{if(ms(u.createdAt))events.push(event(u.uid,'أنشأ حسابًا جديدًا',u,'تسجيل',`admin-student.html?uid=${encodeURIComponent(u.uid)}`))});
  saved.forEach(r=>{if(r.userId)events.push(event(r.userId,activityTitle(r),r,r.type==='artifact'?'ملف':'أداة',`admin-student.html?uid=${encodeURIComponent(r.userId)}`))});
  orders.forEach(r=>{if(r.userId)events.push(event(r.userId,`طلب خدمة: ${r.serviceTitle||'خدمة'}`,r,'خدمة','admin-orders.html'))});
  messages.filter(r=>r.userId&&r.type!=='service').forEach(r=>events.push(event(r.userId,'أرسل رسالة إلى شذرات',r,'رسالة','admin-messages.html')));
  events.sort((a,b)=>b.sort-a.sort);
  const totalUnread=events.filter(e=>e.sort>seenAt()).length;
  paintBadge('admin-users.html',totalUnread);
  window.ShadratAdminActivity={users:students,events,byUid,totalUnread};
  renderBell(events,byUid);
  document.dispatchEvent(new CustomEvent('shadrat:admin-activity',{detail:window.ShadratAdminActivity}));
  if((location.pathname.split('/').pop()||'')==='admin-analytics.html')renderCenter(events,byUid,totalUnread);
}

function renderCenter(events,byUid,totalUnread){
  const main=document.querySelector('.admin-main');if(!main)return;
  let box=document.querySelector('#admin-activity-center');
  if(!box){box=document.createElement('section');box.id='admin-activity-center';box.className='card';box.style.marginTop='18px';main.appendChild(box)}
  box.innerHTML=`<div class="admin-title" style="margin-bottom:12px"><div><span class="eyebrow">آخر التحديثات</span><h2 style="margin:4px 0">نشاط الطلاب</h2><p class="muted">كل نشاط في بطاقة مستقلة وواضحة.</p></div><span class="admin-count-badge" style="position:static" ${totalUnread?'':'hidden'}>${num(totalUnread)} جديد</span></div><div class="admin-activity-center-grid">${events.slice(0,30).map(e=>{const u=byUid.get(e.uid)||{};return`<a class="admin-activity-center-card" href="${esc(e.href||`admin-student.html?uid=${encodeURIComponent(e.uid)}`)}"><b>${esc(u.fullName||u.username||'طالب')}</b><span>${esc(e.title)}</span><span class="meta"><span>${esc(e.kind)}</span><time class="admin-activity-time" datetime="${e.sort?new Date(e.sort).toISOString():''}">${esc(when(e.time))}</time></span></a>`}).join('')||'<div class="muted">لا توجد نشاطات مسجلة بعد.</div>'}</div>`;
}

onAuthStateChanged(auth,u=>{if(u)load().catch(e=>console.error('[Shadrat] activity',e))});
setInterval(()=>load().catch(()=>{}),60000);
