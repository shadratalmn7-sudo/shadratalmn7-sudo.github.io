import { getApp,getApps,initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { collection,deleteDoc,doc,getDocs,getFirestore,query,serverTimestamp,setDoc,where,writeBatch } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const style=document.createElement('link');style.rel='stylesheet';style.href='admin-operations.css?v=3';document.head.appendChild(style);
const localStyle=document.createElement('style');localStyle.textContent=`
.admin-recipient-search{width:100%;margin-bottom:8px}.admin-recipient-list{display:grid;gap:7px;max-height:230px;overflow:auto;border:1px solid #dbe7f3;border-radius:14px;padding:9px;background:#fff}.admin-recipient-option{display:flex;align-items:center;gap:9px;padding:9px 10px;border:1px solid #e6edf6;border-radius:11px;background:#f9fbff;cursor:pointer}.admin-recipient-option input{width:18px;height:18px;margin:0}.reward-section{margin-top:16px}.reward-section-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.reward-section-head h3{margin:0}.reward-list{display:grid;gap:8px}.reward-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;padding:10px 12px;border:1px solid #dbe7f3;border-radius:12px;background:#fff}.reward-row-main{min-width:0;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.reward-row-main b{font-size:14px}.reward-row-main span,.reward-row-main small{color:#64748b;font-size:12px}.reward-row-actions{display:flex;align-items:center;gap:6px}.reward-row-actions button{padding:6px 9px}.reward-empty{padding:12px;border:1px dashed #cbd5e1;border-radius:12px;color:#64748b;background:#f8fafc}.reward-danger{color:#b42318!important;border-color:#fecaca!important;background:#fff7f7!important}@media(max-width:700px){.reward-row{grid-template-columns:1fr}.reward-row-actions{justify-content:flex-start}.reward-row-main{gap:7px}.admin-recipient-list{max-height:190px}}
`;document.head.appendChild(localStyle);

const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),main=document.querySelector('.admin-main');
let users=[],items=[],mode='missions',recipientSelection=new Set();

main.innerHTML=`<div class="admin-title"><div><span class="eyebrow">نظام التحفيز</span><h1>XP والمهمات والجوائز</h1></div></div><div class="admin-live-note"><b>من هنا تتحكم فعليًا:</b> في الجوائز تقدر تختار الجميع أو أكثر من طالب في نفس المرة. جوائز الجميع والجوائز الفردية تظهر في أقسام منفصلة ويمكن حذف أي واحدة في أي وقت.</div><div class="admin-workspace"><div class="admin-toolbar"><div class="admin-tabs"><button class="active" data-mode="missions">المهمات</button><button data-mode="rewards">الجوائز</button></div><div class="admin-toolbar-actions"><button class="btn primary" id="add-item">إضافة مهمة</button></div></div><section class="admin-form-panel" id="item-editor" hidden><h2 id="editor-title">إضافة مهمة</h2><form id="item-form"><input type="hidden" name="id"><div class="admin-form-grid"><label>العنوان*<input name="title" required minlength="3"></label><label data-mission-only>XP للمهمة<input name="xp" type="number" min="0" max="2000" value="0"></label><label class="wide">الوصف أو تفاصيل المكافأة<textarea name="description" required></textarea></label><label>الجمهور<select name="targetType"><option value="all">جميع الطلاب</option><option value="user">طلاب محددون</option></select></label><label class="wide" id="recipients-field">الطلاب المحددون<input class="admin-recipient-search" id="recipient-search" type="search" placeholder="ابحث بالاسم أو البريد"><span class="admin-recipient-list" id="recipient-list"></span><small class="muted">يمكنك تحديد أكثر من حساب في نفس المرة.</small></label><label data-mission-only>طريقة التحقق<select name="verificationType"><option value="system">يرصدها النظام</option><option value="admin">تعتمدها الإدارة</option></select></label><label data-mission-only>العدد المطلوب<input name="requiredCount" type="number" min="1" value="1"></label><label>تاريخ البداية<input name="startDate" type="date"></label><label>تاريخ النهاية<input name="endDate" type="date"></label><label>حالة النشر<select name="publishStatus"><option value="draft">مسودة</option><option value="published">منشورة</option><option value="disabled">معطلة</option><option value="archived">مؤرشفة</option></select></label><label class="wide">الشروط أو الملاحظات<textarea name="terms"></textarea></label></div><p class="admin-status"></p><div class="admin-form-actions"><button class="btn primary" type="submit">حفظ ونشر حسب الحالة</button><button class="btn outline" type="button" data-close>إلغاء</button></div></form></section><div id="items-view"></div></div>`;

const view=document.querySelector('#items-view'),editor=document.querySelector('#item-editor'),form=document.querySelector('#item-form'),status=form.querySelector('.admin-status'),add=document.querySelector('#add-item'),recipientList=document.querySelector('#recipient-list'),recipientSearch=document.querySelector('#recipient-search'),recipientsField=document.querySelector('#recipients-field');
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const userById=id=>users.find(u=>u.uid===id)||null;
const userName=id=>{const u=userById(id);return u?.fullName||u?.username||u?.email||'طالب'};
const formatDate=x=>{const raw=x.startDate||x.createdAt;if(!raw)return'—';const d=raw?.toDate?.()||(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(raw))?new Date(`${raw}T12:00:00`):new Date(raw));return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium'}).format(d)};
const selectedUserIds=()=>[...recipientSelection];

function fillUsers(){
  const wanted=recipientSelection;
  const q=(recipientSearch.value||'').trim().toLowerCase();
  const rows=users.filter(u=>!q||`${u.fullName||''} ${u.username||''} ${u.email||''}`.toLowerCase().includes(q));
  recipientList.innerHTML=rows.length?rows.map(u=>`<label class="admin-recipient-option"><input type="checkbox" value="${esc(u.uid)}" ${wanted.has(u.uid)?'checked':''}><span><b>${esc(u.fullName||u.username||'طالب')}</b><small style="display:block">${esc(u.email||u.username||'')}</small></span></label>`).join(''):'<span class="muted">لا توجد نتائج.</span>';
  recipientList.querySelectorAll('input[type="checkbox"]').forEach(box=>box.addEventListener('change',()=>{box.checked?recipientSelection.add(box.value):recipientSelection.delete(box.value)}));
}

function renderMissionTable(){
  view.innerHTML=`<div class="desktop-table-wrap"><table class="live-admin-table"><thead><tr><th>العنوان</th><th>الجمهور</th><th>XP</th><th>التحقق</th><th>الحالة</th><th>المدة</th><th>إجراء</th></tr></thead><tbody>${items.length?items.map(x=>`<tr><td data-label="العنوان"><b>${esc(x.title)}</b><br><small>${esc(x.description||'')}</small></td><td data-label="الجمهور">${x.targetType==='all'?'الجميع':esc(userName(x.targetUserId))}</td><td data-label="XP">${Number(x.xp||0)}</td><td data-label="التحقق">${x.verificationType==='system'?'النظام':'الإدارة'}</td><td data-label="الحالة"><span class="admin-pill">${esc(x.publishStatus)}</span></td><td data-label="المدة">${esc(x.startDate||'—')} — ${esc(x.endDate||'—')}</td><td data-label="إجراء"><button class="admin-action" data-edit="${esc(x.id)}">تعديل</button> <button class="admin-action reward-danger" data-delete="${esc(x.id)}">حذف</button></td></tr>`).join(''):'<tr><td colspan="7">لا توجد مهمات بعد.</td></tr>'}</tbody></table></div>`;
  wireRows();
}

function rewardRow(x,isGlobal){
  const u=isGlobal?null:userById(x.targetUserId);
  const xp=isGlobal?'':`<span>XP الحالي: ${Number(u?.xp||0).toLocaleString('ar')}</span>`;
  return `<article class="reward-row"><div class="reward-row-main">${isGlobal?'<b>جميع الطلاب</b>':`<b>${esc(userName(x.targetUserId))}</b>`}<span>المكافأة: ${esc(x.title)}</span>${xp}<small>${esc(formatDate(x))}</small></div><div class="reward-row-actions"><button class="admin-action" data-edit="${esc(x.id)}">تعديل</button><button class="admin-action reward-danger" data-delete="${esc(x.id)}">حذف</button></div></article>`;
}

function renderRewards(){
  const global=items.filter(x=>x.targetType==='all'),individual=items.filter(x=>x.targetType!=='all');
  view.innerHTML=`<section class="reward-section"><div class="reward-section-head"><h3>مكافآت للجميع</h3><span class="admin-pill">${global.length.toLocaleString('ar')}</span></div><div class="reward-list">${global.length?global.map(x=>rewardRow(x,true)).join(''):'<div class="reward-empty">لا توجد مكافآت عامة.</div>'}</div></section><section class="reward-section"><div class="reward-section-head"><h3>مكافآت الأفراد</h3><span class="admin-pill">${individual.length.toLocaleString('ar')}</span></div><div class="reward-list">${individual.length?individual.map(x=>rewardRow(x,false)).join(''):'<div class="reward-empty">لا توجد مكافآت فردية.</div>'}</div></section>`;
  wireRows();
}

function render(){mode==='rewards'?renderRewards():renderMissionTable()}
function wireRows(){
  view.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>open(items.find(x=>x.id===b.dataset.edit))));
  view.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>removeItem(items.find(x=>x.id===b.dataset.delete))));
}
function updateRecipientVisibility(){const show=form.targetType.value==='user';recipientsField.hidden=!show;recipientSearch.disabled=!show;recipientList.querySelectorAll('input').forEach(x=>x.disabled=!show)}
function open(item={}){
  form.reset();form.xp.value=0;form.requiredCount.value=1;form.id.value=item.id||'';
  for(const [k,v] of Object.entries(item)){if(form.elements[k]&&k!=='targetUserId')form.elements[k].value=v??''}
  recipientSearch.value='';recipientSelection=new Set(item.targetUserId?[item.targetUserId]:[]);fillUsers();updateRecipientVisibility();
  editor.hidden=false;document.querySelector('#editor-title').textContent=item.id?'تعديل العنصر':`إضافة ${mode==='missions'?'مهمة':'مكافأة'}`;
  document.querySelectorAll('[data-mission-only]').forEach(x=>x.hidden=mode!=='missions');
  editor.scrollIntoView({behavior:'smooth',block:'start'});
}
async function clearAnnouncement(item){if(!item?.id)return;await deleteDoc(doc(db,'announcements',`${mode}-${item.id}`)).catch(()=>{})}
async function clearPersonalNotifications(item){
  if(!item?.targetUserId||!item?.id)return;
  try{const snap=await getDocs(query(collection(db,'users',item.targetUserId,'notifications'),where('referenceId','==',item.id)));await Promise.all(snap.docs.map(d=>deleteDoc(d.ref)))}catch(e){console.warn('[Shadrat] notification cleanup',e)}
}
async function syncBroadcast(item){
  await clearAnnouncement(item);
  if(item.publishStatus!=='published'||item.targetType!=='all')return;
  await setDoc(doc(db,'announcements',`${mode}-${item.id}`),{title:mode==='missions'?'مهمة جديدة لجميع الطلاب':'مكافأة جديدة لجميع الطلاب',body:`${item.title}${mode==='missions'&&item.xp?` — ${item.xp} XP`:''}`,publishStatus:'published',source:mode,referenceId:item.id,createdAt:item.createdAt||serverTimestamp(),updatedAt:serverTimestamp(),sourceTargetType:'all'});
}
async function notifyPersonal(item){
  if(item.publishStatus!=='published'||item.targetType!=='user'||!item.targetUserId)return;
  await setDoc(doc(db,'users',item.targetUserId,'notifications',`${mode}-${item.id}`),{title:mode==='missions'?'مهمة جديدة':'مكافأة جديدة',body:`${item.title}${mode==='missions'&&item.xp?` — ${item.xp} XP`:''}`,type:mode==='missions'?'mission':'reward',referenceId:item.id,read:false,createdAt:serverTimestamp()},{merge:true});
}
async function removeItem(item){
  if(!item||!confirm(`حذف ${mode==='missions'?'المهمة':'المكافأة'} «${item.title}»؟`))return;
  try{await Promise.all([clearAnnouncement(item),clearPersonalNotifications(item)]);await deleteDoc(doc(db,mode,item.id));await load()}catch(e){console.error(e);alert('تعذر الحذف. تحقق من صلاحيات الحساب.')}
}
async function cleanupStaleBroadcasts(){await Promise.all(items.filter(x=>x.targetType!=='all'||x.publishStatus!=='published').map(clearAnnouncement))}
async function load(){
  const [uSnap,iSnap]=await Promise.all([getDocs(collection(db,'users')),getDocs(collection(db,mode))]);
  users=uSnap.docs.map(d=>({uid:d.id,...d.data()})).sort((a,b)=>String(a.fullName||a.email||'').localeCompare(String(b.fullName||b.email||''),'ar'));
  items=iSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  fillUsers();await cleanupStaleBroadcasts();render();
}

document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',async()=>{document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));mode=b.dataset.mode;add.textContent=mode==='missions'?'إضافة مهمة':'إضافة مكافأة';editor.hidden=true;await load()}));
add.addEventListener('click',()=>open());form.querySelector('[data-close]').addEventListener('click',()=>editor.hidden=true);form.targetType.addEventListener('change',updateRecipientVisibility);
recipientSearch.addEventListener('input',fillUsers);

form.addEventListener('submit',async e=>{
  e.preventDefault();
  const recipients=form.targetType.value==='user'?selectedUserIds():[];
  if(form.targetType.value==='user'&&!recipients.length){status.textContent='اختر طالبًا واحدًا على الأقل.';return}
  status.textContent='جارٍ الحفظ…';
  const existing=items.find(x=>x.id===form.id.value)||null;
  const base={title:form.title.value.trim(),description:form.description.value.trim(),xp:mode==='missions'?Number(form.xp.value||0):0,targetType:form.targetType.value,verificationType:form.verificationType.value,requiredCount:Number(form.requiredCount.value||1),startDate:form.startDate.value||null,endDate:form.endDate.value||null,publishStatus:form.publishStatus.value,terms:form.terms.value.trim(),updatedAt:serverTimestamp(),updatedBy:auth.currentUser.uid};
  try{
    if(base.targetType==='all'){
      const id=existing?.id||crypto.randomUUID(),isNew=!existing;
      if(existing?.targetUserId)await clearPersonalNotifications(existing);
      const data={...base,targetUserId:null};if(isNew)data.createdAt=serverTimestamp();
      await setDoc(doc(db,mode,id),data,{merge:true});await syncBroadcast({id,...data,createdAt:existing?.createdAt});
    }else{
      const batchId=existing?.batchId||crypto.randomUUID();
      if(existing?.targetType==='all')await clearAnnouncement(existing);
      if(existing?.targetUserId&&!recipients.includes(existing.targetUserId))await clearPersonalNotifications(existing);
      const orderedRecipients=existing?.targetUserId&&recipients.includes(existing.targetUserId)?[existing.targetUserId,...recipients.filter(id=>id!==existing.targetUserId)]:recipients;
      for(let i=0;i<orderedRecipients.length;i++){
        const targetUserId=orderedRecipients[i],reuseExisting=!!existing&&i===0,id=reuseExisting?existing.id:crypto.randomUUID(),isNew=!reuseExisting;
        const data={...base,targetType:'user',targetUserId,batchId};if(isNew)data.createdAt=serverTimestamp();
        await setDoc(doc(db,mode,id),data,{merge:true});await clearAnnouncement({id});
        const recipientChanged=!existing||existing.targetUserId!==targetUserId||existing.publishStatus!=='published';
        if(isNew||recipientChanged)await notifyPersonal({id,...data});
      }
    }
    status.textContent='تم الحفظ. الجوائز العامة والفردية أصبحت منفصلة ويمكن حذف أي واحدة مباشرة.';
    await load();setTimeout(()=>editor.hidden=true,650);
  }catch(err){console.error(err);status.textContent='تعذر الحفظ. تحقق من صلاحية المالك.'}
});

onAuthStateChanged(auth,user=>{if(user)load().catch(e=>{console.error(e);view.innerHTML='<div class="reward-empty">تعذر تحميل البيانات.</div>'})});
