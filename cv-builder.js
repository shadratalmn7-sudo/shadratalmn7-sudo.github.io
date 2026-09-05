import{downloadNodePdf,getArtifact,safeFilename,saveArtifact,waitForUser}from'./student-artifacts-a4.js?v=5';
import{compactCertificate,extractCertificateInfo,readCertificate,skillLabels}from'./certificate-reader.js?v=2';
import{buildSemanticCv}from'./cv-semantic-polish.js?v=4';

const $=id=>document.getElementById(id);
const fieldIds=['artifactName','name','role','email','phone','location','link','summary','education','certs','experience','skills','languages','template','lang'];
const templates=[
  {id:'formal',label:'رسمي',desc:'هادئ ومناسب للمنح'},
  {id:'editorial',label:'صحيفة',desc:'Editorial بعمودين'},
  {id:'modern',label:'حديث',desc:'هيدر قوي ومساحات واضحة'},
  {id:'sidebar',label:'جانبي',desc:'معلومات جانبية ومحتوى رئيسي'},
  {id:'academic',label:'أكاديمي',desc:'جامعي كلاسيكي'},
  {id:'creative',label:'إبداعي',desc:'بطاقات ولمسات مرئية'},
  {id:'technical',label:'تقني',desc:'مظهر برمجي منظم'},
  {id:'executive',label:'تنفيذي',desc:'رسمي داكن ومميز'},
  {id:'timeline',label:'Timeline',desc:'أقسام على خط زمني'},
  {id:'minimal',label:'Minimal',desc:'أبيض وبسيط جدًا'}
];
let certificates=[],groupId=crypto.randomUUID(),version=1,lastSavedFingerprint='',saving=false,fitTimer=0;
const localKey='shadrat-cv-v4';
const clean=v=>String(v||'').trim();
const lines=v=>String(v||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
const splitSkills=v=>String(v||'').split(/[،,|•\n]+/).map(x=>x.trim()).filter(Boolean);
const fingerprint=data=>JSON.stringify({data,certificates:certificates.map(c=>c.info||{fileName:c.fileName,error:true})});
const status=(text,type='')=>{const el=$('builderStatus');if(!el)return;el.textContent=text;el.className=`builder-status ${type}`.trim()};
const escapeHtml=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function collect(){return Object.fromEntries(fieldIds.map(id=>[id,$(id)?.value||'']))}
function fillList(id,items){const ul=$(id);if(!ul)return;ul.innerHTML='';items.filter(Boolean).forEach(text=>{const li=document.createElement('li');li.textContent=text;ul.appendChild(li)})}
function extractedSkills(lang){return[...new Set(certificates.flatMap(c=>c.info?skillLabels(c.info,lang):[]))]}
function allSkills(data,lang){return[...new Set([...splitSkills(data.skills),...extractedSkills(lang)])]}
function manualCertificateLine(entry,lang){const info=extractCertificateInfo(entry,entry);if(info){const compact=compactCertificate(info,lang);if(compact)return compact}return lang==='ar'?'إنجاز أو شهادة موثقة أضيفت يدويًا':'Documented certificate or achievement added manually'}
function uploadedCertificateLine(info,lang){const compact=compactCertificate(info,lang);return compact||(lang==='ar'?'شهادة موثقة':'Documented certificate')}
function certificateItems(data,lang){const manual=lines(data.certs).map(x=>manualCertificateLine(x,lang)),automatic=certificates.filter(c=>!c.error&&c.info).map(c=>uploadedCertificateLine(c.info,lang));return[...manual,...automatic].filter(Boolean)}
function sectionFor(id){return $(id)?.closest('section')||null}
function toggleSection(id,show){const section=sectionFor(id);if(section)section.hidden=!show}
function renderCertificates(){
  const box=$('cvCertResults');if(!box)return;if(!certificates.length){box.innerHTML='';return}
  const lang=$('lang').value==='ar'?'ar':'en';
  box.innerHTML=certificates.map((c,i)=>c.error?`<div class="cert-result error"><b>${escapeHtml(c.fileName)}</b><span>تعذر قراءة بيانات كافية من هذا الجزء.</span><button type="button" class="cert-remove" data-remove-cert="${i}">حذف</button></div>`:`<div class="cert-result"><b>${escapeHtml(c.info.course||c.info.title||c.fileName)}</b><span>${escapeHtml([c.info.issuer,c.info.date,c.sourcePage?`صفحة ${c.sourcePage}`:''].filter(Boolean).join(' · ')||'تم استخراج بيانات الشهادة')}</span><small>${escapeHtml(compactCertificate(c.info,lang))}</small><button type="button" class="cert-remove" data-remove-cert="${i}">حذف</button></div>`).join('');
  box.querySelectorAll('[data-remove-cert]').forEach(btn=>btn.onclick=()=>{certificates.splice(Number(btn.dataset.removeCert),1);render();saveLocal()})
}
function scheduleFit(){clearTimeout(fitTimer);fitTimer=setTimeout(()=>{
  const cv=$('cv');if(!cv)return;cv.classList.remove('cv-overpacked','cv-ultra-dense');
  requestAnimationFrame(()=>{if(cv.scrollHeight>cv.clientHeight+3){cv.classList.add('cv-overpacked');requestAnimationFrame(()=>{if(cv.scrollHeight>cv.clientHeight+3)cv.classList.add('cv-ultra-dense')})}})
},30)}
function render(){
  const data=collect(),lang=data.lang==='ar'?'ar':'en',rawSkills=allSkills(data,lang),certItems=certificateItems(data,lang),semantic=buildSemanticCv(data,{certificateCount:certItems.length,skills:rawSkills}),skills=semantic.skills||rawSkills;
  $('pName').textContent=clean(data.name)||(lang==='ar'?'الاسم الكامل':'Full Name');
  $('pRole').textContent=semantic.headline;
  $('pSummary').textContent=semantic.summary;
  fillList('pEducation',semantic.education);
  fillList('pCerts',certItems);
  fillList('pExperience',semantic.experience);
  $('pSkills').textContent=skills.join(' • ');
  $('pLanguages').textContent=semantic.languages||'';
  $('pContact').textContent=[data.email,data.phone,data.location,data.link].map(clean).filter(Boolean).join(' • ')||(lang==='ar'?'بيانات التواصل':'Contact details');
  toggleSection('pSummary',!!clean(semantic.summary));toggleSection('pEducation',semantic.education.length>0);toggleSection('pCerts',certItems.length>0);toggleSection('pExperience',semantic.experience.length>0);toggleSection('pSkills',skills.length>0);toggleSection('pLanguages',!!clean(semantic.languages));
  const factCount=semantic.education.length+certItems.length+semantic.experience.length+skills.length+(semantic.languages?1:0)+(semantic.summary?1:0),textLoad=[semantic.summary,...semantic.education,...certItems,...semantic.experience,...skills,semantic.languages].join(' ').length,density=factCount>20||textLoad>3900?'dense':factCount>12||textLoad>2500?'medium':'sparse';
  $('cv').className=`cv template-${data.template||'formal'} cv-one-page-full cv-${density} cv-semantic-rewrite`;$('cv').dir=lang==='ar'?'rtl':'ltr';$('cv').dataset.factCount=String(factCount);
  const ar={summary:'النبذة المهنية',education:'الخلفية التعليمية',certs:'الشهادات والإنجازات',experience:semantic.experienceTitle||'التطوير الأكاديمي والاستعداد',skills:'مجالات المعرفة والمهارات',languages:'اللغات'},en={summary:'PROFESSIONAL PROFILE',education:'EDUCATIONAL BACKGROUND',certs:'CERTIFICATES & ACHIEVEMENTS',experience:semantic.experienceTitle||'ACADEMIC DEVELOPMENT & READINESS',skills:'KNOWLEDGE & SKILLS',languages:'LANGUAGES'},map=lang==='ar'?ar:en;
  document.querySelectorAll('#cv [data-key]').forEach(el=>el.textContent=map[el.dataset.key]);
  document.querySelectorAll('[data-cv-template]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.cvTemplate===data.template));
  renderCertificates();saveLocal();scheduleFit();
}
function saveLocal(){try{localStorage.setItem(localKey,JSON.stringify({groupId,version,data:collect(),certificates}))}catch{}}
function applyData(data={}){fieldIds.forEach(id=>{if($(id)&&data[id]!=null)$(id).value=data[id]});render()}
function setupTemplates(){const box=$('templatePicker');if(!box)return;box.innerHTML=templates.map(t=>`<button type="button" class="template-choice template-choice-${t.id}" data-cv-template="${t.id}"><b>${t.label}</b><small>${t.desc}</small></button>`).join('');box.addEventListener('click',e=>{const btn=e.target.closest('[data-cv-template]');if(!btn)return;$('template').value=btn.dataset.cvTemplate;render()})}
async function readCertificates(files){
  const chosen=[...files].slice(0,12);if(!chosen.length)return;
  for(const file of chosen){status(`جاري قراءة ${file.name}… 0%`);try{const result=await readCertificate(file,{onProgress:(p,_stage,meta)=>status(`جاري قراءة ${file.name}… ${p}%${meta?.total>1?` — صفحة ${meta.page||1}/${meta.total}`:''}`)}),items=result.items?.length?result.items:[result];certificates.push(...items);status(`تم استخراج ${items.length} ${items.length===1?'شهادة/صفحة موثوقة':'شهادة/صفحة موثوقة'} من ${file.name}.`,'success')}catch(error){console.error(error);certificates.push({fileName:file.name,error:true});status(`تعذر استخراج بيانات موثوقة من ${file.name}.`,'error')}render()}
  $('cvCertFiles').value='';saveLocal()
}
async function cloudSave({silent=false}={}){
  if(saving)return null;const data=collect();if(!clean(data.name)){if(!silent)status('اكتب اسم الطالب قبل الحفظ.','error');return null}if(!clean(data.artifactName))data.artifactName='CV 1';const user=await waitForUser();if(!user){if(!silent)status('سجّل الدخول ليُحفظ الـCV في ملفك الخاص.','error');return null}
  render();saving=true;if(!silent)status('جارٍ حفظ الـCV في ملفك الخاص…');
  try{const saved=await saveArtifact({artifactType:'cv',artifactGroupId:groupId,artifactName:data.artifactName,studentName:data.name,specialization:data.role,template:data.template,language:data.lang,version,data:{...data,certificates:certificates.map(c=>c.error?{fileName:c.fileName,error:true}:{...c.info,sourcePage:c.sourcePage||null})},renderedHtml:$('cv').outerHTML,certificateSummaries:certificates.filter(c=>!c.error&&c.info).map(c=>({...c.info,sourcePage:c.sourcePage||null}))});lastSavedFingerprint=fingerprint(data);version+=1;saveLocal();if(!silent)status(`تم حفظ «${data.artifactName}» في ملفك الخاص.`,'success');return saved}catch(error){console.error(error);if(!silent)status('تعذر حفظ النسخة في حسابك الآن.','error');return null}finally{saving=false}
}
async function download(){
  const data=collect();if(!clean(data.name)){status('اكتب اسم الطالب قبل التنزيل.','error');return}render();const btn=$('downloadBtn'),old=btn.textContent;btn.disabled=true;btn.textContent='جاري تجهيز PDF…';
  try{await new Promise(r=>setTimeout(r,120));const user=await waitForUser(1200);let savedToAccount=false;if(user){if(fingerprint(data)===lastSavedFingerprint)savedToAccount=true;else savedToAccount=!!(await cloudSave({silent:true}))}render();await new Promise(r=>setTimeout(r,100));await downloadNodePdf($('cv'),`${safeFilename(data.name,'Student')}-CV.pdf`);status(savedToAccount?'تم تنزيل صفحة A4 وحفظ نسخة في ملفك الخاص.':user?'تم تنزيل الـPDF، لكن تعذر حفظ نسخة في حسابك الآن.':'تم تنزيل صفحة A4. سجّل الدخول ليُحفظ تلقائيًا في ملفك الخاص.','success')}catch(error){console.error(error);status('تعذر تجهيز PDF الآن. جرّب مرة أخرى.','error')}finally{btn.disabled=false;btn.textContent=old}
}
async function loadInitial(){
  setupTemplates();const params=new URLSearchParams(location.search),artifactId=params.get('artifact');
  if(artifactId){try{const artifact=await getArtifact(artifactId);if(artifact?.artifactType==='cv'){groupId=artifact.artifactGroupId||crypto.randomUUID();version=Number(artifact.version||1)+1;certificates=(artifact.certificateSummaries||artifact.data?.certificates||[]).map(info=>info?.error?info:{fileName:info.fileName||'',sourcePage:info.sourcePage||null,info});applyData(artifact.data||{});$('artifactName').value=artifact.artifactName||$('artifactName').value;render();lastSavedFingerprint=fingerprint(collect());status('تم تحميل النسخة المحفوظة. عند التنزيل سيُحدّث ملفك تلقائيًا.','success');return}}catch(error){console.warn(error)}}
  try{const saved=JSON.parse(localStorage.getItem(localKey)||'null');if(saved?.data){groupId=saved.groupId||groupId;version=Number(saved.version||1);certificates=saved.certificates||[];applyData(saved.data);return}}catch{}
  const user=await waitForUser(900);if(user){if(!$('name').value)$('name').value=user.displayName||'';if(!$('email').value)$('email').value=user.email||''}$('template').value=$('template').value||'formal';render()
}
fieldIds.forEach(id=>$(id)?.addEventListener('input',render));$('cvCertFiles')?.addEventListener('change',e=>readCertificates(e.target.files));
$('downloadBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();download()});
$('clearBtn')?.addEventListener('click',()=>{if(!confirm('مسح المسودة الحالية من الجهاز؟'))return;fieldIds.forEach(id=>{if($(id))$(id).value=''});$('artifactName').value='CV 1';$('template').value='formal';$('lang').value='en';certificates=[];groupId=crypto.randomUUID();version=1;lastSavedFingerprint='';localStorage.removeItem(localKey);render();status('تم مسح المسودة المحلية.')});
loadInitial();
