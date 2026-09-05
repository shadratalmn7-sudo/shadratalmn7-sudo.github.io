import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import{doc,getDoc,getFirestore}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{firebaseConfig}from'./firebase-config.js';
import{PROFILE_BADGES,PROFILE_FRAMES,PROFILE_NAME_COLORS,PROFILE_THEMES,levelFromXp}from'./level-system.js?v=2';

const OWNER_EMAIL='shadrat.almn7@gmail.com';
const AUTH_SESSION_KEY='shadrat_auth_session';
const CACHE_PREFIX='shadrat-profile-cache-v3:';
const PREF_PREFIX='shadrat-profile-v2:';
const app=getApps().length?getApp():initializeApp(firebaseConfig);
const auth=getAuth(app),db=getFirestore(app);
const tasks=new Map();

const text=(value,fallback='—')=>value===0?'0':String(value||fallback);
function sessionUid(){try{return JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY)||'null')?.uid||''}catch{return''}}
function cacheKey(uid){return`${CACHE_PREFIX}${uid}`}
function readCache(uid){try{return JSON.parse(localStorage.getItem(cacheKey(uid))||'null')}catch{return null}}
function writeCache(user,data){try{localStorage.setItem(cacheKey(user.uid),JSON.stringify({uid:user.uid,email:user.email||data.email||'',data,at:Date.now()}))}catch{}}
function rawPrefs(data){const raw=String(data?.avatarKey||'');if(!raw.startsWith(PREF_PREFIX))return{};try{return JSON.parse(raw.slice(PREF_PREFIX.length))||{}}catch{return{}}}
function unlocked(list,id,level){const item=list.find(x=>x.id===id);return!!item&&level>=item.level}

function applyAppearance(data={}){
  const level=levelFromXp(data.xp||0),prefs=rawPrefs(data);
  const cover=document.querySelector('.student-cover'),avatar=document.querySelector('[data-student-avatar]'),name=document.querySelector('[data-student-name]'),studentName=document.querySelector('.student-name');
  if(!cover||!avatar||!name)return;
  const theme=unlocked(PROFILE_THEMES,prefs.theme,level)?prefs.theme:'default';
  const frame=unlocked(PROFILE_FRAMES,prefs.frame,level)?prefs.frame:'none';
  const nameColor=unlocked(PROFILE_NAME_COLORS,prefs.nameColor,level)?prefs.nameColor:'white';
  const customColor=level>=20&&/^#[0-9a-f]{6}$/i.test(prefs.customNameColor||'')?prefs.customNameColor:'';
  const accent=level>=16&&/^#[0-9a-f]{6}$/i.test(prefs.accent||'')?prefs.accent:'#2563eb';
  const avatarData=typeof prefs.avatarDataUrl==='string'&&prefs.avatarDataUrl.startsWith('data:image/')?prefs.avatarDataUrl:'';
  cover.classList.remove('theme-sky','theme-ocean','theme-midnight','theme-premium','theme-elite');
  if(theme!=='default')cover.classList.add(`theme-${theme}`);
  cover.style.setProperty('--student-accent',accent);
  avatar.className='student-avatar'+(frame!=='none'?` frame-${frame}`:'');
  if(avatarData)avatar.innerHTML=`<img src="${avatarData}" alt="الصورة الشخصية">`;
  const color=customColor||PROFILE_NAME_COLORS.find(x=>x.id===nameColor)?.value||'#fff';
  name.style.color=color;
  studentName?.classList.toggle('name-effect',level>=13&&!!prefs.nameEffect);
  studentName?.querySelector('.student-profile-badges')?.remove();
  let ids=level>=18&&Array.isArray(prefs.showcaseBadges)&&prefs.showcaseBadges.length?prefs.showcaseBadges:[prefs.badge||'student'];
  ids=[...new Set(ids)].filter(id=>unlocked(PROFILE_BADGES,id,level)).slice(0,level>=18?3:1);
  if(studentName&&ids.length){
    const box=document.createElement('div');box.className='student-profile-badges';
    box.innerHTML=ids.map(id=>{const b=PROFILE_BADGES.find(x=>x.id===id);return b?`<span class="student-profile-badge">${b.icon} ${b.label}</span>`:''}).join('');
    studentName.appendChild(box);
  }
}

function renderDashboardTask(){
  const title=document.querySelector('#profile-next-title'),copy=document.querySelector('#profile-next-text'),button=document.querySelector('#profile-next-action');
  if(!title||!copy||!button)return;
  const task=[...tasks.values()].sort((a,b)=>(b.priority||0)-(a.priority||0))[0]||{title:'استكشف الفرص المناسبة لك',text:'ابدأ من المنح المفتوحة واحفظ ما يناسبك للرجوع إليه بسهولة.',label:'عرض المنح',href:'scholarships.html'};
  title.textContent=task.title;copy.textContent=task.text;button.textContent=task.label||'متابعة';
  button.onclick=()=>{
    if(task.href){location.href=task.href;return}
    if(task.edit){document.querySelector('[data-profile-edit]')?.click();return}
    if(task.tab)window.ShadratProfileNav?.open(task.tab,{sub:task.sub||''});
  };
}
function setTask(source,task){if(task)tasks.set(source,task);else tasks.delete(source);renderDashboardTask()}
window.ShadratProfileDashboard={setTask,openTab:id=>window.ShadratProfileNav?.open(id)};

function renderProfile(data={},email=''){
  const name=data.fullName||data.displayName||'طالب شذرات';
  const username=data.username||'student';
  const nameEl=document.querySelector('[data-student-name]'),userEl=document.querySelector('[data-student-username]'),avatar=document.querySelector('[data-student-avatar]');
  if(nameEl)nameEl.textContent=name;
  if(userEl)userEl.textContent=`@${username}`;
  if(avatar&&!String(data.avatarKey||'').includes('avatarDataUrl'))avatar.textContent=(name.trim()[0]||'ط').toUpperCase();
  const values={
    fullName:name,username:`@${username}`,email:email||data.email||'—',phone:data.phone||(data.phoneLast4?`•••• ${data.phoneLast4}`:'غير مضاف'),
    age:data.age?`${data.age} سنة`:'غير محدد',nationality:data.nationality||'غير محدد',currentCountry:data.currentCountry||data.country||'غير محدد',city:data.city||'غير محدد',studyLevel:data.studyLevel||'غير محدد',contact:[data.contactMethod,data.contactValue].filter(Boolean).join(' — ')||'غير محدد'
  };
  for(const[key,value]of Object.entries(values)){const el=document.querySelector(`[data-profile-value="${key}"]`);if(el)el.textContent=value}
  const required=[data.username,data.age,data.nationality,data.currentCountry||data.country,data.city,data.studyLevel,data.contactValue];
  const complete=Math.round(([name,email,...required].filter(Boolean).length/(required.length+2))*100);
  const bar=document.querySelector('#profile-progress-bar'),label=document.querySelector('#profile-progress-value');if(bar)bar.style.width=`${complete}%`;if(label)label.textContent=`${complete}%`;
  applyAppearance(data);
  const labels=[['اسم المستخدم',data.username],['العمر',data.age],['الجنسية',data.nationality],['الدولة الحالية',data.currentCountry||data.country],['المدينة',data.city],['المرحلة الدراسية',data.studyLevel],['وسيلة التواصل',data.contactValue]];
  const missing=labels.find(x=>!x[1]);
  if(missing)setTask('profile',{priority:20,title:`أكمل ${missing[0]}`,text:`ملفك مكتمل بنسبة ${complete}٪. أكمل بياناتك من زر القلم.`,label:'تعديل حسابي',edit:true});else setTask('profile',null);
}

function ownerMode(user,data){
  document.body.dataset.profileMode='owner';
  document.querySelector('[data-profile-edit]')?.remove();
  const tabs=document.querySelector('.profile-tabs');
  if(tabs)tabs.innerHTML='<a class="owner-profile-link is-active" href="profile.html">ملف المالك</a><a class="owner-profile-link" href="admin-analytics.html">لوحة الإدارة</a><a class="owner-profile-link" href="admin-users.html">إدارة الطلاب</a><a class="owner-profile-link" href="admin-homepage.html">إدارة المحتوى</a>';
  document.querySelectorAll('[data-profile-panel="overview"],[data-profile-panel="level"],[data-profile-panel="rewards"],[data-profile-panel="orders"],[data-profile-panel="support"],#missions,#level,#rewards,#orders').forEach(el=>el.remove());
  const info=document.querySelector('[data-profile-panel="student-info"]');if(info)info.classList.add('is-active');
  renderProfile({...data,fullName:'OWNER | المالك',username:'OWNER'},user.email||data.email||'');
}

const cachedUid=sessionUid();
if(cachedUid){const cached=readCache(cachedUid);if(cached?.data)renderProfile(cached.data,cached.email||'')}
renderDashboardTask();

onAuthStateChanged(auth,async user=>{
  if(!user){location.replace('login.html?next=profile.html');return}
  try{
    const snap=await getDoc(doc(db,'users',user.uid)),data=snap.data()||{};
    writeCache(user,data);
    if((user.email||'').toLowerCase()===OWNER_EMAIL){ownerMode(user,data);return}
    renderProfile(data,user.email||data.email||'');
  }catch(error){
    console.error('[Shadrat] profile load',error);
    const cached=readCache(user.uid);if(cached?.data)renderProfile(cached.data,cached.email||user.email||'');
  }
});