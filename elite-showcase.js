import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import{collection,doc,getDoc,getDocs,getFirestore,query,serverTimestamp,setDoc,where}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{firebaseConfig}from'./firebase-config.js';
import{levelFromXp}from'./level-system.js?v=5';

const PREF_PREFIX='shadrat-profile-v2:';
const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const root=document.querySelector('[data-elite-showcase]'),track=root?.querySelector('[data-elite-track]');
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function prefsOf(profile={}){
  const raw=String(profile.avatarKey||'');
  if(!raw.startsWith(PREF_PREFIX))return{};
  try{return JSON.parse(raw.slice(PREF_PREFIX.length))||{}}catch{return{}}
}
function visibleLevel(profile={}){
  const xp=Math.max(0,Number(profile.xp)||0),stored=Math.max(1,Number(profile.level)||1);
  return Math.max(stored,levelFromXp(xp));
}
function eligible(profile={}){return profile.visible===true&&visibleLevel(profile)>=20}
function card(profile,duplicate=false){
  const p=prefsOf(profile),username=String(profile.username||'student').replace(/^@/,'').trim()||'student',initial=(username[0]||'ط').toUpperCase(),avatar=typeof p.avatarDataUrl==='string'&&p.avatarDataUrl.startsWith('data:image/')?p.avatarDataUrl:'',frame=/^(blue|glow|silver|gold|diamond|elite)$/.test(String(p.frame||''))?p.frame:'none',href=`student-profile.html?uid=${encodeURIComponent(profile.uid||'')}`;
  return `<a class="elite-showcase-card" data-frame="${frame}" href="${href}" ${duplicate?'aria-hidden="true" tabindex="-1"':''}><span class="elite-showcase-avatar">${avatar?`<img src="${esc(avatar)}" alt="">`:esc(initial)}</span><span class="elite-showcase-info"><b class="elite-showcase-name">@${esc(username)}</b><span class="elite-showcase-level">Level 20</span></span></a>`;
}
function empty(message='أول طالب يصل إلى Level 20 سيظهر هنا تلقائيًا.'){
  if(!root||!track)return;
  root.classList.remove('is-ready');root.classList.add('is-empty');
  track.innerHTML=`<div class="elite-showcase-empty">${esc(message)}</div>`;
}
function render(rows){
  if(!root||!track)return;
  const students=rows.filter(eligible).sort((a,b)=>String(a.username||'').localeCompare(String(b.username||''),'ar'));
  if(!students.length){empty();return}
  const one=students.map(x=>card(x,false)).join(''),dup=students.map(x=>card(x,true)).join('');
  track.innerHTML=one+dup+dup+dup;
  root.style.setProperty('--elite-duration',`${Math.max(28,Math.round(students.length*4.5))}s`);
  root.classList.remove('is-empty');root.classList.add('is-ready');
}
function firstAuthState(){return new Promise(resolve=>{const stop=onAuthStateChanged(auth,user=>{stop();resolve(user||null)})})}
async function syncCurrentLevel20(){
  const user=await firstAuthState();if(!user)return;
  try{
    const snap=await getDoc(doc(db,'users',user.uid));if(!snap.exists())return;
    const data=snap.data()||{};if(visibleLevel(data)<20)return;
    const payload={uid:user.uid,username:data.username||`student_${user.uid.slice(0,6)}`,avatarKey:data.avatarKey||null,level:Number(data.level)||1,xp:Math.max(0,Number(data.xp)||0),badges:Array.isArray(data.badges)?data.badges:[],visible:true,updatedAt:serverTimestamp()};
    await setDoc(doc(db,'publicProfiles',user.uid),payload,{merge:true});
  }catch(error){console.warn('[Shadrat] elite profile sync skipped',error)}
}
async function load(){
  if(!root||!track)return;
  empty('جاري تحميل نخبة شذرات…');
  await syncCurrentLevel20();
  try{
    const snap=await getDocs(query(collection(db,'publicProfiles'),where('visible','==',true)));
    render(snap.docs.map(d=>({uid:d.id,...d.data()})));
  }catch(error){console.warn('[Shadrat] elite showcase unavailable',error);empty('تعذر تحميل نخبة شذرات الآن. أعد فتح الصفحة بعد قليل.')}
}

load();
