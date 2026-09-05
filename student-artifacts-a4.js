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

const PAGE_W=794;
const PAGE_H=1123;
const ensureCssLink=(href,key)=>{
  if(document.querySelector(`link[data-${key}]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset[key]='1';document.head.appendChild(link);
};
export function ensureBuilderCss(){
  ensureCssLink('builder-system.css?v=2','builderSystem');
  ensureCssLink('builder-a4.css?v=2','builderA4');
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
function normalizeExportNode(clone){
  const props={position:'relative',top:'auto',left:'auto',right:'auto',bottom:'auto',transform:'none','transform-origin':'initial',display:'block',visibility:'visible',opacity:'1','box-shadow':'none','border-radius':'0',margin:'0',width:`${PAGE_W}px`,'min-width':`${PAGE_W}px`,'max-width':`${PAGE_W}px`,height:`${PAGE_H}px`,'min-height':`${PAGE_H}px`,'max-height':`${PAGE_H}px`,'box-sizing':'border-box',overflow:'hidden'};
  Object.entries(props).forEach(([k,v])=>clone.style.setProperty(k,v,'important'));
  return clone;
}

export async function downloadNodePdf(node,filename){
  if(!node)throw new Error('PDF_NODE_MISSING');
  ensureBuilderCss();
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',()=>!!window.html2canvas&&(!!window.jspdf?.jsPDF||!!window.jsPDF));

  const clone=normalizeExportNode(node.cloneNode(true));
  const shell=document.createElement('div');
  shell.className='artifact-pdf-shell';
  shell.dir='ltr';
  shell.style.cssText=`position:fixed;top:0;left:0;width:${PAGE_W}px;height:${PAGE_H}px;margin:0;padding:0;background:#fff;z-index:2147483645;overflow:hidden;box-sizing:border-box;pointer-events:none;direction:ltr;`;
  shell.appendChild(clone);

  const cover=document.createElement('div');
  cover.setAttribute('role','status');cover.setAttribute('aria-live','polite');cover.textContent='جاري تجهيز ملف PDF بنفس معاينة A4…';
  cover.style.cssText='position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;background:rgba(248,251,255,.98);color:#1d4ed8;font:800 16px Tahoma,Arial,sans-serif;text-align:center;padding:24px;';

  const oldHtmlOverflow=document.documentElement.style.overflow;
  const oldBodyOverflow=document.body.style.overflow;
  document.documentElement.style.overflow='hidden';
  document.body.style.overflow='hidden';
  document.body.append(shell,cover);
  try{
    if(document.fonts?.ready)await document.fonts.ready;
    await nextPaint();
    const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    const canvas=await window.html2canvas(clone,{
      scale:isIOS?1.5:2,
      useCORS:true,
      backgroundColor:'#ffffff',
      logging:false,
      scrollX:0,
      scrollY:0,
      width:PAGE_W,
      height:PAGE_H,
      windowWidth:PAGE_W,
      windowHeight:PAGE_H
    });
    const JsPDF=window.jspdf?.jsPDF||window.jsPDF;
    if(!JsPDF)throw new Error('JSPDF_MISSING');
    const pdf=new JsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
    pdf.addImage(canvas.toDataURL('image/jpeg',0.98),'JPEG',0,0,210,297,undefined,'FAST');
    pdf.save(safeFilename(filename,'Shadrat-file.pdf'));
  }finally{
    cover.remove();shell.remove();
    document.documentElement.style.overflow=oldHtmlOverflow;
    document.body.style.overflow=oldBodyOverflow;
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
