import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{getAuth}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import{firebaseConfig}from'./firebase-config.js';

const app=getApps().length?getApp():initializeApp(firebaseConfig);
const auth=getAuth(app);
const PUSH_WEBHOOK='https://hook.eu1.make.com/fy3fpwyc5xqo67r9am0tcjcjnj7zglf7';

function ensureStyle(){
  if(document.querySelector('#shz-admin-push-style'))return;
  const style=document.createElement('style');
  style.id='shz-admin-push-style';
  style.textContent=`.shz-push-admin-panel{margin:16px 0 18px;border:1px solid #cfe0ff;background:linear-gradient(135deg,#f8fbff,#eef5ff)}.shz-push-admin-head{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:12px}.shz-push-admin-head h2{margin:0;color:#173d75}.shz-push-admin-badge{padding:6px 10px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:900}.shz-push-admin-form{display:grid;gap:12px}.shz-push-admin-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.shz-push-admin-form label{display:grid;gap:6px;font-weight:800;color:#274665}.shz-push-admin-form input,.shz-push-admin-form textarea{width:100%;box-sizing:border-box;border:1px solid #cbdcf4;border-radius:12px;background:#fff;padding:11px 12px;font:inherit;color:#18324f}.shz-push-admin-form textarea{min-height:120px;resize:vertical}.shz-push-admin-wide{grid-column:1/-1}.shz-push-admin-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.shz-push-admin-send{border:0;border-radius:12px;padding:11px 16px;background:#2563eb;color:#fff;font:inherit;font-weight:900;cursor:pointer}.shz-push-admin-send:disabled{opacity:.6;cursor:wait}.shz-push-admin-status{min-height:22px;font-size:13px;font-weight:900}.shz-push-admin-status.ok{color:#15803d}.shz-push-admin-status.err{color:#b42318}@media(max-width:720px){.shz-push-admin-grid{grid-template-columns:1fr}}`;
  document.head.appendChild(style);
}

function inject(){
  const role=document.body?.dataset?.role;
  if(!['owner','admin'].includes(role))return false;
  const main=document.querySelector('.admin-main');
  if(!main||document.querySelector('#shz-push-admin-panel'))return false;
  const ready=main.querySelector('#announcement-form')||main.querySelector('.admin-live-note');
  if(!ready)return false;
  ensureStyle();
  const panel=document.createElement('section');
  panel.id='shz-push-admin-panel';
  panel.className='admin-form-panel shz-push-admin-panel';
  panel.innerHTML=`<div class="shz-push-admin-head"><div><h2>🔔 إرسال Push فوري</h2><p class="muted">أرسل إشعارًا مباشرًا لكل الأجهزة التي فعّلت تنبيهات شذرات. لا تحتاج إلى فتح OneSignal أو Make.</p></div><span class="shz-push-admin-badge">Active Subscriptions</span></div><form id="shz-push-admin-form" class="shz-push-admin-form"><div class="shz-push-admin-grid"><label>عنوان الإشعار<input name="title" required minlength="2" maxlength="120" placeholder="مثال: منحة جديدة متاحة الآن"></label><label>الرابط عند الضغط<input name="url" type="url" value="https://shadratalmn7-sudo.github.io/index.html" required></label><label class="shz-push-admin-wide">نص الإشعار<textarea name="body" required minlength="3" maxlength="700" placeholder="اكتب الرسالة التي ستصل للطلاب"></textarea></label></div><div class="shz-push-admin-actions"><button class="shz-push-admin-send" type="submit">🔔 إرسال Push للجميع الآن</button><span class="shz-push-admin-status" aria-live="polite"></span></div></form>`;
  const anchor=main.querySelector('.admin-live-note')||main.querySelector('.admin-workspace')||main.firstElementChild?.nextElementSibling;
  if(anchor)anchor.insertAdjacentElement('beforebegin',panel);else main.appendChild(panel);
  const form=panel.querySelector('#shz-push-admin-form');
  const button=panel.querySelector('.shz-push-admin-send');
  const status=panel.querySelector('.shz-push-admin-status');
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    status.textContent='جارٍ التحقق من صلاحية الإدارة والإرسال…';status.className='shz-push-admin-status';button.disabled=true;
    try{
      const user=auth.currentUser;
      if(!user)throw new Error('AUTH_REQUIRED');
      const firebaseIdToken=await user.getIdToken(true);
      const payload=new URLSearchParams({
        eventId:`admin-${Date.now()}`,
        eventType:'admin_broadcast',
        title:form.title.value.trim(),
        message:form.body.value.trim(),
        url:form.url.value.trim()||'https://shadratalmn7-sudo.github.io/index.html',
        audience:'all',
        firebaseIdToken,
        publishedAt:new Date().toISOString()
      });
      const response=await fetch(PUSH_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:payload});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data.ok!==true)throw new Error(data?.message||`HTTP_${response.status}`);
      status.textContent='تم إرسال إشعار Push للجميع بنجاح ✓';status.className='shz-push-admin-status ok';
      form.title.value='';form.body.value='';
    }catch(error){
      console.error('[Shadrat] admin push',error);
      status.textContent='تعذر إرسال Push. لم يتم اعتبار الإرسال ناجحًا.';status.className='shz-push-admin-status err';
    }finally{button.disabled=false}
  });
  return true;
}

if(!inject()){
  const observer=new MutationObserver(()=>{if(inject())observer.disconnect()});
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-role']});
  setTimeout(()=>observer.disconnect(),20000);
}
