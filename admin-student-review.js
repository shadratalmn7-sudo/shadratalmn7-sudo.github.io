import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{collection,doc,getDoc,getDocs,getFirestore,query,updateDoc,where}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{firebaseConfig}from'./firebase-config.js';
const app=getApps().length?getApp():initializeApp(firebaseConfig),db=getFirestore(app),uid=new URLSearchParams(location.search).get('uid');
const ms=v=>v?.toMillis?.()||v?.toDate?.()?.getTime?.()||new Date(v||0).getTime()||0;
const timeOf=x=>x.savedAt||x.createdAt||x.updatedAt||null;
async function rows(name){try{const s=await getDocs(query(collection(db,name),where('userId','==',uid)));return s.docs.map(d=>d.data())}catch(e){console.warn('[Shadrat review]',name,e);return[]}}
async function mark(){if(!uid)return;try{
  const [profile,saved,orders,messages]=await Promise.all([getDoc(doc(db,'users',uid)),rows('savedCommunityPosts'),rows('orders'),rows('messages')]);
  if(!profile.exists())return;const p=profile.data();let latest=ms(p.createdAt);
  [...saved,...orders,...messages.filter(x=>x.type!=='service')].forEach(x=>{latest=Math.max(latest,ms(timeOf(x)))});
  if(!latest||latest<=ms(p.adminActivityReviewedAt))return;
  await updateDoc(doc(db,'users',uid),{adminActivityReviewedAt:new Date(latest)});
  document.dispatchEvent(new CustomEvent('shadrat:student-reviewed',{detail:{uid,latest}}));
}catch(e){console.warn('[Shadrat] could not mark activity reviewed',e)}}
setTimeout(mark,800);
