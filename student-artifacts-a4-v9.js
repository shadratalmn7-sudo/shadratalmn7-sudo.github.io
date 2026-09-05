import * as base from './student-artifacts.js?v=4';

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
const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const absoluteUrl=src=>{try{return new URL(src,document.baseURI).href}catch{return src}};
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const nodeDirection=node=>(node?.dir||getComputedStyle(node).direction||'ltr').toLowerCase()==='rtl'?'rtl':'ltr';

const ensureCssLink=(href,key)=>{
  if(document.querySelector(`link[data-${key}]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset[key]='1';document.head.appendChild(link);
};
export function ensureBuilderCss(){
  ensureCssLink('builder-system.css?v=3','builderSystem');
  ensureCssLink('builder-a4.css?v=4','builderA4');
}

const loadExternalScript=(src,test,timeout=18000)=>new Promise((resolve,reject)=>{
  if(test?.())return resolve(true);
  const expected=absoluteUrl(src);
  const previous=[...document.scripts].find(s=>s.src===expected);
  if(previous?.dataset.shadratLoaded==='1'){
    if(test?.())return resolve(true);
    previous.remove();
  }
  const script=document.createElement('script');script.src=src;script.async=true;script.crossOrigin='anonymous';
  const timer=setTimeout(()=>{script.remove();reject(new Error(`SCRIPT_TIMEOUT:${src}`))},timeout);
  script.onload=()=>{clearTimeout(timer);script.dataset.shadratLoaded='1';test?.()?resolve(true):reject(new Error(`SCRIPT_GLOBAL_MISSING:${src}`))};
  script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error(`SCRIPT_LOAD_FAILED:${src}`))};
  document.head.appendChild(script);
});
async function loadFromMirrors(urls,test){
  if(test?.())return true;
  let lastError=null;
  for(const src of urls){try{await loadExternalScript(src,test);if(test?.())return true}catch(error){lastError=error;console.warn('[Shadrat] library mirror failed',src,error)}}
  throw lastError||new Error('LIBRARY_UNAVAILABLE');
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

function normalizeRoot(clone,multiPage=false){
  const props={
    position:'relative',top:'auto',left:'auto',right:'auto',bottom:'auto',inset:'auto',transform:'none','transform-origin':'initial',
    visibility:'visible',opacity:'1','box-shadow':'none','border-radius':'0',margin:'0',
    width:`${PAGE_W}px`,'min-width':`${PAGE_W}px`,'max-width':`${PAGE_W}px`,
    height:multiPage?'auto':`${PAGE_H}px`,'min-height':`${PAGE_H}px`,'max-height':multiPage?'none':`${PAGE_H}px`,
    'box-sizing':'border-box',overflow:multiPage?'visible':'hidden'
  };
  Object.entries(props).forEach(([k,v])=>clone.style.setProperty(k,v,'important'));
  return clone;
}
function inlineComputedStyles(source,clone){
  const sources=[source,...source.querySelectorAll('*')],clones=[clone,...clone.querySelectorAll('*')];
  sources.forEach((src,index)=>{
    const dst=clones[index];if(!dst)return;
    const computed=getComputedStyle(src);let css='';
    for(const prop of computed){const value=computed.getPropertyValue(prop);if(value)css+=`${prop}:${value};`}
    dst.setAttribute('style',css);
  });
  return clone;
}
function strengthenBidi(root,dir){
  root.setAttribute('dir',dir);root.style.setProperty('direction',dir,'important');root.style.setProperty('unicode-bidi','isolate','important');
  root.querySelectorAll('h1,h2,h3,p,li,.role,.contact,.letter-meta,.letter-body,.letter-body p').forEach(el=>{
    el.setAttribute('dir',dir);el.style.setProperty('direction',dir,'important');el.style.setProperty('unicode-bidi','plaintext','important');el.style.setProperty('letter-spacing','0','important');
  });
}
function collectCssText(){
  let css='';
  for(const sheet of [...document.styleSheets]){
    try{for(const rule of [...(sheet.cssRules||[])])css+=`${rule.cssText}\n`}catch{}
  }
  css+='\nhtml,body{margin:0;padding:0;background:#fff}*{box-sizing:border-box}';
  return css;
}
const imageReady=img=>new Promise((resolve,reject)=>{img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('SVG_IMAGE_LOAD_FAILED'))});

async function renderNativeCanvas(node,scale){
  const multiPage=node.dataset.multipage==='true';
  const clone=node.cloneNode(true);inlineComputedStyles(node,clone);normalizeRoot(clone,multiPage);
  const dir=nodeDirection(node);strengthenBidi(clone,dir);
  await nextPaint();
  const contentHeight=multiPage?Math.max(PAGE_H,node.scrollHeight,node.offsetHeight,clone.scrollHeight||0):PAGE_H;
  const cssText=collectCssText().replace(/<\/style/gi,'<\\/style');
  const wrapper=document.createElement('div');wrapper.setAttribute('xmlns','http://www.w3.org/1999/xhtml');wrapper.dir=dir;
  wrapper.style.cssText=`width:${PAGE_W}px;min-height:${contentHeight}px;margin:0;padding:0;background:#fff;overflow:visible;direction:${dir};`;
  const style=document.createElement('style');style.textContent=cssText;wrapper.append(style,clone);
  const xml=new XMLSerializer().serializeToString(wrapper);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${contentHeight}" viewBox="0 0 ${PAGE_W} ${contentHeight}"><foreignObject x="0" y="0" width="${PAGE_W}" height="${contentHeight}">${xml}</foreignObject></svg>`;
  const svgUrl=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
  try{
    const img=new Image(),ready=imageReady(img);img.src=svgUrl;
    if(typeof img.decode==='function'){try{await img.decode()}catch{await ready}}else await ready;
    const canvas=document.createElement('canvas');canvas.width=Math.round(PAGE_W*scale);canvas.height=Math.round(contentHeight*scale);
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('CANVAS_CONTEXT_MISSING');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    return canvas;
  }finally{URL.revokeObjectURL(svgUrl)}
}
async function renderHtml2Canvas(node,scale,preferNativeText=false){
  await ensureHtml2Canvas();
  const multiPage=node.dataset.multipage==='true',clone=node.cloneNode(true),dir=nodeDirection(node);normalizeRoot(clone,multiPage);strengthenBidi(clone,dir);
  const shell=document.createElement('div');shell.className='artifact-pdf-shell';shell.dir=dir;
  shell.style.cssText=`position:fixed;top:0;left:-10000px;width:${PAGE_W}px;height:auto;min-height:${PAGE_H}px;margin:0;padding:0;background:#fff;z-index:2147483645;overflow:visible;box-sizing:border-box;pointer-events:none;direction:${dir};`;
  shell.appendChild(clone);document.body.appendChild(shell);
  try{
    await nextPaint();await wait(60);const contentHeight=multiPage?Math.max(PAGE_H,clone.scrollHeight,clone.offsetHeight):PAGE_H;
    return await window.html2canvas(clone,{scale,useCORS:true,allowTaint:false,backgroundColor:'#ffffff',logging:false,removeContainer:true,foreignObjectRendering:preferNativeText,scrollX:0,scrollY:0,width:PAGE_W,height:contentHeight,windowWidth:PAGE_W,windowHeight:contentHeight});
  }finally{shell.remove()}
}

function safePageSlices(canvas,maxSlice){
  const slices=[];let offset=0;const scanBack=Math.max(42,Math.round(maxSlice*.16));
  let ctx=null;try{ctx=canvas.getContext('2d',{willReadFrequently:true})}catch{}
  while(offset<canvas.height){
    const remaining=canvas.height-offset;if(remaining<=maxSlice){slices.push({offset,height:remaining});break}
    const target=Math.min(canvas.height,offset+maxSlice);let bestY=target;
    if(ctx){
      const start=Math.max(offset+Math.round(maxSlice*.74),target-scanBack),height=Math.max(1,target-start);
      try{
        const pixels=ctx.getImageData(0,start,canvas.width,height).data;let bestScore=Infinity;
        for(let y=0;y<height;y+=2){
          let dark=0;for(let x=Math.round(canvas.width*.06);x<canvas.width*.94;x+=10){const i=(y*canvas.width+x)*4;if(pixels[i]<238||pixels[i+1]<238||pixels[i+2]<238)dark++}
          const distance=(height-y)/height*.8,score=dark+distance;if(score<bestScore){bestScore=score;bestY=start+y}
        }
      }catch{}
    }
    if(bestY<=offset+Math.round(maxSlice*.58))bestY=target;
    slices.push({offset,height:Math.max(1,bestY-offset)});offset=bestY;
  }
  return slices;
}
function templateTheme(node){
  const c=node?.classList||{contains:()=>false};
  if(c.contains('template-modern')||c.contains('letter-template-modern'))return{accent:'#2563eb',side:false};
  if(c.contains('template-sidebar'))return{accent:'#2563eb',side:true};
  if(c.contains('template-technical')||c.contains('letter-template-technical'))return{accent:'#0f172a',side:false};
  if(c.contains('template-creative')||c.contains('letter-template-creative'))return{accent:'#7c3aed',side:false};
  if(c.contains('template-executive')||c.contains('letter-template-executive'))return{accent:'#334155',side:true};
  if(c.contains('template-academic')||c.contains('letter-template-academic'))return{accent:'#1e3a8a',side:false};
  if(c.contains('template-timeline'))return{accent:'#0f766e',side:true};
  if(c.contains('template-editorial')||c.contains('letter-template-editorial'))return{accent:'#111827',side:false};
  if(c.contains('template-formal')||c.contains('letter-template-formal'))return{accent:'#334155',side:false};
  if(c.contains('letter-template-serif'))return{accent:'#8b5e3c',side:false};
  if(c.contains('letter-template-clean'))return{accent:'#475569',side:true};
  if(c.contains('letter-template-navy'))return{accent:'#0f2f57',side:true};
  return{accent:'#64748b',side:false};
}
function decoratePdfPage(ctx,canvas,node,pageNumber,totalPages){
  const{accent,side}=templateTheme(node),w=canvas.width,h=canvas.height,unit=w/PAGE_W;
  ctx.save();ctx.fillStyle=accent;
  if(side){const sw=Math.max(8,8*unit);const rtl=nodeDirection(node)==='rtl';ctx.fillRect(rtl?w-sw:0,0,sw,h)}
  else ctx.fillRect(0,0,w,Math.max(6,7*unit));
  ctx.strokeStyle='rgba(15,23,42,.18)';ctx.lineWidth=Math.max(1,unit);ctx.strokeRect(5*unit,5*unit,w-10*unit,h-10*unit);
  ctx.fillStyle='#64748b';ctx.font=`${Math.max(10,10*unit)}px Arial,Tahoma,sans-serif`;ctx.textAlign='center';ctx.direction='ltr';ctx.fillText(`${pageNumber} / ${totalPages}`,w/2,h-12*unit);ctx.restore();
}
async function canvasToDataUrl(canvas){
  if(typeof canvas.toDataURL==='function')try{return canvas.toDataURL('image/jpeg',0.95)}catch{}
  if(typeof canvas.toBlob==='function'){
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(new Error('CANVAS_BLOB_EMPTY')),'image/jpeg',0.95));
    return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('FILE_READER_FAILED'));r.readAsDataURL(blob)});
  }
  throw new Error('CANVAS_EXPORT_UNAVAILABLE');
}
async function canvasToPdfBlob(canvas,node){
  await ensureJsPdf();const JsPDF=window.jspdf?.jsPDF||window.jsPDF;if(!JsPDF)throw new Error('JSPDF_MISSING');
  const pdf=new JsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
  const pagePixels=Math.max(1,Math.round(canvas.width*PAGE_H/PAGE_W)),slices=safePageSlices(canvas,pagePixels),total=slices.length;
  for(let i=0;i<total;i++){
    const{offset,height}=slices[i],page=document.createElement('canvas');page.width=canvas.width;page.height=pagePixels;
    const ctx=page.getContext('2d',{alpha:false});if(!ctx)throw new Error('PAGE_CANVAS_CONTEXT_MISSING');ctx.fillStyle='#fff';ctx.fillRect(0,0,page.width,page.height);ctx.drawImage(canvas,0,offset,canvas.width,height,0,0,canvas.width,height);decoratePdfPage(ctx,page,node,i+1,total);
    if(i)pdf.addPage();pdf.addImage(await canvasToDataUrl(page),'JPEG',0,0,210,297,undefined,'FAST');
  }
  const blob=pdf.output('blob');if(!blob?.size)throw new Error('PDF_BLOB_EMPTY');return blob;
}
function saveBlob(blob,filename){
  const name=safeFilename(filename,'Shadrat-file.pdf');
  if(navigator.msSaveOrOpenBlob){navigator.msSaveOrOpenBlob(blob,name);return}
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.rel='noopener';link.style.display='none';document.body.appendChild(link);
  try{link.click()}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),90000)}
}
function busyOverlay(){
  const el=document.createElement('div');el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.textContent='جاري تجهيز ملف PDF…';
  el.style.cssText='position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;background:rgba(248,251,255,.985);color:#1d4ed8;font:800 16px Tahoma,Arial,sans-serif;text-align:center;padding:24px;';document.body.appendChild(el);return el;
}
async function makePdfBlob(node){
  if(document.fonts?.ready)await document.fonts.ready.catch(()=>{});await nextPaint();
  const memory=Number(navigator.deviceMemory||0),scale=isIOS()||(memory>0&&memory<=4)?1.3:1.55,rtl=nodeDirection(node)==='rtl';let canvas;
  if(rtl){
    try{canvas=await renderNativeCanvas(node,scale)}
    catch(error){console.warn('[Shadrat] native RTL capture failed; fallback to browser-assisted html2canvas',error);canvas=await renderHtml2Canvas(node,scale,true)}
  }else{
    try{canvas=await renderHtml2Canvas(node,scale,false)}catch(error){console.warn('[Shadrat] html2canvas capture failed; fallback to native capture',error);canvas=await renderNativeCanvas(node,scale)}
  }
  if(!canvas?.width||!canvas?.height)throw new Error('PDF_CANVAS_EMPTY');return canvasToPdfBlob(canvas,node);
}

export async function downloadNodePdf(node,filename){
  if(!node)throw new Error('PDF_NODE_MISSING');ensureBuilderCss();const overlay=busyOverlay(),oldOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';
  try{const blob=await makePdfBlob(node);saveBlob(blob,filename);return true}
  catch(error){console.error('[Shadrat] PDF export failed',error);throw error}
  finally{overlay.remove();document.documentElement.style.overflow=oldOverflow}
}

export async function downloadArtifactPdf(artifact){
  ensureBuilderCss();const holder=document.createElement('div');
  if(artifact.renderedHtml)holder.innerHTML=sanitizeStoredHtml(artifact.renderedHtml);
  else{const el=document.createElement('article');el.className=artifact.artifactType==='motivation'?'letter letter-template-academic':'cv template-modern';const p=document.createElement('p');p.textContent=artifact.renderedText||'';el.appendChild(p);holder.appendChild(el)}
  const node=holder.firstElementChild;if(!node)throw new Error('ARTIFACT_RENDER_EMPTY');
  if(artifact.language==='ar'||/[؀-ۿ]/.test(node.textContent||''))node.setAttribute('dir','rtl');
  node.dataset.multipage='true';
  const suffix=artifact.artifactType==='motivation'?'Motivation-Letter':'CV';return downloadNodePdf(node,`${safeFilename(artifact.studentName||artifact.artifactName||'Student')}-${suffix}.pdf`);
}
