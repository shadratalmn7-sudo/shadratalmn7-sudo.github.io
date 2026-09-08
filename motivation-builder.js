import {createDownloadFlow} from './student-download.js?v=1';
import {createNodePdfBlob} from './student-pdf.js?v=1';
import{downloadNodePdf,getArtifact,safeFilename,saveArtifact,waitForUser}from'./student-artifacts-a4.js?v=8';
import{certificateEvidence,readCertificate}from'./certificate-reader.js?v=5';
const $=id=>document.getElementById(id),clean=v=>String(v||'').trim(),split=v=>String(v||'').split(/\n+/).map(clean).filter(Boolean),esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fields=['artifactName','name','current','program','target','about','achievements','whyField','whyCountry','whyCity','whyProgram','whyCompany','relevantExperience','employerValue','future','lang','tone','wordTarget','template','manualText'];
const templates=[['academic','أكاديمي','تنسيق جامعي كلاسيكي'],['formal','رسمي','مظهر مؤسسي واضح'],['editorial','صحيفة','عنوان تحريري مميز'],['modern','حديث','خطوط ومسافات عصرية'],['executive','تنفيذي','قوي ومهني'],['minimal','Minimal','بسيط ونظيف'],['creative','إبداعي','لمسة مرئية حديثة'],['technical','تقني','مناسب للمسارات التقنية'],['serif','Serif','طابع مطبوع أنيق'],['clean','Clean','هوامش واسعة وهادئة']];
let certificates=[],mode='auto',purpose='study',groupId=crypto.randomUUID(),version=1,saving=false,lastSavedFingerprint='';const localKey='shadrat-motivation-v5';
const collect=()=>Object.fromEntries(fields.map(id=>[id,$(id)?.value||''])),fingerprint=d=>JSON.stringify({d,mode,purpose,certificates:certificates.map(c=>c.info||c.fileName)});
const status=(text,type='')=>{const el=$('builderStatus');if(el){el.textContent=text;el.className=`builder-status ${type}`.trim()}};
const words=s=>clean(s).split(/\s+/).filter(Boolean).length;
function buildPolishedCore(d,lang){
  const ar=lang==='ar',work=purpose==='work',personal=d.tone==='personal';
  const p=[ar?(work?'السادة فريق التوظيف المحترمون،':'السادة أعضاء لجنة القبول المحترمون،'):(work?'Dear Hiring Team,':'Dear Admissions Committee,')];
  p.push(ar?`${personal?'يسعدني التقدم':'أتقدم إليكم'} بطلب ${work?'العمل':'الالتحاق'} في ${d.program||'هذه الفرصة'}، في مجال ${d.target}.`:`${personal?'I am pleased to apply':'I am applying'} for ${d.program||'this opportunity'} in ${d.target}.`);
  [d.current,d.about].filter(Boolean).forEach(x=>p.push(sentence(x)));
  split(d.achievements).forEach(x=>p.push(sentence(x)));
  if(d.whyField)p.push(sentence(d.whyField));
  const reasons=work?[d.whyCompany,d.relevantExperience,d.employerValue]:[d.whyCountry,d.whyCity,d.whyProgram];
  reasons.filter(Boolean).forEach(x=>p.push(sentence(x)));
  certificates.filter(c=>c.info).forEach(c=>p.push(certificateEvidence(c.info,lang,{ownerName:d.name})));
  if(d.future)p.push(sentence(d.future));
  return p;
}
function sentence(value){const text=clean(value);return /[.!؟?]$/.test(text)?text:`${text}.`;}
function fit(parts,target,lang,name){
  // A word target cannot justify inventing experiences or padding with claims.
  const closing=lang==='ar'?`شكرًا لوقتكم والنظر في طلبي.\nمع خالص التقدير،\n${name}`:`Thank you for your time and consideration.\nSincerely,\n${name}`;
  return [...parts,closing];
}
function rewriteBrief(value,kind,lang){
  let text=clean(value); if(!text)return '';
  if(lang==='ar') text=text.replace(/^(?:انا|أنا)\s+/,'').replace(/^متخرج/,'خريج').replace(/^عندي\s+/,'لدي ').replace(/^خلصت\s+الثانوية/,'أكملت المرحلة الثانوية').replace(/^سويت\s+/,'أنجزت ').replace(/^(?:ابغى|أبغى)\s+/,'أرغب في ').replace(/(^|\s)الامن(?=\s|$)/g,'$1الأمن');
  return text;
}
function rewrittenData(d,lang){return{...d,current:rewriteBrief(d.current,'current',lang),about:rewriteBrief(d.about,'about',lang),whyField:rewriteBrief(d.whyField,'reason',lang),whyCountry:rewriteBrief(d.whyCountry,'reason',lang),whyCity:rewriteBrief(d.whyCity,'reason',lang),whyProgram:rewriteBrief(d.whyProgram,'reason',lang),whyCompany:rewriteBrief(d.whyCompany,'reason',lang),relevantExperience:rewriteBrief(d.relevantExperience,'about',lang),employerValue:rewriteBrief(d.employerValue,'value',lang),future:rewriteBrief(d.future,'future',lang)}}
function build(){const d=collect(),lang=d.lang==='ar'?'ar':'en';if(mode==='manual'){if(!clean(d.manualText))throw new Error('MANUAL');return split(d.manualText)}if(!clean(d.name)||!clean(d.target))throw new Error('REQUIRED');const refined=rewrittenData(d,lang);return fit(buildPolishedCore(refined,lang),Math.max(300,+d.wordTarget||750),lang,d.name)}
function update(parts=[]){const d=collect(),lang=d.lang==='ar'?'ar':'en',box=$('letterText');box.innerHTML='';(parts.length?parts:[lang==='ar'?'أدخل الاسم والتخصص ليظهر الخطاب هنا.':'Enter your name and target field to build the letter.']).forEach(x=>{const p=document.createElement('p');p.textContent=x;box.appendChild(p)});const letter=$('letter');letter.dir=lang==='ar'?'rtl':'ltr';letter.className=`letter letter-template-${d.template||'academic'}`;letter.dataset.multipage='true';$('letterTitle').textContent=lang==='ar'?(purpose==='study'?'خطاب دافع دراسي':'خطاب تقديم وظيفي'):(purpose==='study'?'Motivation Letter':'Cover Letter');$('letterMeta').textContent=[d.name,d.program,d.target].map(clean).filter(Boolean).join(' · ');const count=words(parts.join(' '));$('counter').textContent=count?`${count} ${lang==='ar'?'كلمة':'words'} · ${lang==='ar'?'نحو':'about'} ${Math.max(1,Math.ceil(count/450))} ${lang==='ar'?'صفحة':'page(s)'}`:'';document.querySelectorAll('[data-motivation-template]').forEach(b=>b.classList.toggle('is-active',b.dataset.motivationTemplate===d.template));window.ShadratFitA4Preview?.()}
function draft(){renderCertificates();try{if(mode==='manual')update(clean($('manualText').value)?split($('manualText').value):[]);else if(clean($('name').value)&&clean($('target').value))update(build());else update([])}catch{update([])}saveLocal()}
function generate({silent=false}={}){try{const p=build();update(p);saveLocal();if(!silent){const count=words(p.join(' ')),target=+collect().wordTarget||750;status(`تم تجهيز الخطاب في ${count} كلمة.${mode==='auto'&&count<target?' أضف تفاصيل حقيقية إذا كان التقديم يتطلب خطابًا أطول.':''}`,'success');}return p.join('\n\n')}catch(e){if(!silent)status(e.message==='MANUAL'?'اكتب نص الخطاب أولًا.':'اكتب الاسم والتخصص المستهدف على الأقل.','error');return''}}
function renderCertificates(){const box=$('certResults'),lang=$('lang').value==='ar'?'ar':'en';box.innerHTML=certificates.map((c,i)=>c.error?`<div class="cert-result error"><b>${esc(c.fileName)}</b><span>تعذر استخراج نص كافٍ.</span><button type="button" class="cert-remove" data-remove-cert="${i}">حذف</button></div>`:`<div class="cert-result"><b>${esc(c.info.course||c.info.title||c.fileName)}</b><span>${esc([c.info.issuer,c.info.date,c.sourcePage&&`صفحة ${c.sourcePage}`].filter(Boolean).join(' · '))}</span><small class="cert-evidence">${esc(certificateEvidence(c.info,lang))}</small><button type="button" class="cert-remove" data-remove-cert="${i}">حذف</button></div>`).join('');box.querySelectorAll('[data-remove-cert]').forEach(b=>b.onclick=()=>{certificates.splice(+b.dataset.removeCert,1);draft()})}
function setMode(v){mode=v==='manual'?'manual':'auto';document.querySelectorAll('[data-letter-mode]').forEach(b=>b.classList.toggle('is-active',b.dataset.letterMode===mode));$('autoFields').hidden=mode==='manual';$('manualFields').hidden=mode!=='manual';draft()}
function setPurpose(v){purpose=v==='work'?'work':'study';document.querySelectorAll('[data-letter-purpose]').forEach(b=>b.classList.toggle('is-active',b.dataset.letterPurpose===purpose));document.querySelectorAll('[data-study-field]').forEach(x=>x.hidden=purpose!=='study');document.querySelectorAll('[data-work-field]').forEach(x=>x.hidden=purpose!=='work');draft()}
function saveLocal(){try{localStorage.setItem(localKey,JSON.stringify({groupId,version,mode,purpose,data:collect(),certificates}))}catch{}}
async function readFiles(files){for(const f of[...files].slice(0,20)){status(`جاري قراءة ${f.name}…`);try{const r=await readCertificate(f,{onProgress:p=>status(`جاري قراءة ${f.name}… ${p}%`)});certificates.push(...(r.items||[r]));status(`تمت قراءة ${f.name} بالكامل واستخدام محتواها.`,'success')}catch(e){console.error(e);certificates.push({fileName:f.name,error:true});status(`تعذر قراءة ${f.name}. جرّب نسخة أوضح.`,'error')}draft()}$('certFiles').value=''}
async function saveCloud({silent=false}={}){if(saving)return null;const text=generate({silent:true});if(!text)return null;const d=collect(),user=await waitForUser();if(!user){if(!silent)status('سجّل الدخول ليُحفظ الخطاب.','error');return null}saving=true;try{const saved=await saveArtifact({artifactType:'motivation',artifactGroupId:groupId,artifactName:d.artifactName||'Motivation 1',studentName:d.name,specialization:d.target,program:d.program,template:d.template,language:d.lang,version,data:{...d,mode,purpose},renderedHtml:$('letter').outerHTML,renderedText:text,certificateSummaries:certificates.filter(c=>c.info).map(c=>c.info)});lastSavedFingerprint=fingerprint(d);version++;saveLocal();return saved}catch(e){console.error(e);return null}finally{saving=false}}
const downloadFlow = createDownloadFlow({button: $('downloadBtn'), status, shareButton: $('shareBtn'), controls: () => [...document.querySelectorAll('.builder-editor input,.builder-editor textarea,.builder-editor select,.builder-editor button')]});
async function download(){
  if (downloadFlow.busy) return;
  const data = collect();
  if (!generate()) return;
  window.ShadratPolishArabic?.();
  const key = fingerprint(data);
  const ok = await downloadFlow.run(key, async () => ({blob: await createNodePdfBlob($('letter')), name: `${safeFilename(data.name,'Student')}-${purpose==='study'?'Motivation-Letter':'Cover-Letter'}.pdf`}));
  if (ok) {
    const user = await waitForUser(1200);
    if (user && fingerprint(collect()) === key && key !== lastSavedFingerprint) void saveCloud({silent:true});
  }
}

async function load(){const box=$('templatePicker');box.innerHTML=templates.map(([id,l,d])=>`<button type="button" class="template-choice template-choice-letter-${id}" data-motivation-template="${id}"><b>${l}</b><small>${d}</small></button>`).join('');box.onclick=e=>{const b=e.target.closest('[data-motivation-template]');if(b){$('template').value=b.dataset.motivationTemplate;draft()}};document.querySelectorAll('[data-letter-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.letterMode));document.querySelectorAll('[data-letter-purpose]').forEach(b=>b.onclick=()=>setPurpose(b.dataset.letterPurpose));let saved=null;const id=new URLSearchParams(location.search).get('artifact');if(id)try{const a=await getArtifact(id);if(a?.artifactType==='motivation')saved={groupId:a.artifactGroupId,version:+a.version+1,mode:a.data?.mode,purpose:a.data?.purpose,data:a.data,certificates:(a.certificateSummaries||[]).map(info=>({fileName:info.fileName||'',info}))}}catch(e){console.warn(e)}if(!saved)try{saved=JSON.parse(localStorage.getItem(localKey)||'null')}catch{}if(saved?.data){groupId=saved.groupId||groupId;version=saved.version||version;mode=saved.mode||'auto';purpose=saved.purpose||'study';certificates=saved.certificates||[];fields.forEach(id=>{if($(id)&&saved.data[id]!=null)$(id).value=saved.data[id]})}else{const user=await waitForUser(700);if(user)$('name').value=user.displayName||''}setPurpose(purpose);setMode(mode)}
fields.forEach(id=>$(id)?.addEventListener('input',draft));$('certFiles')?.addEventListener('change',e=>readFiles(e.target.files));$('generateBtn')?.addEventListener('click',()=>generate());$('downloadBtn')?.addEventListener('click',download);$('copyBtn')?.addEventListener('click',async()=>{const t=generate({silent:true});if(t)try{await navigator.clipboard.writeText(t);status('تم نسخ نص الخطاب.','success')}catch{status('تعذر النسخ.','error')}});load();
