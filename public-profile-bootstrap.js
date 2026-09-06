import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import{doc,getDoc,getFirestore,serverTimestamp,setDoc}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{firebaseConfig}from'./firebase-config.js';

const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const clean=v=>String(v??'').trim();
const username=v=>clean(v).toLowerCase().replace(/^@/,'').replace(/[^a-z0-9_]/g,'').slice(0,24);
const list=(v,max=16)=>Array.isArray(v)?v.map(x=>typeof x==='string'?clean(x):clean(x?.title||x?.name||x?.label||x?.text)).filter(Boolean).slice(0,max):[];
const telegram=v=>clean(v).replace(/^https?:\/\/(t\.me|telegram\.me)\//i,'').replace(/^@/,'').replace(/[^a-zA-Z0-9_]/g,'').slice(0,32);
const whatsapp=v=>clean(v).replace(/\D/g,'').slice(0,15);
const interests=v=>[...new Set((Array.isArray(v)?v:String(v||'').split(/[,،]/)).map(clean).filter(Boolean))].slice(0,8);

function safePublicProfile(uid,data={}){
  const xp=Math.max(0,Number(data.xp)||0),level=Math.max(1,Number(data.level)||1);
  return{
    uid,
    fullName:clean(data.fullName||data.displayName||'طالب شذرات').slice(0,80),
    username:username(data.username||`student_${uid.slice(0,5)}`),
    avatarKey:String(data.avatarKey||''),
    level,
    xp,
    studyLevel:clean(data.studyLevel||'').slice(0,80),
    badges:list(data.badges,3),
    achievements:list(data.achievements,16),
    completedTasks:list(data.completedTasks,16),
    expertise:data.expertise&&typeof data.expertise==='object'?data.expertise:{},
    bio:clean(data.bio||'').slice(0,180),
    telegram:telegram(data.telegram),
    whatsapp:whatsapp(data.whatsapp),
    studentStatus:clean(data.studentStatus||'').slice(0,60),
    interests:interests(data.interests),
    visible:true,
    updatedAt:serverTimestamp()
  };
}

export async function syncCurrentStudent(user,{attempts=8,delay=450}={}){
  if(!user)return false;
  for(let i=0;i<attempts;i++){
    try{
      const snap=await getDoc(doc(db,'users',user.uid));
      if(snap.exists()){
        const data=snap.data()||{};
        if((data.role||'student')!=='student'||data.accountStatus==='suspended')return false;
        if(typeof data.level!=='number'||typeof data.xp!=='number'||!data.username){return false;}
        await setDoc(doc(db,'publicProfiles',user.uid),safePublicProfile(user.uid,data),{merge:true});
        return true;
      }
    }catch(error){
      if(i===attempts-1)console.warn('[Shadrat] public profile bootstrap',error);
    }
    await sleep(delay);
  }
  return false;
}

onAuthStateChanged(auth,user=>{if(user)syncCurrentStudent(user).catch(error=>console.warn('[Shadrat] public profile sync',error))});
