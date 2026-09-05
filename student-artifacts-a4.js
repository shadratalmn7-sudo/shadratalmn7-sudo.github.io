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
const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
const wait=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
const absoluteUrl=src=>{try{return new URL(src,document.baseURI).href}catch{return src}};
const loadExternalScript=(src,test,timeout=15000)=>new Promise((resolve,reject)=>{
  if(test?.())return resolve(true);
  const expected=absoluteUrl(src);
  const previous=[...document.scripts].find(s=>s.src===expected);
  if(previous?.dataset.shadratLoaded==='1'){
    if(test?.())return resolve(true);
    previous.remove();
  }
  const script=document.createElement('script');
  script.src=src;
  script.async=true;
  script.crossOrigin='anonymous';
  const timer=setTimeout(()=>{
    script.remove();
    reject(new Error(`SCRIPT_TIMEOUT:${src}`));
  },timeout);
  script.onload=()=>{
    clearTimeout(timer);
    script.dataset.shadratLoaded='1';
    if(test?.())resolve(true);
    else reject(new Error(`SCRIPT_GLOBAL_MISSING:${src}`));
  };
  script.onerror=()=>{
    clearTimeout(timer);
    script.remove();
    reject(new Error(`SCRIPT_LOAD_FAILED:${src}`));
  };
  document.head.appendChild(script);
});
async function loadFromMirrors(urls,test){
  if(test?.())return true;
  let lastError=null;
  for(const src of urls){
    try{
      await loadExternalScript(src,test);
      if(test?.())return true;
    }catch(error){
      lastError=error;
      console.warn('[Shadrat] PDF library mirror failed',src,error);
    }
  }
  throw lastError||new Error('PDF_LIBRARY_UNAVAILABLE');
}
async function ensurePdfLibraries(){
  if(!window.html2canvas){
    await loadFromMirrors([
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
      'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
      'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'
    ],()=>!!window.html2canvas);
  }
  if(!(window.jspdf?.jsPDF||window.jsPDF)){
    await loadFromMirrors([
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
      'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'
    ],()=>!!(window.jspdf?.jsPDF||window.jsPDF));
  }
}
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
const isIOSDevice=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function saveBlob(blob,filename){
  const name=safeFilename(filename,'Shadrat-file.pdf');
  if(navigator.msSaveOrOpenBlob){
    navigator.msSaveOrOpenBlob(blob,name);
    return;
  }
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download=name;
  link.rel='noopener';
  link.style.display='none';
  document.body.appendChild(link);
  try{
    if('download' in link){
      link.click();
    }else{
      link.removeAttribute('download');
      link.target='_blank';
      link.click();
    }
  }finally{
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
}
async function canvasToDataUrl(canvas){
  if(typeof canvas.toDataURL==='function'){
    try{return canvas.toDataURL('image/jpeg',0.94)}catch(error){console.warn('[Shadrat] canvas data URL failed',error)}
  }
  if(typeof canvas.toBlob==='function'){
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('CANVAS_BLOB_EMPTY')),'image/jpeg',0.94));
    return await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=()=>reject(reader.error||new Error('FILE_READER_FAILED'));
      reader.readAsDataURL(blob);
    });
  }
  throw new Error('CANVAS_EXPORT_UNAVAILABLE');
}
async function makePdfBlob(node){
  await ensurePdfLibraries();
  const clone=normalizeExportNode(node.cloneNode(true));
  const shell=document.createElement('div');
  shell.className='artifact-pdf-shell';
  shell.dir=node.dir||getComputedStyle(node).direction||'ltr';
  shell.style.cssText=`position:fixed;top:0;left:-10000px;width:${PAGE_W}px;height:${PAGE_H}px;margin:0;padding:0;background:#fff;z-index:2147483645;overflow:hidden;box-sizing:border-box;pointer-events:none;`;
  shell.appendChild(clone);
  document.body.appendChild(shell);
  try{
    if(document.fonts?.ready)await document.fonts.ready;
    await nextPaint();
    await wait(40);
    const memory=Number(navigator.deviceMemory||0);
    const lowMemory=isIOSDevice()||(memory>0&&memory<=4);
    const scale=lowMemory?1.25:1.5;
    const canvas=await window.html2canvas(clone,{
      scale,
      useCORS:true,
      allowTaint:false,
      backgroundColor:'#ffffff',
      logging:false,
      removeContainer:true,
      scrollX:0,
      scrollY:0,
      width:PAGE_W,
      height:PAGE_H,
      windowWidth:PAGE_W,
      windowHeight:PAGE_H
    });
    if(!canvas?.width||!canvas?.height)throw new Error('PDF_CANVAS_EMPTY');
    const JsPDF=window.jspdf?.jsPDF||window.jsPDF;
    if(!JsPDF)throw new Error('JSPDF_MISSING');
    const pdf=new JsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
    const image=await canvasToDataUrl(canvas);
    pdf.addImage(image,'JPEG',0,0,210,297,undefined,'FAST');
    const blob=pdf.output('blob');
    if(!blob||!blob.size)throw new Error('PDF_BLOB_EMPTY');
    return blob;
  }finally{
    shell.remove();
  }
}
function openPrintFallback(node){
  const clone=node.cloneNode(true);
  const frame=document.createElement('iframe');
  frame.setAttribute('aria-hidden','true');
  frame.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
  document.body.appendChild(frame);
  const doc=frame.contentDocument;
  const styles=[...document.querySelectorAll('link[rel="stylesheet"],style')].map(el=>el.outerHTML).join('');
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8">${styles}<style>@page{size:A4;margin:0}html,body{margin:0!important;padding:0!important;background:#fff!important}.cv,.letter{box-shadow:none!important;margin:0!important}</style></head><body></body></html>`);
  doc.close();
  doc.body.appendChild(clone);
  const win=frame.contentWindow;
  setTimeout(()=>{
    try{win.focus();win.print()}finally{setTimeout(()=>frame.remove(),1500)}
  },350);
}

export async function downloadNodePdf(node,filename){
  if(!node)throw new Error('PDF_NODE_MISSING');
  ensureBuilderCss();

  const cover=document.createElement('div');
  cover.setAttribute('role','status');cover.setAttribute('aria-live','polite');cover.textContent='جاري تجهيز ملف PDF…';
  cover.style.cssText='position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;background:rgba(248,251,255,.98);color:#1d4ed8;font:800 16px Tahoma,Arial,sans-serif;text-align:center;padding:24px;';

  const oldHtmlOverflow=document.documentElement.style.overflow;
  const oldBodyOverflow=document.body.style.overflow;
  document.documentElement.style.overflow='hidden';
  document.body.style.overflow='hidden';
  document.body.appendChild(cover);
  try{
    const blob=await makePdfBlob(node);
    saveBlob(blob,filename);
    return {method:'download'};
  }catch(error){
    console.error('[Shadrat] direct PDF export failed',error);
    cover.textContent='تعذر التنزيل المباشر، سيتم فتح نافذة الحفظ/الطباعة كخيار احتياطي…';
    await wait(250);
    try{
      openPrintFallback(node);
      return {method:'print',fallback:true,error};
    }catch(fallbackError){
      console.error('[Shadrat] print fallback failed',fallbackError);
      throw error;
    }
  }finally{
    cover.remove();
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
