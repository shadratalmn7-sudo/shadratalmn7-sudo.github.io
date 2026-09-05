import{downloadNodePdf,getArtifact,safeFilename,saveArtifact,waitForUser}from'./student-artifacts-a4.js?v=4';

const $=id=>document.getElementById(id);
const fieldIds=['artifactName','name','role','email','phone','location','link','summary','education','certs','experience','skills','languages','template','lang'];
const templates=[['modern','حديث'],['classic','كلاسيكي'],['navy','أزرق مهني'],['minimal','Minimal'],['academic','أكاديمي'],['sidebar','جانبي'],['emerald','أخضر'],['slate','Slate'],['executive','Executive'],['compact','مضغوط']];
let groupId=crypto.randomUUID(),version=1,lastSavedFingerprint='',saving=false;
const localKey='shadrat-cv-v2';
const clean=v=>String(v||'').trim();
const lines=v=>String(v||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
const fingerprint=data=>JSON.stringify(data);
const status=(text,type='')=>{const el=$('builderStatus');if(!el)return;el.textContent=text;el.className=`builder-status ${type}`.trim()};
const splitSkills=value=>String(value||'').split(/[،,|•\n]+/).map(x=>x.trim()).filter(Boolean).slice(0,8);
function fillList(id,items){const ul=$(id);ul.innerHTML='';items.forEach(line=>{const li=document.createElement('li');li.textContent=line;ul.appendChild(li)})}
function collect(){return Object.fromEntries(fieldIds.map(id=>[id,$(id)?.value||'']))}
function profileText(data){
  const ar=data.lang==='ar',role=clean(data.role),base=clean(data.summary),skills=splitSkills(data.skills),education=lines(data.education);
  const parts=[];
  if(base)parts.push(base);
  if(ar){
    if(role)parts.push(`يركز هذا الملف على بناء مسار دراسي ومهني منظم في ${role}، مع تحويل المعلومات المدخلة إلى صورة أوضح للهدف الحالي وما يحتاجه من تطوير مستمر.`);
    else if(!base)parts.push('يركز هذا الملف على إبراز الخلفية التعليمية والمهارات والإنجازات المدخلة بصورة منظمة تساعد على تقديم ملف واضح ومتكامل للفرص الدراسية والمهنية.');
    if(skills.length)parts.push(`وتشمل مجالات التركيز المذكورة: ${skills.join('، ')}، مع ربط هذه المهارات بالهدف الدراسي أو المهني بدل عرضها كقائمة منفصلة فقط.`);
    if(education.length)parts.push('وتدعم الخلفية التعليمية المذكورة هذا الاتجاه وتوضح الأساس الذي تُبنى عليه الخطوات القادمة في الدراسة والتطوير.');
  }else{
    if(role)parts.push(`This profile is focused on building a clear academic and professional path in ${role}, presenting the information provided in a way that explains the current direction and the areas that can be developed further.`);
    else if(!base)parts.push('This profile organizes the provided education, skills, achievements, and experience into a clear academic and professional summary suitable for study and career opportunities.');
    if(skills.length)parts.push(`Key areas mentioned include ${skills.join(', ')}, with emphasis on connecting the listed skills to the applicant's academic or professional objective rather than presenting them as isolated keywords.`);
    if(education.length)parts.push('The listed educational background provides the foundation for the next stage of study, skill development, and professional preparation.');
  }
  return parts.join(' ');
}
function educationItems(data){
  const ar=data.lang==='ar',items=lines(data.education),role=clean(data.role);
  if(role)items.push(ar?`الاتجاه الأكاديمي: البناء على الخلفية التعليمية المذكورة والاستعداد لمزيد من الدراسة والتطور في ${role}.`:`Academic direction: building on the education listed above and preparing for further study and development in ${role}.`);
  return items;
}
function certificateItems(data){
  const ar=data.lang==='ar',items=lines(data.certs),skills=splitSkills(data.skills);
  if(items.length)items.push(ar?'تعكس الشهادات والإنجازات المذكورة مسارًا موثقًا للتعلم والتقدم، ويمكن تخصيص ترتيبها بحسب متطلبات كل فرصة.':'The listed certificates and achievements document continued learning and progress and can be prioritized according to each opportunity.');
  else if(skills.length)items.push(ar?`مسار تعلم مستمر مرتبط بالمجالات المذكورة في المهارات: ${skills.join('، ')}.`:`Continuous learning focus connected to the skills listed in this profile: ${skills.join(', ')}.`);
  return items;
}
function experienceItems(data){
  const ar=data.lang==='ar',items=lines(data.experience),role=clean(data.role);
  if(items.length)items.push(ar?'توضح العناصر المذكورة مجالات التطبيق والخبرة التي اختار صاحب السيرة إبرازها ضمن هذا الملف.':'The items above summarize the practical, academic, or project experience selected for this profile.');
  else if(role)items.push(ar?`الهدف التطبيقي: البحث عن فرص أكاديمية أو عملية لتطبيق المعرفة وتطوير الخبرة في ${role}.`:`Practical objective: seeking academic or practical opportunities to apply knowledge and develop experience in ${role}.`);
  return items;
}
function skillsText(data){
  const ar=data.lang==='ar',raw=clean(data.skills),role=clean(data.role),skills=splitSkills(data.skills);
  if(raw&&skills.length)return ar?`${skills.join(' • ')}\nترتبط هذه المهارات بالمسار المستهدف وتُعرض هنا بصورة مختصرة لتسهيل مراجعة الملف.`:`${skills.join(' • ')}\nThese skills are presented as the main focus areas connected to the target academic or professional path.`;
  if(role)return ar?`مجال التركيز: ${role}`:`Primary focus: ${role}`;
  return '—';
}
function render(){
  const data=collect(),ar=data.lang==='ar';
  $('pName').textContent=clean(data.name)||'اسم الطالب';
  $('pRole').textContent=clean(data.role)||(ar?'الهدف الدراسي / المهني':'Student');
  $('pSummary').textContent=profileText(data);
  fillList('pEducation',educationItems(data));fillList('pCerts',certificateItems(data));fillList('pExperience',experienceItems(data));
  $('pSkills').textContent=skillsText(data);$('pLanguages').textContent=clean(data.languages)||'—';
  $('pContact').textContent=[data.email,data.phone,data.location,data.link].map(clean).filter(Boolean).join(' • ')||(ar?'بيانات التواصل':'Contact details');
  $('cv').className=`cv template-${data.template||'modern'}`;
  $('cv').dir=ar?'rtl':'ltr';
  const arTitles={summary:'النبذة',education:'التعليم',certs:'الشهادات والإنجازات',experience:'المشاريع والخبرات',skills:'المهارات',languages:'اللغات'},enTitles={summary:'PROFILE',education:'EDUCATION',certs:'CERTIFICATES & ACHIEVEMENTS',experience:'PROJECTS & EXPERIENCE',skills:'SKILLS',languages:'LANGUAGES'};
  const map=ar?arTitles:enTitles;document.querySelectorAll('#cv [data-key]').forEach(el=>el.textContent=map[el.dataset.key]);
  document.querySelectorAll('[data-cv-template]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.cvTemplate===data.template));
  try{localStorage.setItem(localKey,JSON.stringify({groupId,version,data}))}catch{}
}
function applyData(data={}){fieldIds.forEach(id=>{if($(id)&&data[id]!=null)$(id).value=data[id]});render()}
function setupTemplates(){const box=$('templatePicker');if(!box)return;box.innerHTML=templates.map(([value,label])=>`<button type="button" class="template-choice" data-cv-template="${value}">${label}</button>`).join('');box.addEventListener('click',e=>{const btn=e.target.closest('[data-cv-template]');if(!btn)return;$('template').value=btn.dataset.cvTemplate;render()})}
async function cloudSave({silent=false}={}){
  if(saving)return null;
  const data=collect();
  if(!clean(data.name)){if(!silent)status('اكتب اسم الطالب أولًا.','error');return null}
  if(!clean(data.artifactName))data.artifactName='CV 1';
  const user=await waitForUser();
  if(!user){if(!silent)status('سجّل الدخول ليُحفظ الـCV في ملفك الخاص.','error');return null}
  saving=true;if(!silent)status('جارٍ حفظ الـCV في ملفك الخاص…');
  try{
    const saved=await saveArtifact({artifactType:'cv',artifactGroupId:groupId,artifactName:data.artifactName,studentName:data.name,specialization:data.role,template:data.template,language:data.lang,version,data,renderedHtml:$('cv').outerHTML});
    lastSavedFingerprint=fingerprint(data);version+=1;try{localStorage.setItem(localKey,JSON.stringify({groupId,version,data}))}catch{}
    if(!silent)status(`تم حفظ «${data.artifactName}» في ملفك الخاص.`,'success');
    return saved;
  }catch(error){console.error(error);if(!silent)status('تعذر حفظ النسخة في حسابك الآن.','error');return null}finally{saving=false}
}
async function download(){
  const data=collect();if(!clean(data.name)){status('اكتب اسم الطالب قبل التنزيل.','error');return}
  render();
  const btn=$('downloadBtn'),old=btn.textContent;btn.disabled=true;btn.textContent='جاري تجهيز PDF…';
  try{
    const user=await waitForUser(1200);let savedToAccount=false;
    if(user){if(fingerprint(data)===lastSavedFingerprint)savedToAccount=true;else savedToAccount=!!(await cloudSave({silent:true}))}
    await downloadNodePdf($('cv'),`${safeFilename(data.name,'Student')}-CV.pdf`);
    status(savedToAccount?'تم تنزيل الـPDF وحفظ نسخة في ملفك الخاص. تحصل عليها من حسابك الشخصي.':user?'تم تنزيل الـPDF، لكن تعذر حفظ نسخة في حسابك الآن.':'تم تنزيل الـPDF. سجّل الدخول ليُحفظ تلقائيًا في ملفك الخاص.','success');
  }catch(error){console.error(error);status('تعذر تجهيز PDF الآن. جرّب مرة أخرى.','error')}finally{btn.disabled=false;btn.textContent=old}
}
async function loadInitial(){
  setupTemplates();
  const params=new URLSearchParams(location.search),artifactId=params.get('artifact');
  if(artifactId){try{const artifact=await getArtifact(artifactId);if(artifact?.artifactType==='cv'){groupId=artifact.artifactGroupId||crypto.randomUUID();version=Number(artifact.version||1)+1;applyData(artifact.data||{});$('artifactName').value=artifact.artifactName||$('artifactName').value;render();lastSavedFingerprint=fingerprint(collect());status('تم تحميل النسخة المحفوظة. عند التنزيل سيُحدّث ملفك تلقائيًا.','success');return}}catch(error){console.warn(error)}}
  try{const saved=JSON.parse(localStorage.getItem(localKey)||'null');if(saved?.data){groupId=saved.groupId||groupId;version=Number(saved.version||1);applyData(saved.data);return}}catch{}
  const user=await waitForUser(900);if(user){if(!$('name').value)$('name').value=user.displayName||'';if(!$('email').value)$('email').value=user.email||''}render();
}
fieldIds.forEach(id=>$(id)?.addEventListener('input',render));
$('downloadBtn')?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();download()});
$('clearBtn')?.addEventListener('click',()=>{if(!confirm('مسح المسودة الحالية من الجهاز؟'))return;fieldIds.forEach(id=>{if($(id))$(id).value=''});$('artifactName').value='CV 1';$('template').value='modern';$('lang').value='en';groupId=crypto.randomUUID();version=1;lastSavedFingerprint='';localStorage.removeItem(localKey);render();status('تم مسح المسودة المحلية.')});
loadInitial();