import{downloadNodePdf,getArtifact,safeFilename,saveArtifact,waitForUser}from'./student-artifacts-a4.js?v=5';
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
const splitSkills=v=>String(v||'').split(/[،,|•\n]+/).map(x=>x.trim()).filter(Boolean);
const fingerprint=data=>JSON.stringify({data,certificates:certificates.map(c=>c.info||{fileName:c.fileName,error:true})});
const status=(text,type='')=>{const el=$('builderStatus');if(!el)return;el.textContent=text;el.className=`builder-status ${type}`.trim()};
const escapeHtml=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function collect(){return Object.fromEntries(fieldIds.map(id=>[id,$(id)?.value||'']))}
function fillList(id,items){const ul=$(id);ul.innerHTML='';items.filter(Boolean).forEach(text=>{const li=document.createElement('li');li.textContent=text;ul.appendChild(li)})}
function extractedSkills(lang){return[...new Set(certificates.flatMap(c=>c.info?skillLabels(c.info,lang):[]))]}
function allSkills(data,lang){return[...new Set([...splitSkills(data.skills),...extractedSkills(lang)])].slice(0,10)}
function autoSummary(data){
  const lang=data.lang==='ar'?'ar':'en',role=clean(data.role),manual=clean(data.summary),skills=allSkills(data,lang),education=lines(data.education),experience=lines(data.experience),certCount=certificates.filter(c=>!c.error&&c.info).length+lines(data.certs).length;
  const parts=[];
  if(manual)parts.push(manual);
  if(lang==='ar'){
    if(role)parts.push(`يركز هذا الملف على بناء مسار أكاديمي ومهني واضح في ${role}، مع تنظيم المعلومات المتوفرة بحيث يظهر الهدف الحالي ومجالات التطوير بصورة مترابطة بدل عرضها كعناصر منفصلة.`);
    else if(!manual)parts.push('يعرض هذا الملف الخلفية التعليمية والمهارات والإنجازات المتوفرة بصورة منظمة تساعد على تقديم صورة واضحة ومهنية للفرص الدراسية والتطويرية.');
    if(skills.length)parts.push(`وتشمل مجالات التركيز المذكورة في الملف: ${skills.slice(0,6).join('، ')}. ويُبرزها هذا الـCV باعتبارها مجالات تعلم وتطوير مرتبطة بالمسار المستهدف، دون إضافة مهارة لم يذكرها صاحب الملف أو لم تظهر في شهادة مرفوعة.`);
    if(education.length)parts.push('وتدعم الخلفية التعليمية المدخلة هذا الاتجاه وتوضح الأساس الذي يمكن البناء عليه في المرحلة الدراسية أو المهنية القادمة.');
    if(certCount)parts.push(`كما يتضمن الملف ${certCount===1?'إنجازًا أو شهادة موثقة':'مجموعة من الإنجازات أو الشهادات الموثقة'} تم ترتيبها لتوضيح مسار التعلم المستمر وما يرتبط به من موضوعات.`);
    if(experience.length)parts.push('وتكمل الخبرات أو الأنشطة المذكورة الصورة بإظهار الجوانب التطبيقية التي اختار صاحب السيرة إبرازها.');
  }else{
    if(role)parts.push(`This CV is organized around a clear academic and professional direction in ${role}, connecting the available information so the current objective and development areas are easy to understand rather than appearing as isolated entries.`);
    else if(!manual)parts.push('This CV organizes the available education, skills, achievements, and experience into a clear professional profile suitable for academic and development opportunities.');
    if(skills.length)parts.push(`The profile highlights ${skills.slice(0,6).join(', ')} as documented or user-provided areas of learning and development, without adding skills that were not entered or identified in an uploaded certificate.`);
    if(education.length)parts.push('The listed educational background provides a foundation for the next stage of study, training, and professional development.');
    if(certCount)parts.push(`The profile also includes ${certCount===1?'a documented certificate or achievement':'documented certificates and achievements'} presented as evidence of continued learning and preparation.`);
    if(experience.length)parts.push('The listed projects, activities, or experience add practical context to the academic profile and show the areas the applicant chose to emphasize.');
  }
  return parts.join(' ');
}
function educationItems(data){
  const lang=data.lang==='ar'?'ar':'en',items=lines(data.education),role=clean(data.role);
  if(role)items.push(lang==='ar'?`الاتجاه الأكاديمي: الاستفادة من الخلفية التعليمية الحالية والاستعداد لمزيد من الدراسة والتطور في ${role}.`:`Academic direction: building on the current educational background and preparing for further study and development in ${role}.`);
  else if(items.length)items.push(lang==='ar'?'تم تنظيم الخلفية التعليمية أعلاه لإظهار التسلسل الأكاديمي بصورة مختصرة وواضحة.':'The educational background above is organized to present the academic progression clearly and concisely.');
  return items;
}
function certificateItems(data,lang){
  const manual=lines(data.certs),automatic=certificates.filter(c=>!c.error&&c.info).map(c=>describeCertificate(c.info,lang,{kind:'cv',target:data.role})),items=[...manual,...automatic];
  if(items.length)items.push(lang==='ar'?'توضح العناصر المذكورة مسارًا موثقًا للتعلم والتقدم، مع الحفاظ على أسماء الشهادات والجهات كما أدخلها المستخدم أو كما استُخرجت من الملفات.':'These items document continued learning and progress while preserving certificate titles and issuers as entered by the user or extracted from uploaded files.');
  return items;
}
function experienceItems(data){
  const lang=data.lang==='ar'?'ar':'en',items=lines(data.experience),role=clean(data.role),skills=allSkills(data,lang);
  if(items.length)items.push(lang==='ar'?'توضح العناصر أعلاه مجالات التطبيق والخبرة أو الأنشطة التي اختار صاحب السيرة إبرازها ضمن هذا الملف.':'The items above summarize the practical, project, or activity experience selected for this profile.');
  else if(role)items.push(lang==='ar'?`هدف التطوير: البحث عن فرص أكاديمية أو تطبيقية تسمح بتوسيع المعرفة واكتساب خبرة عملية مرتبطة بـ ${role}.`:`Development objective: seeking academic or practical opportunities to deepen knowledge and build experience related to ${role}.`);
  else if(skills.length)items.push(lang==='ar'?`هدف التطوير: تحويل مجالات التعلم المذكورة، ومنها ${skills.slice(0,4).join('، ')}، إلى خبرة تطبيقية من خلال مشاريع أو تدريب أو دراسة منظمة.`:`Development objective: turning the listed learning areas, including ${skills.slice(0,4).join(', ')}, into practical experience through projects, training, or structured study.`);
  return items;
}
function skillsText(data,lang){
  const skills=allSkills(data,lang),role=clean(data.role);
  if(skills.length)return lang==='ar'?`${skills.join(' • ')}\nتم جمع هذه المهارات من المعلومات التي أدخلها المستخدم ومن المجالات التي ظهرت في الشهادات المرفوعة فقط.`:`${skills.join(' • ')}\nThese skills come only from information entered by the user and subjects identified in uploaded certificates.`;
  if(role)return lang==='ar'?`مجال التركيز الحالي: ${role}. ويُستحسن إضافة المهارات الفعلية المرتبطة بهذا المسار لإظهار الملف بصورة أدق.`:`Current focus: ${role}. Add the actual skills connected to this path to make the profile more specific.`;
  return'—';
}
function renderCertificates(){const box=$('cvCertResults');if(!box)return;if(!certificates.length){box.innerHTML='';return}const lang=$('lang').value==='ar'?'ar':'en';box.innerHTML=certificates.map((c,i)=>c.error?`<div class="cert-result error"><b>${escapeHtml(c.fileName)}</b><span>تعذر قراءة بيانات كافية من الملف.</span><button type="button" class="cert-remove" data-remove-cert="${i}">حذف</button></div>`:`<div class="cert-result"><b>${escapeHtml(c.info.course||c.info.title||c.fileName)}</b><span>${escapeHtml([c.info.issuer,c.info.date].filter(Boolean).join(' · ')||'تم استخراج بيانات الشهادة')}</span><small>${escapeHtml(compactCertificate(c.info,lang))}</small><button type="button" class="cert-remove" data-remove-cert="${i}">حذف</button></div>`).join('');box.querySelectorAll('[data-remove-cert]').forEach(btn=>btn.onclick=()=>{certificates.splice(Number(btn.dataset.removeCert),1);render();saveLocal()})}
function render(){
  const data=collect(),lang=data.lang==='ar'?'ar':'en';
  $('pName').textContent=clean(data.name)||(lang==='ar'?'اسم الطالب':'Student Name');
  $('pRole').textContent=clean(data.role)||(lang==='ar'?'التخصص / الهدف':'Target / Field');
  $('pSummary').textContent=autoSummary(data);
  fillList('pEducation',educationItems(data));
  fillList('pCerts',certificateItems(data,lang));
  fillList('pExperience',experienceItems(data));
  $('pSkills').textContent=skillsText(data,lang);
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
  if(saving)return null;const data=collect();if(!clean(data.name)){if(!silent)status('اكتب اسم الطالب قبل الحفظ.','error');return null}if(!clean(data.artifactName))data.artifactName='CV 1';const user=await waitForUser();if(!user){if(!silent)status('سجّل الدخول ليُحفظ الـCV في ملفك الخاص.','error');return null}
  saving=true;if(!silent)status('جارٍ حفظ الـCV في ملفك الخاص…');
  try{const saved=await saveArtifact({artifactType:'cv',artifactGroupId:groupId,artifactName:data.artifactName,studentName:data.name,specialization:data.role,template:data.template,language:data.lang,version,data:{...data,certificates:certificates.map(c=>c.error?{fileName:c.fileName,error:true}:c.info)},renderedHtml:$('cv').outerHTML,certificateSummaries:certificates.filter(c=>!c.error&&c.info).map(c=>c.info)});lastSavedFingerprint=fingerprint(data);version+=1;saveLocal();if(!silent)status(`تم حفظ «${data.artifactName}» في ملفك الخاص.`,'success');return saved}catch(error){console.error(error);if(!silent)status('تعذر حفظ النسخة في حسابك الآن.','error');return null}finally{saving=false}
}
async function download(){
  const data=collect();if(!clean(data.name)){status('اكتب اسم الطالب قبل التنزيل.','error');return}render();const btn=$('downloadBtn'),old=btn.textContent;btn.disabled=true;btn.textContent='جاري تجهيز PDF…';
  try{const user=await waitForUser(1200);let savedToAccount=false;if(user){if(fingerprint(data)===lastSavedFingerprint)savedToAccount=true;else savedToAccount=!!(await cloudSave({silent:true}))}await downloadNodePdf($('cv'),`${safeFilename(data.name,'Student')}-CV.pdf`);status(savedToAccount?'تم تنزيل الـPDF وحفظ نسخة في ملفك الخاص. تحصل عليها من حسابك الشخصي.':user?'تم تنزيل الـPDF، لكن تعذر حفظ نسخة في حسابك الآن.':'تم تنزيل الـPDF. سجّل الدخول ليُحفظ تلقائيًا في ملفك الخاص.','success')}catch(error){console.error(error);status('تعذر تجهيز PDF الآن. جرّب مرة أخرى.','error')}finally{btn.disabled=false;btn.textContent=old}
}
async function loadInitial(){setupTemplates();const params=new URLSearchParams(location.search),artifactId=params.get('artifact');if(artifactId){try{const artifact=await getArtifact(artifactId);if(artifact?.artifactType==='cv'){groupId=artifact.artifactGroupId||crypto.randomUUID();version=Number(artifact.version||1)+1;certificates=(artifact.certificateSummaries||artifact.data?.certificates||[]).map(info=>info?.error?info:{fileName:info.fileName||'',info});applyData(artifact.data||{});$('artifactName').value=artifact.artifactName||$('artifactName').value;render();lastSavedFingerprint=fingerprint(collect());status('تم تحميل النسخة المحفوظة. عند التنزيل سيُحدّث ملفك تلقائيًا.','success');return}}catch(error){console.warn(error)}}
  try{const saved=JSON.parse(localStorage.getItem(localKey)||'null');if(saved?.data){groupId=saved.groupId||groupId;version=Number(saved.version||1);certificates=saved.certificates||[];applyData(saved.data);return}}catch{}
  const user=await waitForUser(900);if(user){if(!$('name').value)$('name').value=user.displayName||'';if(!$('email').value)$('email').value=user.email||''}$('template').value=$('template').value||'formal';render()}
fieldIds.forEach(id=>$(id)?.addEventListener('input',render));$('cvCertFiles')?.addEventListener('change',e=>readCertificates(e.target.files));
$('downloadBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();download()});
$('clearBtn')?.addEventListener('click',()=>{if(!confirm('مسح المسودة الحالية من الجهاز؟'))return;fieldIds.forEach(id=>{if($(id))$(id).value=''});$('artifactName').value='CV 1';$('template').value='formal';$('lang').value='en';certificates=[];groupId=crypto.randomUUID();version=1;lastSavedFingerprint='';localStorage.removeItem(localKey);render();status('تم مسح المسودة المحلية.')});
loadInitial();