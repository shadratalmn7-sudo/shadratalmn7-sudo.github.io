import { getApp,getApps,initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { addDoc,collection,doc,getDoc,getFirestore,serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';
const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const form=document.querySelector('form[data-demo-form]');
if(!form) throw new Error('contact form not found');
const params=new URLSearchParams(location.search),type=params.get('type')||'',service=params.get('service')||'',serviceId=params.get('serviceId')||'';
if(type&&form.querySelector('#type')) form.querySelector('#type').value=type;
if(service&&form.querySelector('#service-name')){form.querySelector('#service-name').value=service;form.querySelector('[data-service-field]')?.removeAttribute('hidden')}
function syncFields(){
  const selected=form.querySelector('#type')?.value;
  const serviceField=form.querySelector('[data-service-field]');
  const achievementFields=[...form.querySelectorAll('[data-achievement-field]')];
  if(serviceField) serviceField.hidden=selected!=='service';
  achievementFields.forEach(field=>{field.hidden=selected!=='achievement'});
}
form.querySelector('#type')?.addEventListener('change',syncFields);
syncFields();
const result=form.querySelector('.success'),button=form.querySelector('[type="submit"]');
if(result){result.textContent='';result.classList.remove('show')}
function show(text,ok=true){if(!result)return;result.textContent=text;result.classList.add('show');result.style.color=ok?'':'#b42318'}
onAuthStateChanged(auth,async user=>{if(!user)return;const email=form.querySelector('#email');if(email&&!email.value)email.value=user.email||'';try{const profile=await getDoc(doc(db,'users',user.uid));const name=form.querySelector('#name');if(name&&!name.value)name.value=profile.data()?.fullName||user.displayName||''}catch{}});
form.addEventListener('submit',async event=>{
  event.preventDefault();event.stopImmediatePropagation();
  if(!form.reportValidity())return;
  const user=auth.currentUser;if(!user){show('يلزم تسجيل الدخول حتى تصل رسالتك أو طلبك إلى الإدارة.',false);setTimeout(()=>location.href=`login.html?next=${encodeURIComponent(location.href)}`,1200);return}
  button.disabled=true;show('جارٍ الإرسال…');
  try{
    const payload={userId:user.uid,name:form.querySelector('#name').value.trim(),email:form.querySelector('#email').value.trim(),type:form.querySelector('#type').value,message:form.querySelector('#message').value.trim(),serviceTitle:form.querySelector('#service-name')?.value.trim()||null,contactMethod:form.querySelector('#contact-method')?.value.trim()||null,proofLink:form.querySelector('#proof-link')?.value.trim()||null,status:'new',priority:'normal',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
    const msgRef=await addDoc(collection(db,'messages'),payload);
    if(payload.type==='service'&&payload.serviceTitle){
      let price=0,serviceData=null;
      if(serviceId){const s=await getDoc(doc(db,'services',serviceId));if(s.exists())serviceData=s.data()}
      price=Number(serviceData?.price||0);
      await addDoc(collection(db,'orders'),{userId:user.uid,userEmail:user.email||payload.email,userName:payload.name,serviceId:serviceId||null,serviceTitle:payload.serviceTitle,amount:price,currency:'USD',paymentStatus:'disabled',status:'created',messageId:msgRef.id,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
      show('تم تسجيل طلبك بنجاح وسيظهر في حسابك ولوحة الإدارة.');
    } else show('تم إرسال رسالتك بنجاح ووصلت إلى صندوق الإدارة.');
    form.querySelector('#message').value='';
  }catch(err){console.error(err);show(err?.code==='permission-denied'?'تعذر الإرسال بسبب صلاحيات قاعدة البيانات. تأكد من تسجيل الدخول ثم حاول مرة أخرى.':'تعذر الإرسال الآن. حاول مرة أخرى.',false)}finally{button.disabled=false}
},{capture:true});
