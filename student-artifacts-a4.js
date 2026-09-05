import * as base from './student-artifacts.js?v=2';

export const auth=base.auth;
export const db=base.db;
export const safeFilename=base.safeFilename;
export const waitForUser=base.waitForUser;
export const saveArtifact=base.saveArtifact;
export const logStudentActivity=base.logStudentActivity;
export const listUserSavedItems=base.listUserSavedItems;
export const listArtifacts=base.listArtifacts;
export const listActivity=base.listActivity;
export const getArtifact=base.getArtifact;
export const deleteArtifact=base.deleteArtifact;
export const timestampMs=base.timestampMs;
export const formatSavedAt=base.formatSavedAt;

const ensureCssLink=(href,key)=>{
  if(document.querySelector(`link[data-${key}]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset[key]='1';document.head.appendChild(link);
};
export function ensureBuilderCss(){
  ensureCssLink('builder-system.css?v=2','builderSystem');
  ensureCssLink('builder-a4.css?v=1','builderA4');
}
const loadScript=(src,test)=>new Promise((resolve,reject)=>{
  if(test?.())return resolve();
  const old=[...document.scripts].find(s=>s.src===src);
  if(old){if(test?.())return resolve();old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}
  const s=document.createElement('script');s.src=src;s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
});
const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
const sanitizeStoredHtml=(html='')=>{
  const parsed=new DOMParser().parseFromString(String(html),'text/html');
  parsed.querySelectorAll('script,style,iframe,object,embed,link,meta,base').forEach(el=>el.remove());
  parsed.querySelectorAll('*').forEach(el=>[...el.attributes].forEach(attr=>{
    const name=attr.name.toLowerCase(),value=attr.value.trim().toLowerCase();
    if(name.startsWith('on')||name==='srcdoc'||((name==='href'||name==='src')&&value.startsWith('javascript:')))el.removeAttribute(attr.name);
  }));
  return parsed.body.innerHTML;
};

export async function downloadNodePdf(node,filename){
  if(!node)throw new Error('PDF_NODE_MISSING');
  ensureBuilderCss();
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',()=>!!window.html2pdf);
  const clone=node.cloneNode(true);
  clone.style.setProperty('position','relative','important');
  clone.style.setProperty('top','auto','important');
  clone.style.setProperty('left','auto','important');
  clone.style.setProperty('right','auto','important');
  clone.style.setProperty('transform','none','important');
  clone.style.setProperty('transform-origin','initial','important');
  clone.style.setProperty('display','block','important');
  clone.style.setProperty('visibility','visible','important');
  clone.style.setProperty('opacity','1','important');
  clone.style.setProperty('box-shadow','none','important');
  clone.style.setProperty('border-radius','0','important');
  clone.style.setProperty('margin','0','important');
  clone.style.setProperty('width','210mm','important');
  clone.style.setProperty('min-width','210mm','important');
  clone.style.setProperty('max-width','210mm','important');
  clone.style.setProperty('min-height','297mm','important');
  clone.style.setProperty('height','auto','important');
  clone.style.setProperty('box-sizing','border-box','important');
  clone.style.setProperty('overflow','visible','important');

  const shell=document.createElement('div');
  shell.className='artifact-pdf-shell';
  shell.style.cssText='position:fixed;top:0;left:0;width:210mm;min-height:297mm;margin:0;padding:0;background:#fff;z-index:2147483645;overflow:visible;box-sizing:border-box;pointer-events:none;';
  shell.appendChild(clone);
  const cover=document.createElement('div');
  cover.setAttribute('role','status');cover.setAttribute('aria-live','polite');cover.textContent='جاري تجهيز ملف PDF بنفس معاينة A4…';
  cover.style.cssText='position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;background:rgba(248,251,255,.98);color:#1d4ed8;font:800 16px Tahoma,Arial,sans-serif;text-align:center;padding:24px;';
  const oldOverflow=document.documentElement.style.overflow;
  document.documentElement.style.overflow='hidden';
  document.body.append(shell,cover);
  try{
    await nextPaint();
    const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    await window.html2pdf().set({
      margin:0,
      filename:safeFilename(filename,'Shadrat-file.pdf'),
      image:{type:'jpeg',quality:.99},
      html2canvas:{scale:isIOS?1.5:2,useCORS:true,backgroundColor:'#ffffff',logging:false,scrollX:0,scrollY:0,windowWidth:794},
      jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
      pagebreak:{mode:['css','legacy']}
    }).from(clone).save();
  }finally{
    cover.remove();shell.remove();document.documentElement.style.overflow=oldOverflow;
  }
}

export async function downloadArtifactPdf(artifact){
  ensureBuilderCss();
  const holder=document.createElement('div');
  if(artifact.renderedHtml)holder.innerHTML=sanitizeStoredHtml(artifact.renderedHtml);
  else{
    const el=document.createElement('article');
    el.className=artifact.artifactType==='motivation'?'letter letter-template-academic':'cv template-modern';
    const p=document.createElement('p');p.textContent=artifact.renderedText||'';el.appendChild(p);holder.appendChild(el);
  }
  const node=holder.firstElementChild;
  if(!node)throw new Error('ARTIFACT_RENDER_EMPTY');
  const suffix=artifact.artifactType==='motivation'?'Motivation-Letter':'CV';
  return downloadNodePdf(node,`${safeFilename(artifact.studentName||artifact.artifactName||'Student')}-${suffix}.pdf`);
}
