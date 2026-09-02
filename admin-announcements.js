import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{collection,deleteDoc,doc,getDocs,getFirestore,orderBy,query,serverTimestamp,setDoc,Timestamp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{firebaseConfig}from'./firebase-config.js';

const app=getApps().length?getApp():initializeApp(firebaseConfig),db=getFirestore(app),main=document.querySelector('.admin-main');
let items=[];
main.innerHTML=`<div class="admin-title"><div><span class="eyebrow">الإشعارات</span><h1>التنبيهات والإعلانات</h1><p class="muted">حدد وقت البداية والنهاية، وسيظهر التنبيه ويختفي تلقائيًا حسب الوقت المحدد.</p></div></div>
<div class="admin-live-note"><b>الجدولة:</b> الوقت يُحفظ كلحظة فعلية حسب توقيت جهاز الإدارة. بعد وقت النهاية لا يظهر التنبيه للطلاب.</div>
<div class="admin-workspace"><section class="admin-form-panel"><form id="announcement-form">
<input type="hidden" name="id">
<div class="admin-form-grid">
<label>العنوان<input name="title" required minlength="3" maxlength="160"></label>
<label>الحالة<select name="publishStatus"><option value="published">منشور / مجدول</option><option value="draft">مسودة</option><option value="disabled">مخفي</option><option value="archived">مؤرشف</option></select></label>
<label>بداية الظهور<input name="startAt" type="datetime-local" required></label>
<label>نهاية الظهور<input name="endAt" type="datetime-local" required></label>
<label class="wide">نص الإعلان<textarea name="body" required minlength="3" maxlength="2000"></textarea></label>
</div>
<p class="admin-status"></p>
<div class="admin-form-actions"><button class="btn primary">حفظ الإعلان</button><button class="btn outline" type="button" id="announcement-new">إعلان جديد</button></div>
</form></section>
<div class="desktop-table-wrap"><table class="live-admin-table"><thead><tr><th>العنوان</th><th>الحالة الفعلية</th><th>البداية</th><th>النهاية</th><th>إجراء</th></tr></thead><tbody id="ann-body"></tbody></table></div></div>`;

const form=document.querySelector('#announcement-form'),body=document.querySelector('#ann-body'),status=form.querySelector('.admin-status');
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
function toMillis(value){
  if(!value)return null;
  if(typeof value?.toMillis==='function')return value.toMillis();
  if(typeof value?.seconds==='number')return value.seconds*1000;
  if(value instanceof Date)return value.getTime();
  if(typeof value==='number')return value;
  if(typeof value==='string'){
    const normalized=/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T00:00:00':value;
    const t=new Date(normalized).getTime();return Number.isNaN(t)?null:t;
  }
  return null;
}
function scheduleMillis(item,kind){
  const keys=kind==='start'?['startAt','startDateTime','startsAt','startDate','publishFrom']:['endAt','endDateTime','endsAt','endDate','publishUntil'];
  for(const key of keys){const ms=toMillis(item?.[key]);if(ms!==null)return ms}
  return null;
}
function inputValue(value){
  const ms=toMillis(value);if(ms===null)return '';
  const d=new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmt(ms){return ms===null?'—':new Date(ms).toLocaleString('ar-SA-u-ca-gregory',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
function effectiveState(item){
  if(item.publishStatus!=='published')return item.publishStatus==='draft'?'مسودة':item.publishStatus==='disabled'?'مخفي':'مؤرشف';
  const now=Date.now(),start=scheduleMillis(item,'start'),end=scheduleMillis(item,'end');
  if(start!==null&&now<start)return 'مجدول';
  if(end!==null&&now>=end)return 'منتهي';
  return 'نشط الآن';
}
function defaults(){
  const now=new Date(),end=new Date(now.getTime()+24*60*60*1000);
  form.startAt.value=inputValue(now);
  form.endAt.value=inputValue(end);
}
function reset(){form.reset();form.id.value='';status.textContent='';defaults()}
function openItem(item){
  form.id.value=item.id;form.title.value=item.title||'';form.body.value=item.body||'';form.publishStatus.value=item.publishStatus||'draft';
  const start=scheduleMillis(item,'start'),end=scheduleMillis(item,'end');
  form.startAt.value=start===null?inputValue(item.createdAt||new Date()):inputValue(start);
  form.endAt.value=end===null?inputValue(new Date((start||Date.now())+24*60*60*1000)):inputValue(end);
  status.textContent='تعدل إعلانًا موجودًا الآن.';form.scrollIntoView({behavior:'smooth',block:'start'});
}
function render(){
  body.innerHTML=items.length?items.map(x=>{
    const start=scheduleMillis(x,'start'),end=scheduleMillis(x,'end'),state=effectiveState(x);
    return `<tr><td data-label="العنوان"><b>${esc(x.title)}</b><small style="display:block">${esc((x.body||'').slice(0,90))}</small></td><td data-label="الحالة"><span class="admin-pill">${esc(state)}</span></td><td data-label="البداية">${fmt(start)}</td><td data-label="النهاية">${fmt(end)}</td><td data-label="إجراء"><div class="admin-row-actions"><button class="admin-action" data-edit="${x.id}">تعديل</button><button class="admin-action danger" data-delete="${x.id}">حذف</button></div></td></tr>`;
  }).join(''):'<tr><td colspan="5">لا توجد إعلانات.</td></tr>';
  body.querySelectorAll('[data-edit]').forEach(btn=>btn.onclick=()=>openItem(items.find(x=>x.id===btn.dataset.edit)));
  body.querySelectorAll('[data-delete]').forEach(btn=>btn.onclick=()=>removeItem(btn.dataset.delete));
}
async function removeItem(id){
  const item=items.find(x=>x.id===id);if(!item||!confirm(`حذف الإعلان: ${item.title||'بدون عنوان'}؟`))return;
  status.textContent='جارٍ الحذف…';
  try{await deleteDoc(doc(db,'announcements',id));if(form.id.value===id)reset();status.textContent='تم حذف الإعلان.';await load()}
  catch(err){console.error(err);status.textContent='تعذر الحذف. تحقق من صلاحيات المدير.'}
}
async function load(){const snapshot=await getDocs(query(collection(db,'announcements'),orderBy('createdAt','desc')));items=snapshot.docs.map(d=>({id:d.id,...d.data()}));render()}
form.onsubmit=async e=>{
  e.preventDefault();status.textContent='جارٍ الحفظ…';
  const startMs=new Date(form.startAt.value).getTime(),endMs=new Date(form.endAt.value).getTime();
  if(Number.isNaN(startMs)||Number.isNaN(endMs)){status.textContent='حدد وقت بداية ونهاية صحيح.';return}
  if(endMs<=startMs){status.textContent='وقت النهاية يجب أن يكون بعد وقت البداية.';return}
  const id=form.id.value||crypto.randomUUID();
  const payload={title:form.title.value.trim(),body:form.body.value.trim(),publishStatus:form.publishStatus.value,startAt:Timestamp.fromMillis(startMs),endAt:Timestamp.fromMillis(endMs),updatedAt:serverTimestamp()};
  if(!form.id.value)payload.createdAt=serverTimestamp();
  try{
    await setDoc(doc(db,'announcements',id),payload,{merge:true});
    status.textContent=form.publishStatus.value==='published'?(Date.now()<startMs?'تم الحفظ. سيظهر التنبيه تلقائيًا في وقت البداية.':'تم الحفظ. التنبيه نشط ضمن الفترة المحددة.'):'تم حفظ الإعلان.';
    await load();reset();
  }catch(err){console.error(err);status.textContent='تعذر الحفظ. تحقق من صلاحيات المدير.'}
};
document.querySelector('#announcement-new').onclick=reset;
defaults();
setInterval(render,30000);
load().catch(err=>{console.error(err);body.innerHTML='<tr><td colspan="5">تعذر تحميل الإعلانات.</td></tr>'});
