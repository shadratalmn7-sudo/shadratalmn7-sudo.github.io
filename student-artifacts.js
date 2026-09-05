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
const sanitizeStoredHtml=(html='')=>{
  const parsed=new DOMParser().parseFromString(String(html),'text/html');
  parsed.querySelectorAll('script,style,iframe,object,embed,link,meta,base').forEach(el=>el.remove());
  parsed.querySelectorAll('*').forEach(el=>[...el.attributes].forEach(attr=>{
    const name=attr.name.toLowerCase(),value=attr.value.trim().toLowerCase();
    if(name.startsWith('on')||name==='srcdoc'||((name==='href'||name==='src')&&value.startsWith('javascript:')))el.removeAttribute(attr.name);
  }));
  return parsed.body.innerHTML;
};
export const safeFilename=(value,fallback='Shadrat-file')=>{
  const s=String(value||fallback).trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  return(s||fallback).slice(0,100);
};
export const waitForUser=(timeout=3500)=>new Promise(resolve=>{
  if(auth.currentUser)return resolve(auth.currentUser);
  let done=false,timer=null,stop=()=>{};
  stop=onAuthStateChanged(auth,user=>{if(done)return;done=true;if(timer)clearTimeout(timer);stop();resolve(user||null)});
  timer=setTimeout(()=>{if(done)return;done=true;stop();resolve(auth.currentUser||null)},timeout);
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
  const link=document.createElement('link');link.rel='stylesheet';link.href='builder-system.css?v=2';link.dataset.builderSystem='1';document.head.appendChild(link);
}
const loadScript=(src,test)=>new Promise((resolve,reject)=>{
  if(test?.())return resolve();
  const old=[...document.scripts].find(s=>s.src===src);
  if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}
  const s=document.createElement('script');s.src=src;s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
});
const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
const apply=(el,styles)=>{if(!el)return;Object.entries(styles).forEach(([k,v])=>el.style.setProperty(k,v,'important'))};
const applyAll=(root,selector,styles)=>root.querySelectorAll(selector).forEach(el=>apply(el,styles));

function styleExportClone(clone){
  const rtl=(clone.getAttribute('dir')||'').toLowerCase()==='rtl';
  apply(clone,{
    position:'relative',inset:'auto',display:'block',visibility:'visible',opacity:'1',
    width:'794px','max-width':'794px','min-width':'794px',height:'auto','min-height':'1123px',
    margin:'0',padding:'50px 54px','box-sizing':'border-box','box-shadow':'none','border-radius':'0',
    background:'#ffffff',color:'#111827',overflow:'visible','overflow-wrap':'anywhere','word-break':'normal',
    direction:rtl?'rtl':'ltr','text-align':rtl?'right':'left','font-family':'Arial,Tahoma,sans-serif','font-size':'14px','line-height':'1.65'
  });
  applyAll(clone,'*',{'box-sizing':'border-box','max-width':'100%'});

  if(clone.classList.contains('cv')){
    applyAll(clone,'h1',{margin:'0 0 5px','font-size':'34px','line-height':'1.18','font-weight':'800','letter-spacing':'0','overflow-wrap':'anywhere'});
    applyAll(clone,'.role',{margin:'4px 0 9px','font-size':'15px','line-height':'1.45','font-weight':'800'});
    applyAll(clone,'.contact',{margin:'0 0 14px',padding:'0 0 13px','font-size':'12.5px','line-height':'1.6','white-space':'normal','overflow-wrap':'anywhere'});
    applyAll(clone,'section',{margin:'21px 0 0',padding:'0','break-inside':'avoid'});
    applyAll(clone,'h2',{margin:'0 0 8px',padding:'0','font-size':'15px','line-height':'1.35','font-weight':'800','letter-spacing':'0.02em'});
    applyAll(clone,'p',{margin:'0','font-size':'13.5px','line-height':'1.72','white-space':'pre-wrap','overflow-wrap':'anywhere'});
    applyAll(clone,'ul',{margin:'4px 0 0',padding:rtl?'0 20px 0 0':'0 0 0 20px'});
    applyAll(clone,'li',{margin:'0 0 5px','font-size':'13.5px','line-height':'1.68','overflow-wrap':'anywhere'});

    if(clone.classList.contains('template-modern')){
      apply(clone,{'border-top':'10px solid #2563eb'});applyAll(clone,'.role,h2',{color:'#2563eb'});applyAll(clone,'.contact',{'border-bottom':'2px solid #dbeafe'});
    }else if(clone.classList.contains('template-classic')){
      apply(clone,{'font-family':'Georgia,Times New Roman,serif'});applyAll(clone,'h1,h2,p,li,.role,.contact',{'font-family':'Georgia,Times New Roman,serif'});applyAll(clone,'h2',{'border-bottom':'1px solid #cbd5e1','padding-bottom':'5px'});applyAll(clone,'.contact',{'border-bottom':'1px solid #cbd5e1'});
    }else if(clone.classList.contains('template-navy')){
      apply(clone,{'border-right':'13px solid #0f2f57'});applyAll(clone,'.role,h2',{color:'#0f2f57'});applyAll(clone,'h2',{'border-bottom':'2px solid #d9e7f6','padding-bottom':'5px'});
    }else if(clone.classList.contains('template-minimal')){
      apply(clone,{'border':'1px solid #e5e7eb',padding:'58px 62px'});applyAll(clone,'.role',{color:'#475569'});applyAll(clone,'h2',{color:'#111827','font-size':'13px','border-bottom':'1px solid #e5e7eb','padding-bottom':'7px'});
    }else if(clone.classList.contains('template-academic')){
      apply(clone,{'font-family':'Georgia,Times New Roman,serif','border-top':'5px double #334155'});applyAll(clone,'h1,.role,.contact',{'text-align':'center'});applyAll(clone,'h1,h2,p,li,.role,.contact',{'font-family':'Georgia,Times New Roman,serif'});applyAll(clone,'h2',{color:'#334155','border-bottom':'1px solid #94a3b8','padding-bottom':'4px'});
    }else if(clone.classList.contains('template-sidebar')){
      apply(clone,{'border-left':'34px solid #2563eb'});applyAll(clone,'.role,h2',{color:'#1d4ed8'});applyAll(clone,'.contact',{background:'#eff6ff',padding:'10px 12px','border-radius':'10px'});
    }else if(clone.classList.contains('template-emerald')){
      apply(clone,{'border-top':'10px solid #0f766e'});applyAll(clone,'.role,h2',{color:'#0f766e'});applyAll(clone,'h2',{'border-bottom':'1px solid #99f6e4','padding-bottom':'4px'});
    }else if(clone.classList.contains('template-slate')){
      apply(clone,{background:'linear-gradient(180deg,#f8fafc 0 128px,#ffffff 128px)'});applyAll(clone,'.role,h2',{color:'#334155'});applyAll(clone,'.contact',{'border-bottom':'2px solid #cbd5e1'});
    }else if(clone.classList.contains('template-executive')){
      apply(clone,{'border':'1px solid #cbd5e1',padding:'56px 60px'});applyAll(clone,'h1',{'font-size':'38px'});applyAll(clone,'.role',{color:'#7c3aed'});applyAll(clone,'h2',{color:'#111827','border-left':'5px solid #7c3aed','padding-left':'8px'});
    }else if(clone.classList.contains('template-compact')){
      apply(clone,{padding:'36px 42px'});applyAll(clone,'section',{margin:'15px 0 0'});applyAll(clone,'p,li',{'font-size':'12.5px','line-height':'1.55'});applyAll(clone,'h2',{color:'#1e40af','margin-bottom':'5px'});
    }
  }

  if(clone.classList.contains('letter')){
    apply(clone,{padding:'58px 64px','font-size':'15px','line-height':'1.9'});
    applyAll(clone,'h1',{margin:'0 0 18px','font-size':'25px','line-height':'1.25','font-weight':'800'});
    applyAll(clone,'.letter-meta',{margin:'0 0 20px','font-size':'12px','line-height':'1.55',color:'#64748b','overflow-wrap':'anywhere'});
    applyAll(clone,'p',{margin:'0','font-size':'15px','line-height':'1.95','white-space':'pre-wrap','overflow-wrap':'anywhere'});
    applyAll(clone,'.counter',{display:'none'});

    if(clone.classList.contains('letter-template-academic')){
      apply(clone,{'font-family':'Georgia,Times New Roman,serif','border-top':'8px solid #1e3a8a'});applyAll(clone,'h1,p,.letter-meta',{'font-family':'Georgia,Times New Roman,serif'});applyAll(clone,'h1',{color:'#1e3a8a'});
    }else if(clone.classList.contains('letter-template-formal')){
      apply(clone,{'font-family':'Georgia,Times New Roman,serif','border':'1px solid #cbd5e1'});applyAll(clone,'h1,p,.letter-meta',{'font-family':'Georgia,Times New Roman,serif'});applyAll(clone,'h1',{'text-align':'center',color:'#111827'});
    }else if(clone.classList.contains('letter-template-minimal')){
      apply(clone,{padding:'64px 70px','border':'1px solid #e5e7eb'});applyAll(clone,'h1',{'font-weight':'600',color:'#334155'});
    }else if(clone.classList.contains('letter-template-navy')){
      apply(clone,{'border-right':'12px solid #0f2f57'});applyAll(clone,'h1',{color:'#0f2f57'});
    }else if(clone.classList.contains('letter-template-elegant')){
      apply(clone,{'font-family':'Georgia,Times New Roman,serif','border-top':'3px solid #7c3aed','border-bottom':'3px solid #7c3aed'});applyAll(clone,'h1,p,.letter-meta',{'font-family':'Georgia,Times New Roman,serif'});applyAll(clone,'h1',{color:'#6d28d9'});
    }else if(clone.classList.contains('letter-template-classic')){
      apply(clone,{'font-family':'Times New Roman,serif'});applyAll(clone,'h1,p,.letter-meta',{'font-family':'Times New Roman,serif'});applyAll(clone,'h1',{'border-bottom':'1px solid #64748b','padding-bottom':'12px'});
    }else if(clone.classList.contains('letter-template-modern')){
      apply(clone,{background:'linear-gradient(180deg,#eff6ff 0 120px,#ffffff 120px)'});applyAll(clone,'h1',{color:'#1d4ed8'});
    }else if(clone.classList.contains('letter-template-emerald')){
      apply(clone,{'border-top':'8px solid #0f766e'});applyAll(clone,'h1',{color:'#0f766e'});
    }else if(clone.classList.contains('letter-template-serif')){
      apply(clone,{'font-family':'Georgia,Times New Roman,serif',padding:'62px 68px'});applyAll(clone,'h1,p,.letter-meta',{'font-family':'Georgia,Times New Roman,serif'});applyAll(clone,'p',{'font-size':'15.5px','line-height':'2'});
    }else if(clone.classList.contains('letter-template-clean')){
      apply(clone,{'border-left':'10px solid #334155',padding:'56px 62px'});applyAll(clone,'h1',{color:'#334155'});
    }
  }
  return clone;
}

async function canvasToPdf(canvas,filename){
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',()=>!!window.jspdf?.jsPDF);
  const{jsPDF}=window.jspdf;
  const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  const pageWidth=210,pageHeight=297,margin=10,contentWidth=190,contentHeight=277;
  const pxPerMm=canvas.width/contentWidth;
  const maxSlice=Math.max(1,Math.floor(contentHeight*pxPerMm));
  let offset=0,pageIndex=0;
  while(offset<canvas.height){
    const sliceHeight=Math.min(maxSlice,canvas.height-offset);
    const pageCanvas=document.createElement('canvas');
    pageCanvas.width=canvas.width;pageCanvas.height=sliceHeight;
    const ctx=pageCanvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,pageCanvas.width,pageCanvas.height);
    ctx.drawImage(canvas,0,offset,canvas.width,sliceHeight,0,0,canvas.width,sliceHeight);
    const image=pageCanvas.toDataURL('image/jpeg',0.97);
    const renderedHeight=sliceHeight*contentWidth/canvas.width;
    if(pageIndex>0)pdf.addPage();
    pdf.addImage(image,'JPEG',margin,margin,contentWidth,renderedHeight,undefined,'FAST');
    offset+=sliceHeight;pageIndex+=1;
  }
  pdf.save(safeFilename(filename,'Shadrat-file.pdf'));
}

export async function downloadNodePdf(node,filename){
  if(!node)throw new Error('PDF_NODE_MISSING');
  ensureBuilderCss();
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',()=>!!window.html2canvas);
  if(document.fonts?.ready)await document.fonts.ready.catch(()=>{});

  const clone=styleExportClone(node.cloneNode(true));
  const shell=document.createElement('div');
  shell.className='artifact-pdf-shell';
  shell.style.cssText='position:fixed;top:0;left:0;width:794px;min-height:1123px;background:#fff;z-index:2147483645;overflow:visible;box-sizing:border-box;pointer-events:none;';
  shell.appendChild(clone);
  const cover=document.createElement('div');
  cover.setAttribute('role','status');cover.setAttribute('aria-live','polite');cover.textContent='جاري تجهيز ملف PDF…';
  cover.style.cssText='position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;background:rgba(248,251,255,.985);color:#1d4ed8;font:800 16px Tahoma,Arial,sans-serif;text-align:center;padding:24px;';
  const oldOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';document.body.append(shell,cover);
  try{
    await nextPaint();
    const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    const height=Math.max(1123,Math.ceil(clone.scrollHeight));
    const canvas=await window.html2canvas(clone,{scale:isIOS?1.5:2,useCORS:true,backgroundColor:'#ffffff',logging:false,scrollX:0,scrollY:0,width:794,height,windowWidth:794,windowHeight:Math.min(height,1123)});
    await canvasToPdf(canvas,filename);
  }finally{cover.remove();shell.remove();document.documentElement.style.overflow=oldOverflow}
}

export async function downloadArtifactPdf(artifact){
  ensureBuilderCss();
  const holder=document.createElement('div');
  if(artifact.renderedHtml)holder.innerHTML=sanitizeStoredHtml(artifact.renderedHtml);
  else{const el=document.createElement('article');el.className=artifact.artifactType==='motivation'?'letter letter-template-academic':'cv template-modern';const p=document.createElement('p');p.textContent=artifact.renderedText||'';el.appendChild(p);holder.appendChild(el)}
  const node=holder.firstElementChild;if(!node)throw new Error('ARTIFACT_RENDER_EMPTY');
  const suffix=artifact.artifactType==='motivation'?'Motivation-Letter':'CV';
  return downloadNodePdf(node,`${safeFilename(artifact.studentName||artifact.artifactName||'Student')}-${suffix}.pdf`);
}
