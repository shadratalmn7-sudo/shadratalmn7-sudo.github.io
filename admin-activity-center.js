import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import{collection,getDocs,getFirestore}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{firebaseConfig}from'./firebase-config.js';
const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ms=v=>v?.toMillis?.()||v?.toDate?.()?.getTime?.()||new Date(v||0).getTime()||0;
const when=v=>{const t=ms(v);return t?new Intl.DateTimeFormat('ar-SA',{dateStyle:'short',timeStyle:'short'}).format(new Date(t)):'—'};
const waitUser=()=>new Promise(resolve=>{const stop=onAuthStateChanged(auth,u=>{stop();resolve(u)},()=>resolve(null))});
const read=async name=>{try{const s=await getDocs(collection(db,name));return s.docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.warn('[Shadrat activity]',name,e);return[]}};
const timeOf=x=>x.savedAt||x.createdAt||x.updatedAt||null;
function event(uid,title,row,kind='نشاط'){return{uid,title,kind,time:timeOf(row),sort:ms(timeOf(row))}}
function activityTitle(row){if(row.type==='artifact')return row.artifactType==='motivation'?'أنشأ/حفظ Motivation Letter':'أنشأ/حفظ CV';if(row.type==='scholarship')return'حفظ منحة';if(row.type==='activity')return row.label||row.activityType||'استخدم أداة';return row.label||'نشاط على الحساب'}
function unreadFor(user,events){const seen=ms(user.adminActivityReviewedAt);return events.filter(e=>e.uid===user.uid&&e.sort>seen).length}
function paintBadge(key,count){document.querySelectorAll(`[data-admin-badge="${key}"]`).forEach(b=>{b.textContent=Number(count||0).toLocaleString('ar');b.hidden=!count})}
async function load(){
  const admin=auth.currentUser||await waitUser();if(!admin)return;
  const [users,saved,orders,messages]=await Promise.all([read('users'),read('savedCommunityPosts'),read('orders'),read('messages')]);
  const students=users.filter(u=>(u.role||'student')==='student').map(u=>({uid:u.uid||u.id,...u})),byUid=new Map(students.map(u=>[u.uid,u]));
  const events=[];
  students.forEach(u=>{if(ms(u.createdAt))events.push(event(u.uid,'أنشأ حسابًا جديدًا',u,'تسجيل'))});
  saved.forEach(r=>{if(r.userId)events.push(event(r.userId,activityTitle(r),r,r.type==='artifact'?'ملف':'أداة'))});
  orders.forEach(r=>{if(r.userId)events.push(event(r.userId,`طلب خدمة: ${r.serviceTitle||'خدمة'}`,r,'خدمة'))});
  messages.filter(r=>r.userId&&r.type!=='service').forEach(r=>events.push(event(r.userId,'أرسل رسالة إلى شذرات',r,'رسالة')));
  events.sort((a,b)=>b.sort-a.sort);
  const totalUnread=students.reduce((sum,u)=>sum+unreadFor(u,events),0);
  paintBadge('admin-users.html',totalUnread);paintBadge('admin-analytics.html',totalUnread);
  window.ShadratAdminActivity={users:students,events,unreadFor,totalUnread};
  document.dispatchEvent(new CustomEvent('shadrat:admin-activity',{detail:window.ShadratAdminActivity}));
  if((location.pathname.split('/').pop()||'')==='admin-analytics.html')renderCenter(events,byUid,totalUnread);
}
function renderCenter(events,byUid,totalUnread){
  const main=document.querySelector('.admin-main');if(!main)return;
  let box=document.querySelector('#admin-activity-center');if(!box){box=document.createElement('section');box.id='admin-activity-center';box.className='card';box.style.marginTop='18px';const anchor=main.querySelector('.table-card')||null;anchor?main.insertBefore(box,anchor):main.appendChild(box)}
  const rows=events.slice(0,50);
  box.innerHTML=`<div class="admin-title" style="margin-bottom:12px"><div><span class="eyebrow">آخر التحديثات</span><h2 style="margin:4px 0">نشاط الطلاب التشغيلي</h2><p class="muted">تسجيلات جديدة وطلبات خدمات واستخدام الأدوات وحفظ CV/Motivation. لا يتم عرض محتوى الملفات هنا.</p></div><span class="admin-count-badge" style="position:static" ${totalUnread?'':'hidden'}>${totalUnread.toLocaleString('ar')} جديد</span></div><div style="display:grid;gap:9px">${rows.length?rows.map(e=>{const u=byUid.get(e.uid)||{};return`<a href="admin-student.html?uid=${encodeURIComponent(e.uid)}" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:12px;border:1px solid #dbe7f3;border-radius:14px;background:#fff;color:inherit;text-decoration:none"><span><b>${esc(u.fullName||u.username||'طالب')}</b> <small style="direction:ltr;display:inline-block">@${esc(u.username||'—')} · ${esc(u.email||'—')}</small><br><span>${esc(e.title)}</span> <small>· ${esc(e.kind)}</small></span><small>${esc(when(e.time))}</small></a>`}).join(''):'<div class="muted">لا توجد نشاطات مسجلة بعد.</div>'}</div>`;
}
load().catch(e=>console.error('[Shadrat] admin activity center',e));
setInterval(()=>load().catch(()=>{}),60000);
