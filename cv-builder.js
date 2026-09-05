import{downloadNodePdf,getArtifact,safeFilename,saveArtifact,waitForUser}from'./student-artifacts-a4.js?v=3';
import{compactCertificate,describeCertificate,readCertificate,skillLabels}from'./certificate-reader.js?v=1';

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
let certificates=[],groupId=crypto.randomUUID(),version=1,lastSavedFingerprint='',saving=false;
const localKey='shadrat-cv-v3';
const clean=v=>String(v||'').trim();
const lines=v=>String(v||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
const fingerprint=data=>JSON.stringify({data,certificates:certificates.map(c=>c.info||{fileName:c.fileName,error:true})});
const status=(text,type='')=>{const el=$('builderStatus');if(!el)return;el.textContent=text;el.className=`builder-status ${type}`.trim()};
const escapeHtml=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function collect(){return Object.fromEntries(fieldIds.map(id=>[id,$(id)?.value||'']))}
function fillList(id,items){const ul=$(id);ul.innerHTML='';items.filter(Boolean).forEach(text=>{const li=document.createElement('li');li.textContent=text;ul.appendChild(li)})}
function extractedSkills(lang){return[...new Set(certificates.flatMap(c=>c.info?skillLabels(c.info,lang):[]))]}
function autoSummary(data){if(clean(data.summary))return clean(data.summary);const lang=data.lang==='ar'?'ar':'en',role=clean(data.role),skills=extractedSkills(lang).slice(0,5);if(lang==='ar'){
  if(role&&skills.length)return`طالب يركز على ${role}، وتوثق الشهادات المرفقة تعلّمًا منظّمًا في موضوعات تشمل ${skills.join('، ')}. يهدف إلى تطوير هذا المسار أكاديميًا وعمليًا والاستفادة من المعرفة الموثقة في فرص الدراسة والتطوير القادمة.`;
  if(role)return`طالب مهتم بمسار ${role} ويسعى إلى بناء ملف أكاديمي ومهني منظم يعرض تعليمه وشهاداته ومهاراته بصورة واضحة ومباشرة.`;
  if(skills.length)return`يعرض هذا الملف شهادات مرتبطة بموضوعات تشمل ${skills.join('، ')}، مع توثيق الجهة والبرنامج أو المجال المستخرج من الملفات المرفقة.`;
  return'أضف التخصص أو ارفع شهادة ليُنشئ الموقع نبذة تلقائية من المعلومات المتوفرة.';
 }
 if(role&&skills.length)return`Student focused on ${role}, with uploaded certificates documenting structured learning in areas including ${skills.join(', ')}. The profile is organized to present this academic and professional preparation clearly for future study and development opportunities.`;
 if(role)return`Student focused on ${role}, building a clear academic and professional profile that presents education, certificates, skills, and relevant experience in a structured way.`;
 if(skills.length)return`This profile includes certificates connected to ${skills.join(', ')}, with extracted issuer, course, and subject information presented as documented achievements.`;
 return'Add a target field or upload a certificate to generate a profile from the available information.';
}
function renderCertificates(){const box=$('cvCertResults');if(!box)return;if(!certificates.length){box.innerHTML='';return}const lang=$('lang').value==='ar'?'ar':'en';box.innerHTML=certificates.map((c,i)=>c.error?`<div class="cert-result error"><b>${escapeHtml(c.fileName)}</b><span>تعذر قراءة بيانات كافية من الملف.</span><button type="button" class="cert-remove" data-remove-cert="${i}">حذف</button></div>`:`<div class="cert-result"><b>${escapeHtml(c.info.course||c.info.title||c.fileName)}</b><span>${escapeHtml([c.info.issuer,c.info.date].filter(Boolean).join(' · ')||'تم استخراج بيانات الشهادة')}</span><small>${escapeHtml(compactCertificate(c.info,lang))}</small><button type="button" class="cert-remove" data-remove-cert="${i}">حذف</button></div>`).join('');box.querySelectorAll('[data-remove-cert]').forEach(btn=>btn.onclick=()=>{certificates.splice(Number(btn.dataset.removeCert),1);render();saveLocal()})}
function render(){
  const data=collect(),lang=data.lang==='ar'?'ar':'en';
  $('pName').textContent=clean(data.name)||(lang==='ar'?'اسم الطالب':'Student Name');
  $('pRole').textContent=clean(data.role)||(lang==='ar'?'التخصص / الهدف':'Target / Field');
  $('pSummary').textContent=autoSummary(data);
  fillList('pEducation',lines(data.education));
  const manualCerts=lines(data.certs),autoCerts=certificates.filter(c=>!c.error&&c.info).map(c=>describeCertificate(c.info,lang,{kind:'cv',target:data.role}));
  fillList('pCerts',[...manualCerts,...autoCerts]);
  fillList('pExperience',lines(data.experience));
  const manualSkills=lines(String(data.skills).replace(/[،,|•]+/g,'\n')),autoSkills=extractedSkills(lang);$('pSkills').textContent=[...new Set([...manualSkills,...autoSkills])].join(' • ')||'—';
  $('pLanguages').textContent=clean(data.languages)||'—';
  $('pContact').textContent=[data.email,data.phone,data.location,data.link].map(clean).filter(Boolean).join(' • ')||(lang==='ar'?'بيانات التواصل':'Contact details');
  $('cv').className=`cv template-${data.template||'formal'}`;$('cv').dir=lang==='ar'?'rtl':'ltr';
  const ar={summary:'النبذة',education:'التعليم',certs:'الشهادات والإنجازات',experience:'المشاريع والخبرات',skills:'المهارات',languages:'اللغات'},en={summary:'PROFILE',education:'EDUCATION',certs:'CERTIFICATES & ACHIEVEMENTS',experience:'PROJECTS & EXPERIENCE',skills:'SKILLS',languages:'LANGUAGES'},map=lang==='ar'?ar:en;
  document.querySelectorAll('#cv [data-key]').forEach(el=>el.textContent=map[el.dataset.key]);
  document.querySelectorAll('[data-cv-template]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.cvTemplate===data.template));renderCertificates();saveLocal();
}
function saveLocal(){try{localStorage.setItem(localKey,JSON.stringify({groupId,version,data:collect(),certificates}))}catch{}}
function applyData(data={}){fieldIds.forEach(id=>{if($(id)&&data[id]!=null)$(id).value=data[id]});render()}
function setupTemplates(){const box=$('templatePicker');if(!box)return;box.innerHTML=templates.map(t=>`<button type="button" class="template-choice template-choice-${t.id}" data-cv-template="${t.id}"><b>${t.label}</b><small>${t.desc}</small></button>`).join('');box.addEventListener('click',e=>{const btn=e.target.closest('[data-cv-template]');if(!btn)return;$('template').value=btn.dataset.cvTemplate;render()})}
async function readCertificates(files){const chosen=[...files].slice(0,12);if(!chosen.length)return;for(const file of chosen){status(`جاري قراءة ${file.name}… 0%`);try{const result=await readCertificate(file,{onProgress:p=>status(`جاري قراءة ${file.name}… ${p}%`)});certificates.push(result);status(`تم استخراج بيانات ${file.name}.`,'success')}catch(error){console.error(error);certificates.push({fileName:file.name,error:true});status(`تعذر استخراج بيانات موثوقة من ${file.name}.`,'error')}render()}$('cvCertFiles').value='';saveLocal()}
async function cloudSave({silent=false}={}){
  if(saving)return null;const data=collect();if(!clean(data.name)){if(!silent)status('اكتب اسم الطالب قبل الحفظ.','error');return null}if(!clean(data.artifactName))data.artifactName='CV 1';const user=await waitForUser();if(!user){if(!silent)status('سجّل الدخول أولًا ليُحفظ الـCV في حسابك.','error');return null}
  saving=true;const button=$('saveBtn'),old=button?.textContent;if(button&&!silent){button.disabled=true;button.textContent='جاري الحفظ…'}if(!silent)status('جارٍ حفظ الـCV في حسابك…');
  try{const saved=await saveArtifact({artifactType:'cv',artifactGroupId:groupId,artifactName:data.artifactName,studentName:data.name,specialization:data.role,template:data.template,language:data.lang,version,data:{...data,certificates:certificates.map(c=>c.error?{fileName:c.fileName,error:true}:c.info)},renderedHtml:$('cv').outerHTML,certificateSummaries:certificates.filter(c=>!c.error&&c.info).map(c=>c.info)});lastSavedFingerprint=fingerprint(data);version+=1;saveLocal();if(!silent)status(`تم حفظ «${data.artifactName}» ويمكن الرجوع إليه من حسابك.`,'success');return saved}catch(error){console.error(error);if(!silent)status(error?.code==='login-required'?'سجّل الدخول أولًا ليُحفظ الـCV.':'تعذر الحفظ الآن.','error');return null}finally{saving=false;if(button&&!silent){button.disabled=false;button.textContent=old||'حفظ في حسابي'}}
}
async function download(){const data=collect();if(!clean(data.name)){status('اكتب اسم الطالب قبل التنزيل.','error');return}const btn=$('downloadBtn'),old=btn.textContent;btn.disabled=true;btn.textContent='جاري تجهيز PDF…';try{const user=await waitForUser(1200);if(user&&fingerprint(data)!==lastSavedFingerprint)await cloudSave({silent:true});await downloadNodePdf($('cv'),`${safeFilename(data.name,'Student')}-CV.pdf`);status('تم تجهيز ملف PDF من نفس صفحة A4 الظاهرة في المعاينة.','success')}catch(error){console.error(error);status('تعذر تجهيز PDF على هذا المتصفح. أعد المحاولة.','error')}finally{btn.disabled=false;btn.textContent=old}}
async function loadInitial(){setupTemplates();const params=new URLSearchParams(location.search),artifactId=params.get('artifact');if(artifactId){try{const artifact=await getArtifact(artifactId);if(artifact?.artifactType==='cv'){groupId=artifact.artifactGroupId||crypto.randomUUID();version=Number(artifact.version||1)+1;certificates=(artifact.certificateSummaries||artifact.data?.certificates||[]).map(info=>info?.error?info:{fileName:info.fileName||'',info});applyData(artifact.data||{});$('artifactName').value=artifact.artifactName||$('artifactName').value;render();lastSavedFingerprint=fingerprint(collect());status('تم تحميل النسخة المحفوظة. الحفظ القادم سيُنشئ نسخة جديدة.','success');return}}catch(error){console.warn(error)}}
  try{const saved=JSON.parse(localStorage.getItem(localKey)||'null');if(saved?.data){groupId=saved.groupId||groupId;version=Number(saved.version||1);certificates=saved.certificates||[];applyData(saved.data);return}}catch{}
  const user=await waitForUser(900);if(user){if(!$('name').value)$('name').value=user.displayName||'';if(!$('email').value)$('email').value=user.email||''}$('template').value=$('template').value||'formal';render()}
fieldIds.forEach(id=>$(id)?.addEventListener('input',render));$('cvCertFiles')?.addEventListener('change',e=>readCertificates(e.target.files));
$('saveBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();cloudSave()});$('downloadBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();download()});
$('clearBtn')?.addEventListener('click',()=>{if(!confirm('مسح المسودة الحالية من الجهاز؟'))return;fieldIds.forEach(id=>{if($(id))$(id).value=''});$('artifactName').value='CV 1';$('template').value='formal';$('lang').value='en';certificates=[];groupId=crypto.randomUUID();version=1;lastSavedFingerprint='';localStorage.removeItem(localKey);render();status('تم مسح المسودة المحلية.')});
loadInitial();
