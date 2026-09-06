import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import{collection,doc,getDoc,getDocs,getFirestore,limit,query,serverTimestamp,setDoc,where}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{firebaseConfig}from'./firebase-config.js';
import{levelFromXp}from'./level-system.js?v=5';

const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const clean=v=>String(v??'').trim();
const cleanUsername=v=>clean(v).toLowerCase().replace(/^@/,'').replace(/[^a-z0-9_]/g,'').slice(0,24);
function listFrom(data,keys,max=12){
  for(const key of keys){
    const raw=data?.[key];
    if(!Array.isArray(raw))continue;
    const values=raw.map(item=>{
      if(typeof item==='string')return clean(item);
      if(item&&typeof item==='object')return clean(item.title||item.name||item.label||item.text||item.missionTitle||item.achievementTitle);
      return'';
    }).filter(Boolean).slice(0,max);
    if(values.length)return[...new Set(values)];
  }
  return[];
}
function publicBadges(data){
  const raw=String(data?.avatarKey||''),prefix='shadrat-profile-v2:';let prefs={};
  if(raw.startsWith(prefix)){try{prefs=JSON.parse(raw.slice(prefix.length))||{}}catch{}}
  const ids=Array.isArray(prefs.showcaseBadges)&&prefs.showcaseBadges.length?prefs.showcaseBadges:[prefs.badge||'student'];
  const labels={student:'طالب شذرات',active:'طالب نشيط',bronze:'المستوى البرونزي',silver:'نخبة Level 20'};
  return[...new Set(ids.map(id=>labels[id]).filter(Boolean))].slice(0,3);
}
function cleanTelegram(v){return clean(v).replace(/^https?:\/\/(t\.me|telegram\.me)\//i,'').replace(/^@/,'').replace(/[^a-zA-Z0-9_]/g,'').slice(0,32)}
function cleanWhatsApp(v){return clean(v).replace(/\D/g,'').slice(0,15)}
function cleanInterests(v){const raw=Array.isArray(v)?v:String(v||'').split(/[,،]/);return[...new Set(raw.map(clean).filter(Boolean))].slice(0,8)}
async function syncPublicProfile(user){
  const snap=await getDoc(doc(db,'users',user.uid));if(!snap.exists())return null;
  const data=snap.data()||{},xp=Math.max(0,Number(data.xp)||0),level=Math.max(1,Number(data.level)||levelFromXp(xp)),username=cleanUsername(data.username||'student');
  const safeInfo={
    fullName:clean(data.fullName||data.displayName||'طالب شذرات').slice(0,80),
    studyLevel:clean(data.studyLevel||'').slice(0,80),
    achievements:listFrom(data,['achievements','completedAchievements','achievementTitles'],16),
    completedTasks:listFrom(data,['completedTasks','completedMissions','missionsCompleted','missionHistory'],16)
  };
  const publicData={uid:user.uid,username,fullName:safeInfo.fullName,studyLevel:safeInfo.studyLevel,avatarKey:String(data.avatarKey||''),level,xp,badges:publicBadges(data),expertise:safeInfo,bio:clean(data.bio||'').slice(0,180),telegram:cleanTelegram(data.telegram),whatsapp:cleanWhatsApp(data.whatsapp),studentStatus:clean(data.studentStatus||'').slice(0,60),interests:cleanInterests(data.interests),visible:true,updatedAt:serverTimestamp()};
  await setDoc(doc(db,'publicProfiles',user.uid),publicData,{merge:true});
  return{...publicData,...safeInfo};
}
function addTools(uid,username){
  if(document.querySelector('.public-profile-tools'))return;
  const host=document.querySelector('.dashboard-actions');if(!host)return;
  const box=document.createElement('div');box.className='public-profile-tools';
  box.innerHTML=`<div class="public-profile-tools-head"><div><b>مجتمع الطلاب</b><small>كل الطلاب يظهرون في قائمة الطلاب، ويمكن فتح الملف العام أو البحث باسم المستخدم.</small></div><div style="display:flex;gap:7px;flex-wrap:wrap"><a class="btn primary" href="students.html">استكشف الطلاب</a><a class="btn outline" href="student-profile.html?uid=${encodeURIComponent(uid)}">عرض ملفي العام</a></div></div><div class="public-profile-search"><input type="text" maxlength="24" inputmode="text" autocomplete="off" placeholder="اكتب يوزر طالب مثل ahmed7" aria-label="اسم مستخدم الطالب"><button class="btn outline" type="button">فتح الملف</button></div><small class="public-profile-search-status" aria-live="polite"></small>`;
  host.insertAdjacentElement('afterend',box);
  const input=box.querySelector('input'),button=box.querySelector('button'),status=box.querySelector('.public-profile-search-status');
  const open=async()=>{
    const wanted=cleanUsername(input.value);if(!wanted){status.textContent='اكتب اسم المستخدم أولًا.';return}
    if(wanted===username){location.href=`student-profile.html?uid=${encodeURIComponent(uid)}`;return}
    button.disabled=true;status.textContent='جاري البحث…';
    try{
      const q=query(collection(db,'publicProfiles'),where('username','==',wanted),where('visible','==',true),limit(1));
      const found=await getDocs(q);if(found.empty){status.textContent='لم نجد طالبًا بهذا اليوزر.';return}
      location.href=`student-profile.html?uid=${encodeURIComponent(found.docs[0].id)}`;
    }catch(e){console.error('[Shadrat] public profile search',e);status.textContent='تعذر البحث الآن. جرّب بعد قليل.'}
    finally{button.disabled=false}
  };
  button.addEventListener('click',open);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();open()}});
}

onAuthStateChanged(auth,async user=>{
  if(!user)return;
  try{const p=await syncPublicProfile(user);if(p)addTools(user.uid,p.username)}catch(e){console.error('[Shadrat] public profile sync',e)}
});
