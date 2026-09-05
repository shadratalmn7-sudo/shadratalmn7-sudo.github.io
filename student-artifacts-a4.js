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
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
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
async function ensureHtml2Canvas(){
  if(window.html2canvas)return;
  await loadFromMirrors([
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
    'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'
  ],()=>!!window.html2canvas);
}
async function ensureJsPdf(){
  if(window.jspdf?.jsPDF||window.jsPDF)return;
  await loadFromMirrors([
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
    'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'
  ],()=>!!(window.jspdf?.jsPDF||window.jsPDF));
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
function normalizeExportNode(clone,multiPage=false){
  const props={position:'relative',top:'auto',left:'auto',right:'auto',bottom:'auto',transform:'none','transform-origin':'initial',display:'block',visibility:'visible',opacity:'1','box-shadow':'none','border-radius':'0',margin:'0',width:`${PAGE_W}px`,'min-width':`${PAGE_W}px`,'max-width':`${PAGE_W}px`,height:multiPage?'auto':`${PAGE_H}px`,'min-height':`${PAGE_H}px`,'max-height':multiPage?'none':`${PAGE_H}px`,'box-sizing':'border-box',overflow:multiPage?'visible':'hidden'};
  Object.entries(props).forEach(([k,v])=>clone.style.setProperty(k,v,'important'));
  return clone;
}
const isIOSDevice=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const nodeDirection=node=>(node?.dir||getComputedStyle(node).direction||'ltr').toLowerCase()==='rtl'?'rtl':'ltr';
function saveBlob(blob,filename){
  const name=safeFilename(filename,'Shadrat-file.pdf');
  if(navigator.msSaveOrOpenBlob){navigator.msSaveOrOpenBlob(blob,name);return}
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;link.download=name;link.rel='noopener';link.style.display='none';document.body.appendChild(link);
  try{
    if('download'in link)link.click();
    else{link.removeAttribute('download');link.target='_blank';link.click()}
  }finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
}
async function canvasToDataUrl(canvas){
  if(typeof canvas.toDataURL==='function'){
    try{return canvas.toDataURL('image/jpeg',0.94)}catch(error){console.warn('[Shadrat] canvas data URL failed',error)}
  }
  if(typeof canvas.toBlob==='function'){
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('CANVAS_BLOB_EMPTY')),'image/jpeg',0.94));
    return await new Promise((resolve,reject)=>{
      const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error||new Error('FILE_READER_FAILED'));reader.readAsDataURL(blob);
    });
  }
  throw new Error('CANVAS_EXPORT_UNAVAILABLE');
}
function inlineComputedStyles(source,clone){
  const sources=[source,...source.querySelectorAll('*')];
  const clones=[clone,...clone.querySelectorAll('*')];
  sources.forEach((src,index)=>{
    const dst=clones[index];if(!dst)return;
    const computed=getComputedStyle(src);let css='';
    for(const prop of computed){const value=computed.getPropertyValue(prop);if(value)css+=`${prop}:${value};`}
    dst.setAttribute('style',css);
  });
  return clone;
}
const imageReady=img=>new Promise((resolve,reject)=>{img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('SVG_IMAGE_LOAD_FAILED'))});
async function renderNativeCanvas(node,scale){
  const multiPage=node.dataset.multipage==='true',clone=normalizeExportNode(node.cloneNode(true),multiPage);
  inlineComputedStyles(node,clone);
  normalizeExportNode(clone,multiPage);
  const contentHeight=multiPage?Math.max(PAGE_H,node.scrollHeight,node.offsetHeight):PAGE_H;
  const dir=nodeDirection(node);
  clone.setAttribute('dir',dir);
  clone.style.setProperty('direction',dir,'important');
  clone.style.setProperty('unicode-bidi','isolate','important');
  const wrapper=document.createElement('div');
  wrapper.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
  wrapper.style.cssText=`width:${PAGE_W}px;height:${contentHeight}px;margin:0;padding:0;background:#fff;overflow:hidden;direction:${dir};`;
  wrapper.appendChild(clone);
  const xml=new XMLSerializer().serializeToString(wrapper);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${contentHeight}" viewBox="0 0 ${PAGE_W} ${contentHeight}"><foreignObject x="0" y="0" width="${PAGE_W}" height="${contentHeight}">${xml}</foreignObject></svg>`;
  const svgUrl=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
  try{
    const img=new Image();const ready=imageReady(img);img.src=svgUrl;
    if(typeof img.decode==='function'){try{await img.decode()}catch{await ready}}else await ready;
    const canvas=document.createElement('canvas');canvas.width=Math.round(PAGE_W*scale);canvas.height=Math.round(contentHeight*scale);
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('CANVAS_CONTEXT_MISSING');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    return canvas;
  }finally{URL.revokeObjectURL(svgUrl)}
}
async function renderHtml2Canvas(node,scale,preferNativeText=false){
  await ensureHtml2Canvas();
  const multiPage=node.dataset.multipage==='true',clone=normalizeExportNode(node.cloneNode(true),multiPage);
  const shell=document.createElement('div');
  const dir=nodeDirection(node);
  shell.className='artifact-pdf-shell';shell.dir=dir;
  shell.style.cssText=`position:fixed;top:0;left:-10000px;width:${PAGE_W}px;height:auto;min-height:${PAGE_H}px;margin:0;padding:0;background:#fff;z-index:2147483645;overflow:visible;box-sizing:border-box;pointer-events:none;direction:${dir};`;
  shell.appendChild(clone);document.body.appendChild(shell);
  try{
    await nextPaint();await wait(40);
    const contentHeight=multiPage?Math.max(PAGE_H,clone.scrollHeight,clone.offsetHeight):PAGE_H;
    return await window.html2canvas(clone,{scale,useCORS:true,allowTaint:false,backgroundColor:'#ffffff',logging:false,removeContainer:true,foreignObjectRendering:preferNativeText,scrollX:0,scrollY:0,width:PAGE_W,height:contentHeight,windowWidth:PAGE_W,windowHeight:contentHeight});
  }finally{shell.remove()}
}
async function makePdfBlob(node){
  if(document.fonts?.ready)await document.fonts.ready;
  await nextPaint();
  const memory=Number(navigator.deviceMemory||0);
  const lowMemory=isIOSDevice()||(memory>0&&memory<=4);
  const scale=lowMemory?1.25:1.5;
  const rtl=nodeDirection(node)==='rtl';
  let canvas;
  if(rtl){
    try{canvas=await renderNativeCanvas(node,scale)}
    catch(error){console.warn('[Shadrat] native RTL capture failed, using html2canvas fallback',error);canvas=await renderHtml2Canvas(node,scale,true)}
  }else canvas=await renderHtml2Canvas(node,scale,false);
  if(!canvas?.width||!canvas?.height)throw new Error('PDF_CANVAS_EMPTY');
  await ensureJsPdf();
  const JsPDF=window.jspdf?.jsPDF||window.jsPDF;if(!JsPDF)throw new Error('JSPDF_MISSING');
  const pdf=new JsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
  const pagePixels=Math.round(canvas.width*PAGE_H/PAGE_W),pages=Math.max(1,Math.ceil(canvas.height/pagePixels));
  for(let i=0;i<pages;i++){
    const slice=document.createElement('canvas');slice.width=canvas.width;slice.height=pagePixels;const ctx=slice.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,slice.width,slice.height);ctx.drawImage(canvas,0,i*pagePixels,canvas.width,Math.min(pagePixels,canvas.height-i*pagePixels),0,0,canvas.width,Math.min(pagePixels,canvas.height-i*pagePixels));if(i)pdf.addPage();pdf.addImage(await canvasToDataUrl(slice),'JPEG',0,0,210,297,undefined,'FAST');
  }
  const blob=pdf.output('blob');if(!blob||!blob.size)throw new Error('PDF_BLOB_EMPTY');return blob;
}
function openPrintFallback(node){
  const clone=node.cloneNode(true);
  const frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';document.body.appendChild(frame);
  const doc=frame.contentDocument;const styles=[...document.querySelectorAll('link[rel="stylesheet"],style')].map(el=>el.outerHTML).join('');
  doc.open();doc.write(`<!doctype html><html><head><meta charset="utf-8">${styles}<style>@page{size:A4;margin:0}html,body{margin:0!important;padding:0!important;background:#fff!important}.cv,.letter{box-shadow:none!important;margin:0!important}</style></head><body></body></html>`);doc.close();doc.body.appendChild(clone);
  const win=frame.contentWindow;setTimeout(()=>{try{win.focus();win.print()}finally{setTimeout(()=>frame.remove(),1500)}},350);
}

export async function downloadNodePdf(node,filename){
  if(!node)throw new Error('PDF_NODE_MISSING');
  ensureBuilderCss();
  const cover=document.createElement('div');cover.setAttribute('role','status');cover.setAttribute('aria-live','polite');cover.textContent='جاري تجهيز ملف PDF…';cover.style.cssText='position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;background:rgba(248,251,255,.98);color:#1d4ed8;font:800 16px Tahoma,Arial,sans-serif;text-align:center;padding:24px;';
  const oldHtmlOverflow=document.documentElement.style.overflow,oldBodyOverflow=document.body.style.overflow;document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';document.body.appendChild(cover);
  try{
    const blob=await makePdfBlob(node);saveBlob(blob,filename);return{method:'download'};
  }catch(error){
    console.error('[Shadrat] direct PDF export failed',error);cover.textContent='تعذر التنزيل المباشر، سيتم فتح نافذة الحفظ/الطباعة كخيار احتياطي…';await wait(250);
    try{openPrintFallback(node);return{method:'print',fallback:true,error}}catch(fallbackError){console.error('[Shadrat] print fallback failed',fallbackError);throw error}
  }finally{cover.remove();document.documentElement.style.overflow=oldHtmlOverflow;document.body.style.overflow=oldBodyOverflow}
}

export async function downloadArtifactPdf(artifact){
  ensureBuilderCss();
  const holder=document.createElement('div');
  if(artifact.renderedHtml)holder.innerHTML=sanitizeStoredHtml(artifact.renderedHtml);
  else{const el=document.createElement('article');el.className=artifact.artifactType==='motivation'?'letter letter-template-academic':'cv template-modern';const p=document.createElement('p');p.textContent=artifact.renderedText||'';el.appendChild(p);holder.appendChild(el)}
  const node=holder.firstElementChild;if(!node)throw new Error('ARTIFACT_RENDER_EMPTY');
  if(artifact.language==='ar'||/[؀-ۿ]/.test(node.textContent||''))node.setAttribute('dir','rtl');
  const suffix=artifact.artifactType==='motivation'?'Motivation-Letter':'CV';
  return downloadNodePdf(node,`${safeFilename(artifact.studentName||artifact.artifactName||'Student')}-${suffix}.pdf`);
}
