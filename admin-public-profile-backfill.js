import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import{collection,doc,getDoc,getDocs,getFirestore,serverTimestamp,writeBatch}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{firebaseConfig}from'./firebase-config.js';

const OWNER_EMAIL='shadrat.almn7@gmail.com';
const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const clean=v=>String(v??'').trim();
const username=v=>clean(v).toLowerCase().replace(/^@/,'').replace(/[^a-z0-9_]/g,'').slice(0,24);
const list=(v,max=16)=>Array.isArray(v)?v.map(x=>typeof x==='string'?clean(x):clean(x?.title||x?.name||x?.label||x?.text)).filter(Boolean).slice(0,max):[];
const telegram=v=>clean(v).replace(/^https?:\/\/(t\.me|telegram\.me)\//i,'').replace(/^@/,'').replace(/[^a-zA-Z0-9_]/g,'').slice(0,32);
const whatsapp=v=>clean(v).replace(/\D/g,'').slice(0,15);
const interests=v=>[...new Set((Array.isArray(v)?v:String(v||'').split(/[,،]/)).map(clean).filter(Boolean))].slice(0,8);

function safeProfile(uid,data={}){
  return{
    uid,
    fullName:clean(data.fullName||data.displayName||'طالب شذرات').slice(0,80),
    username:username(data.username||`student_${uid.slice(0,5)}`),
    avatarKey:String(data.avatarKey||''),
    level:Math.max(1,Number(data.level)||1),
    xp:Math.max(0,Number(data.xp)||0),
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

async function authorized(user){
  if(!user)return false;
  if((user.email||'').toLowerCase()===OWNER_EMAIL)return true;
  try{const snap=await getDoc(doc(db,'users',user.uid));return ['owner','admin'].includes(snap.data()?.role)}catch{return false}
}

export async function backfillAllStudentProfiles(user){
  if(!await authorized(user))return{updated:0};
  const snapshot=await getDocs(collection(db,'users'));
  const students=snapshot.docs.map(d=>({uid:d.id,...d.data()})).filter(x=>(x.role||'student')==='student'&&x.accountStatus!=='suspended');
  let updated=0;
  for(let start=0;start<students.length;start+=400){
    const batch=writeBatch(db);
    for(const student of students.slice(start,start+400)){
      batch.set(doc(db,'publicProfiles',student.uid),safeProfile(student.uid,student),{merge:true});
      updated++;
    }
    await batch.commit();
  }
  console.info(`[Shadrat] public profiles backfilled: ${updated}`);
  return{updated};
}

onAuthStateChanged(auth,user=>{if(user)backfillAllStudentProfiles(user).catch(error=>console.warn('[Shadrat] public profile backfill',error))});
