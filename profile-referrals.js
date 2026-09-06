import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{doc,getDoc,getFirestore,onSnapshot,serverTimestamp,setDoc}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import{firebaseConfig}from'./firebase-config.js';

const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const ar=value=>Number(value||0).toLocaleString('ar');

function injectStyles(){
 if(document.querySelector('#referral-card-style'))return;
 const style=document.createElement('style');
 style.id='referral-card-style';
 style.textContent=`
.referral-card{margin-top:16px;padding:18px;border:1px solid #cfe0ff;border-radius:20px;background:linear-gradient(135deg,#f8fbff,#eef5ff);box-shadow:0 8px 24px rgba(37,99,235,.06)}
.referral-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.referral-head h2{margin:3px 0 5px;font-size:20px}.referral-head p{margin:0;color:#526b91;line-height:1.7}.referral-points{white-space:nowrap;padding:8px 11px;border-radius:999px;background:#dbeafe;color:#1748b5;font-weight:900;font-size:12px}
.referral-link-row{display:grid;grid-template-columns:1fr auto auto;gap:8px;margin-top:14px;direction:ltr}.referral-link{min-width:0;padding:11px 12px;border:1px solid #bdd2f3;border-radius:13px;background:#fff;color:#244d82;font:700 12px/1.4 Arial,sans-serif;text-overflow:ellipsis}
.referral-stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:12px}.referral-stat{padding:11px;border:1px solid #d8e5f6;border-radius:14px;background:#fff;text-align:center}.referral-stat b,.referral-stat small{display:block}.referral-stat b{font-size:18px;color:#1748b5}.referral-stat small{margin-top:3px;color:#64748b}
.referral-message{min-height:20px;margin:8px 0 0;color:#17643a;font-size:12px;font-weight:800}
@media(max-width:650px){.referral-head{flex-direction:column}.referral-link-row{grid-template-columns:1fr 1fr}.referral-link{grid-column:1/-1}.referral-stat-row{grid-template-columns:1fr}.referral-link-row .btn{width:100%}}
`;
 document.head.appendChild(style);
}

function referralUrl(uid){
 const url=new URL('register.html',location.href);
 url.search='';
 url.hash='';
 url.searchParams.set('ref',uid);
 return url.toString();
}

function mount(uid){
 injectStyles();
 const overview=document.querySelector('[data-profile-panel="overview"]');
 if(!overview||document.querySelector('#profile-referral-card'))return;
 const card=document.createElement('section');
 card.id='profile-referral-card';
 card.className='referral-card';
 const link=referralUrl(uid);
 card.innerHTML=`<div class="referral-head"><div><span class="eyebrow">ادعُ صديقًا</span><h2>رابط الإحالة الخاص بك</h2><p>أرسل الرابط لصديقك. عند إنشاء حساب جديد من خلاله تحصل أنت على <b>50 XP</b> ويحصل صديقك على <b>25 XP</b>.</p></div><span class="referral-points">مكافأة تلقائية</span></div><div class="referral-link-row"><input class="referral-link" id="referral-link" readonly aria-label="رابط الإحالة" value="${link.replace(/"/g,'&quot;')}"><button class="btn primary" id="copy-referral" type="button">نسخ الرابط</button><button class="btn outline" id="share-referral" type="button">مشاركة</button></div><div class="referral-stat-row"><div class="referral-stat"><b data-referral-count>٠</b><small>أصدقاء سجلوا برابطك</small></div><div class="referral-stat"><b data-referral-xp>٠ XP</b><small>XP من الإحالات</small></div><div class="referral-stat"><b>+٢٥ XP</b><small>هدية الصديق الجديد</small></div></div><p class="referral-message" data-referral-message role="status"></p>`;
 const actions=overview.querySelector('.dashboard-actions');
 if(actions)actions.insertAdjacentElement('afterend',card);else overview.appendChild(card);
 const input=card.querySelector('#referral-link'),message=card.querySelector('[data-referral-message]');
 const copied=()=>{message.textContent='تم نسخ رابط الإحالة.';setTimeout(()=>message.textContent='',2500)};
 card.querySelector('#copy-referral').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(link);copied()}catch{input.select();document.execCommand('copy');copied()}
 });
 card.querySelector('#share-referral').addEventListener('click',async()=>{
  const data={title:'شذرات للمنح',text:'سجّل في شذرات للمنح من رابط دعوتي واحصل على 25 XP كبداية.',url:link};
  if(navigator.share){try{await navigator.share(data)}catch{}}
  else{try{await navigator.clipboard.writeText(link);copied()}catch{input.select();document.execCommand('copy');copied()}}
 });
 onSnapshot(doc(db,'users',uid),snapshot=>{
  const count=Math.max(0,Number(snapshot.data()?.referralCount||0));
  card.querySelector('[data-referral-count]').textContent=ar(count);
  card.querySelector('[data-referral-xp]').textContent=`${ar(count*50)} XP`;
 });
}

onAuthStateChanged(auth,async user=>{
 if(!user)return;
 mount(user.uid);
 try{
  const reference=doc(db,'referralCodes',user.uid),snapshot=await getDoc(reference);
  if(!snapshot.exists())await setDoc(reference,{uid:user.uid,createdAt:serverTimestamp()});
 }catch(error){
  console.error('[Shadrat] referral code',error);
 }
});
