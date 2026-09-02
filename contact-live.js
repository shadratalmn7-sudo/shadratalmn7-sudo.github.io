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

let accountProfile=null;
onAuthStateChanged(auth,async user=>{
  accountProfile=null;
  if(!user)return;
  const email=form.querySelector('#email');
  if(email&&!email.value)email.value=user.email||'';
  try{
    const snap=await getDoc(doc(db,'users',user.uid));
    accountProfile=snap.data()||{};
    const name=form.querySelector('#name');
    if(name&&!name.value)name.value=accountProfile.fullName||user.displayName||'';
  }catch{
    accountProfile={};
    const name=form.querySelector('#name');
    if(name&&!name.value)name.value=user.displayName||'';
  }
});

function profileSnapshot(user,profile){
  if(!user)return null;
  return {
    fullName:String(profile?.fullName||user.displayName||''),
    username:String(profile?.username||''),
    email:String(user.email||profile?.email||''),
    phone:String(profile?.phone||''),
    phoneLast4:String(profile?.phoneLast4||''),
    age:profile?.age??null,
    nationality:String(profile?.nationality||''),
    currentCountry:String(profile?.currentCountry||profile?.country||''),
    city:String(profile?.city||''),
    location:String(profile?.location||''),
    studyLevel:String(profile?.studyLevel||''),
    contactMethod:String(profile?.contactMethod||''),
    contactValue:String(profile?.contactValue||'')
  };
}

form.addEventListener('submit',async event=>{
  event.preventDefault();event.stopImmediatePropagation();
  if(!form.reportValidity())return;

  const user=auth.currentUser;
  button.disabled=true;show('جارٍ الإرسال…');
  try{
    let profile=accountProfile;
    if(user&&!profile){
      try{const snap=await getDoc(doc(db,'users',user.uid));profile=snap.data()||{}}
      catch{profile={}}
    }
    const payload={
      userId:user?.uid||null,
      name:form.querySelector('#name').value.trim(),
      email:form.querySelector('#email').value.trim(),
      type:form.querySelector('#type').value,
      message:form.querySelector('#message').value.trim(),
      serviceTitle:form.querySelector('#service-name')?.value.trim()||null,
      contactMethod:form.querySelector('#contact-method')?.value.trim()||null,
      proofLink:form.querySelector('#proof-link')?.value.trim()||null,
      accountProfile:profileSnapshot(user,profile),
      status:'new',priority:'normal',createdAt:serverTimestamp(),updatedAt:serverTimestamp()
    };
    const msgRef=await addDoc(collection(db,'messages'),payload);

    if(user&&payload.type==='service'&&payload.serviceTitle){
      let price=0,serviceData=null;
      if(serviceId){const s=await getDoc(doc(db,'services',serviceId));if(s.exists())serviceData=s.data()}
      price=Number(serviceData?.price||0);
      await addDoc(collection(db,'orders'),{
        userId:user.uid,userEmail:payload.email,userName:payload.name,serviceId:serviceId||null,
        serviceTitle:payload.serviceTitle,amount:price,currency:'USD',paymentStatus:'disabled',
        status:'created',messageId:msgRef.id,createdAt:serverTimestamp(),updatedAt:serverTimestamp()
      });
      show('تم تسجيل طلبك ورسالتك بنجاح.');
    }else{
      show(user?'تم إرسال رسالتك بنجاح وربط بيانات حسابك بها.':'تم إرسال رسالتك بنجاح.');
    }
    form.querySelector('#message').value='';
  }catch(err){
    console.error(err);
    show(err?.code==='permission-denied'?'تعذر الإرسال بسبب صلاحيات قاعدة البيانات.':'تعذر الإرسال الآن. حاول مرة أخرى.',false);
  }finally{button.disabled=false}
},{capture:true});
