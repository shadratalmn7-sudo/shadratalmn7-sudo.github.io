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

const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const nodeDirection=node=>(node?.dir||getComputedStyle(node).direction||'ltr').toLowerCase()==='rtl'?'rtl':'ltr';

const ensureCssLink=(href,key)=>{
  if(document.querySelector(`link[data-${key}]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset[key]='1';document.head.appendChild(link);
};
function installCleanTemplateOverrides(){
  if(document.querySelector('style[data-shadrat-clean-template-labels]'))return;
  const style=document.createElement('style');
  style.dataset.shadratCleanTemplateLabels='1';
  style.textContent=`
    .template-academic::before,.template-sidebar::before{content:none!important;display:none!important}
  `;
  document.head.appendChild(style);
}
export function ensureBuilderCss(){
  ensureCssLink('builder-system.css?v=3','builderSystem');
  ensureCssLink('builder-a4.css?v=4','builderA4');
  installCleanTemplateOverrides();
}
installCleanTemplateOverrides();

const sanitizeStoredHtml=(html='')=>{
  const parsed=new DOMParser().parseFromString(String(html),'text/html');
  parsed.querySelectorAll('script,style,iframe,object,embed,link,meta,base').forEach(el=>el.remove());
  parsed.querySelectorAll('*').forEach(el=>[...el.attributes].forEach(attr=>{
    const name=attr.name.toLowerCase(),value=attr.value.trim().toLowerCase();
    if(name.startsWith('on')||name==='srcdoc'||((name==='href'||name==='src')&&value.startsWith('javascript:')))el.removeAttribute(attr.name);
  }));
  return parsed.body.innerHTML;
};
const escHtml=(value='')=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function copiedStyles(){
  const links=[...document.querySelectorAll('link[rel="stylesheet"]')]
    .map(link=>`<link rel="stylesheet" href="${escHtml(link.href)}">`).join('');
  const inline=[...document.querySelectorAll('style')]
    .map(style=>`<style>${String(style.textContent||'').replace(/<\/style/gi,'<\\/style')}</style>`).join('');
  return links+inline;
}
function themeFor(node){
  const c=node?.classList||{contains:()=>false};
  const rtl=nodeDirection(node)==='rtl';
  if(c.contains('template-formal')||c.contains('letter-template-formal'))return{accent:'#111827',mode:'frame',rtl};
  if(c.contains('template-editorial')||c.contains('letter-template-editorial'))return{accent:'#111111',mode:'top',rtl};
  if(c.contains('template-modern')||c.contains('letter-template-modern'))return{accent:'#2563eb',mode:'top',rtl};
  if(c.contains('template-sidebar'))return{accent:'#0f172a',mode:'side',rtl};
  if(c.contains('template-academic')||c.contains('letter-template-academic'))return{accent:'#7c2d12',mode:'frame-top',rtl};
  if(c.contains('template-creative')||c.contains('letter-template-creative'))return{accent:'#7c3aed',mode:'top',rtl};
  if(c.contains('template-technical')||c.contains('letter-template-technical'))return{accent:'#0f172a',mode:'top',rtl};
  if(c.contains('template-executive')||c.contains('letter-template-executive'))return{accent:'#020617',mode:'top',rtl};
  if(c.contains('template-timeline'))return{accent:'#0f766e',mode:'side',rtl};
  if(c.contains('letter-template-serif'))return{accent:'#8b5e3c',mode:'sides',rtl};
  if(c.contains('letter-template-clean'))return{accent:'#475569',mode:'side',rtl};
  return{accent:'#cbd5e1',mode:'none',rtl};
}
function printCss(node){
  const theme=themeFor(node),side=theme.rtl?'right':'left';
  const chrome=theme.mode==='top'
    ?`body::after{content:"";position:fixed;z-index:9999;top:0;left:0;right:0;height:3mm;background:${theme.accent};}`
    :theme.mode==='side'
      ?`body::after{content:"";position:fixed;z-index:9999;top:0;bottom:0;${side}:0;width:3mm;background:${theme.accent};}`
      :theme.mode==='frame'
        ?`body::after{content:"";position:fixed;z-index:9999;inset:5mm;border:.55mm solid ${theme.accent};pointer-events:none;}`
        :theme.mode==='frame-top'
          ?`body::before{content:"";position:fixed;z-index:9998;inset:5mm;border:.35mm solid ${theme.accent};pointer-events:none;}body::after{content:"";position:fixed;z-index:9999;top:0;left:0;right:0;height:3mm;background:${theme.accent};}`
          :theme.mode==='sides'
            ?`body::after{content:"";position:fixed;z-index:9999;top:0;bottom:0;left:5mm;right:5mm;border-left:.35mm solid ${theme.accent};border-right:.35mm solid ${theme.accent};pointer-events:none;}`
            :'';
  return `
    @page{size:A4;margin:0}
    html,body{margin:0!important;padding:0!important;width:210mm!important;background:#fff!important}
    html{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    body{min-height:297mm!important;overflow:visible!important}
    *,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
    .cv,.letter{position:relative!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;transform:none!important;transform-origin:initial!important;width:210mm!important;min-width:210mm!important;max-width:210mm!important;height:auto!important;min-height:297mm!important;max-height:none!important;margin:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important}
    .cv[data-multipage="true"],.letter[data-multipage="true"]{height:auto!important;min-height:297mm!important;max-height:none!important;overflow:visible!important}
    .template-academic::before,.template-sidebar::before{content:none!important;display:none!important}
    .counter{display:none!important}
    .cv section,.letter .letter-body p{break-inside:avoid-page!important;page-break-inside:avoid!important}
    .letter .letter-body{white-space:normal!important}
    a{color:inherit!important;text-decoration:none!important}
    ${chrome}
  `;
}
async function waitForPrintAssets(doc){
  const waits=[];
  if(doc.fonts?.ready)waits.push(doc.fonts.ready.catch(()=>{}));
  for(const img of [...doc.images]){
    if(img.complete)continue;
    waits.push(new Promise(resolve=>{img.onload=resolve;img.onerror=resolve}));
  }
  await Promise.race([Promise.all(waits),wait(3500)]).catch(()=>{});
  await wait(120);
}
function cleanClone(node){
  const clone=node.cloneNode(true);
  clone.dataset.multipage='true';
  clone.querySelectorAll('.counter').forEach(el=>el.remove());
  const dir=nodeDirection(node);clone.setAttribute('dir',dir);
  clone.querySelectorAll('h1,h2,h3,p,li,.role,.contact,.letter-meta,.letter-body,.letter-body p').forEach(el=>{
    el.setAttribute('dir',dir);
    el.style.setProperty('direction',dir,'important');
    el.style.setProperty('unicode-bidi','plaintext','important');
    el.style.setProperty('letter-spacing','0','important');
  });
  return clone;
}
async function nativePrintPdf(node,filename){
  ensureBuilderCss();await nextPaint();
  const frame=document.createElement('iframe');
  frame.setAttribute('aria-hidden','true');
  frame.style.cssText='position:fixed;left:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;z-index:-1;';
  document.body.appendChild(frame);
  const doc=frame.contentDocument,dir=nodeDirection(node),title=safeFilename(String(filename||'Shadrat-file.pdf').replace(/\.pdf$/i,''),'Shadrat-file');
  doc.open();
  doc.write(`<!doctype html><html lang="${dir==='rtl'?'ar':'en'}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${escHtml(document.baseURI)}"><title>${escHtml(title)}</title>${copiedStyles()}<style>${printCss(node)}</style></head><body></body></html>`);
  doc.close();
  doc.body.appendChild(cleanClone(node));
  await waitForPrintAssets(doc);
  const win=frame.contentWindow;
  const cleanup=()=>{setTimeout(()=>{try{frame.remove()}catch{}},900)};
  win.addEventListener?.('afterprint',cleanup,{once:true});
  win.focus();
  win.print();
  setTimeout(cleanup,120000);
  return true;
}

export async function downloadNodePdf(node,filename){
  if(!node)throw new Error('PDF_NODE_MISSING');
  return nativePrintPdf(node,filename);
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
  const node=holder.firstElementChild;if(!node)throw new Error('ARTIFACT_RENDER_EMPTY');
  if(artifact.language==='ar'||/[؀-ۿ]/.test(node.textContent||''))node.setAttribute('dir','rtl');
  node.dataset.multipage='true';
  const suffix=artifact.artifactType==='motivation'?'Motivation-Letter':'CV';
  return downloadNodePdf(node,`${safeFilename(artifact.studentName||artifact.artifactName||'Student')}-${suffix}.pdf`);
}
