import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import{addDoc,collection,deleteDoc,doc,getDoc,getDocs,getFirestore,query,serverTimestamp,where}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{firebaseConfig}from'./firebase-config.js';

const app=getApps().length?getApp():initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const db=getFirestore(app);
const STORE='savedCommunityPosts';

const cleanText=(value,max=200000)=>String(value??'').trim().slice(0,max);
const deepClean=value=>{
  if(value===undefined)return null;
  if(value===null||typeof value==='string'||typeof value==='number'||typeof value==='boolean')return value;
  if(Array.isArray(value))return value.map(deepClean);
  if(typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([k,v])=>[k,deepClean(v)]));
  return String(value);
};
export const safeFilename=(value,fallback='Shadrat-file')=>{
  const s=String(value||fallback).trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  return (s||fallback).slice(0,100);
};
export const waitForUser=(timeout=3500)=>new Promise(resolve=>{
  if(auth.currentUser)return resolve(auth.currentUser);
  let done=false;
  const stop=onAuthStateChanged(auth,user=>{if(done)return;done=true;clearTimeout(timer);stop();resolve(user||null)});
  const timer=setTimeout(()=>{if(done)return;done=true;stop();resolve(auth.currentUser||null)},timeout);
});

export async function saveArtifact(record){
  const user=await waitForUser();
  if(!user)throw Object.assign(new Error('LOGIN_REQUIRED'),{code:'login-required'});
  const payload={
    type:'artifact',userId:user.uid,userEmail:user.email||'',
    artifactType:record.artifactType==='motivation'?'motivation':'cv',
    artifactGroupId:cleanText(record.artifactGroupId||crypto.randomUUID(),100),
    artifactName:cleanText(record.artifactName||'ملف بدون اسم',100),
    studentName:cleanText(record.studentName||user.displayName||'',120),
    specialization:cleanText(record.specialization||'',160),
    program:cleanText(record.program||'',180),
    template:cleanText(record.template||'modern',50),
    language:cleanText(record.language||'en',10),
    version:Math.max(1,Number(record.version||1)),
    data:deepClean(record.data||{}),
    renderedHtml:cleanText(record.renderedHtml||'',300000),
    renderedText:cleanText(record.renderedText||'',100000),
    certificateSummaries:deepClean(record.certificateSummaries||[]),
    savedAt:serverTimestamp(),createdAt:serverTimestamp()
  };
  const ref=await addDoc(collection(db,STORE),payload);
  return{id:ref.id,...payload,savedAt:new Date(),storage:STORE};
}

export async function logStudentActivity(activityType,label,details={}){
  const user=await waitForUser(1600);
  if(!user)return null;
  const payload={type:'activity',userId:user.uid,userEmail:user.email||'',activityType:cleanText(activityType,80),label:cleanText(label,180),details:deepClean(details),savedAt:serverTimestamp(),createdAt:serverTimestamp()};
  try{const ref=await addDoc(collection(db,STORE),payload);return{id:ref.id,...payload}}catch(error){console.warn('[Shadrat] activity log unavailable',error);return null}
}

export async function listUserSavedItems(uid){
  const snap=await getDocs(query(collection(db,STORE),where('userId','==',uid)));
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}
export async function listArtifacts(uid){return(await listUserSavedItems(uid)).filter(x=>x.type==='artifact')}
export async function listActivity(uid){return(await listUserSavedItems(uid)).filter(x=>x.type==='activity'||x.type==='artifact'||x.type==='scholarship')}
export async function getArtifact(id){const snap=await getDoc(doc(db,STORE,id));if(!snap.exists())return null;const row={id:snap.id,...snap.data()};return row.type==='artifact'?row:null}
export async function deleteArtifact(id){return deleteDoc(doc(db,STORE,id))}

export const timestampMs=value=>value?.toMillis?value.toMillis():(value?.seconds?value.seconds*1000:(value instanceof Date?value.getTime():0));
export const formatSavedAt=value=>{const ms=timestampMs(value);return ms?new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(ms)):'الآن'};

export function ensureBuilderCss(){
  if(document.querySelector('link[data-builder-system]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='builder-system.css?v=1';link.dataset.builderSystem='1';document.head.appendChild(link);
}
const loadScript=(src,test)=>new Promise((resolve,reject)=>{
  if(test?.())return resolve();
  const old=[...document.scripts].find(s=>s.src===src);if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}
  const s=document.createElement('script');s.src=src;s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
});
export async function downloadNodePdf(node,filename){
  if(!node)throw new Error('PDF_NODE_MISSING');
  ensureBuilderCss();
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',()=>!!window.html2pdf);
  const clone=node.cloneNode(true);
  clone.style.setProperty('box-shadow','none','important');clone.style.setProperty('border-radius','0','important');clone.style.setProperty('margin','0','important');clone.style.setProperty('width','190mm','important');clone.style.setProperty('max-width','190mm','important');clone.style.setProperty('min-height','auto','important');clone.style.setProperty('background','#fff','important');
  const shell=document.createElement('div');shell.className='artifact-pdf-shell';shell.style.cssText='position:fixed;left:-12000px;top:0;width:210mm;background:#fff;padding:10mm;z-index:-9999;';shell.appendChild(clone);document.body.appendChild(shell);
  try{
    await window.html2pdf().set({margin:[8,8,8,8],filename:safeFilename(filename,'Shadrat-file.pdf'),image:{type:'jpeg',quality:.99},html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff',logging:false},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy']}}).from(clone).save();
  }finally{setTimeout(()=>shell.remove(),250)}
}
export async function downloadArtifactPdf(artifact){
  ensureBuilderCss();
  const holder=document.createElement('div');
  if(artifact.renderedHtml)holder.innerHTML=artifact.renderedHtml;
  else{const el=document.createElement('article');el.className=artifact.artifactType==='motivation'?'letter letter-template-academic':'cv template-modern';const p=document.createElement('p');p.textContent=artifact.renderedText||'';el.appendChild(p);holder.appendChild(el)}
  const node=holder.firstElementChild;
  const suffix=artifact.artifactType==='motivation'?'Motivation-Letter':'CV';
  return downloadNodePdf(node,`${safeFilename(artifact.studentName||artifact.artifactName||'Student')}-${suffix}.pdf`);
}
