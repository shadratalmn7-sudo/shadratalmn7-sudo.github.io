import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{getAuth}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import{doc,getDoc,getFirestore,serverTimestamp,writeBatch}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{firebaseConfig}from'./firebase-config.js';
const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),clean=v=>String(v||'').trim().toLowerCase().replace(/^@/,'');
let busy=false;
async function handle(e){
 const form=e.target;
 if(!(form instanceof HTMLFormElement)||form.id!=='profile-deep-form'||form.dataset.compatReady==='1'||busy)return;
 const user=auth.currentUser;if(!user)return;
 const oldUsername=clean(form.username?.defaultValue),nextUsername=clean(form.username?.value);
 if(!nextUsername||nextUsername===oldUsername)return;
 e.preventDefault();e.stopImmediatePropagation();busy=true;
 const status=form.querySelector('#profile-deep-status'),submit=form.querySelector('[type="submit"]');
 if(submit)submit.disabled=true;if(status){status.className='profile-deep-status';status.textContent='جارٍ التحقق من اسم المستخدم…'}
 try{
  const snap=await getDoc(doc(db,'users',user.uid)),data=snap.data()||{};
  const changes={fullName:form.fullName.value.trim(),username:nextUsername,age:form.age.value?Number(form.age.value):null,nationality:form.nationality.value.trim(),currentCountry:form.currentCountry.value.trim(),city:form.city.value.trim(),contactMethod:form.contactMethod.value,contactValue:form.contactValue.value.trim(),location:[form.currentCountry.value.trim(),form.city.value.trim()].filter(Boolean).join(' / '),studyLevel:form.studyLevel.value,lastUsernameEditAt:serverTimestamp(),usernameEditCount:Number(data.usernameEditCount||0)+1,updatedAt:serverTimestamp()};
  const batch=writeBatch(db);batch.set(doc(db,'usernameReservations',nextUsername),{uid:user.uid,updatedAt:serverTimestamp()});batch.update(doc(db,'users',user.uid),changes);await batch.commit();
  if(status)status.textContent='تم التحقق من اسم المستخدم، جاري حفظ بقية التعديلات…';
 }catch(err){console.warn('[Shadrat] legacy username compatibility path skipped',err)}
 finally{
  form.dataset.compatReady='1';busy=false;if(submit)submit.disabled=false;
  setTimeout(()=>form.requestSubmit(),0);
 }
}
document.addEventListener('submit',handle,true);