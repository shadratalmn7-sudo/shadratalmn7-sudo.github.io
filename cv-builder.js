import{downloadNodePdf,getArtifact,safeFilename,saveArtifact,waitForUser}from'./student-artifacts-a4.js?v=1';

const $=id=>document.getElementById(id);
const fieldIds=['artifactName','name','role','email','phone','location','link','summary','education','certs','experience','skills','languages','template','lang'];
const templates=[['modern','حديث'],['classic','كلاسيكي'],['navy','أزرق مهني'],['minimal','Minimal'],['academic','أكاديمي'],['sidebar','جانبي'],['emerald','أخضر'],['slate','Slate'],['executive','Executive'],['compact','مضغوط']];
let groupId=crypto.randomUUID(),version=1,lastSavedFingerprint='',saving=false;
const localKey='shadrat-cv-v2';
const clean=v=>String(v||'').trim();
const lines=v=>String(v||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
const fingerprint=data=>JSON.stringify(data);
const status=(text,type='')=>{const el=$('builderStatus');if(!el)return;el.textContent=text;el.className=`builder-status ${type}`.trim()};
function fillList(id,value){const ul=$(id);ul.innerHTML='';lines(value).forEach(line=>{const li=document.createElement('li');li.textContent=line;ul.appendChild(li)})}
function collect(){return Object.fromEntries(fieldIds.map(id=>[id,$(id)?.value||'']))}
function render(){
  const data=collect();
  $('pName').textContent=clean(data.name)||'اسم الطالب';
  $('pRole').textContent=clean(data.role)||'Student';
  $('pSummary').textContent=clean(data.summary)||'أضف نبذة مختصرة عنك وهدفك.';
  fillList('pEducation',data.education);fillList('pCerts',data.certs);fillList('pExperience',data.experience);
  $('pSkills').textContent=clean(data.skills)||'—';$('pLanguages').textContent=clean(data.languages)||'—';
  $('pContact').textContent=[data.email,data.phone,data.location,data.link].map(clean).filter(Boolean).join(' • ')||'email@example.com';
  $('cv').className=`cv template-${data.template||'modern'}`;
  $('cv').dir=data.lang==='ar'?'rtl':'ltr';
  const ar={summary:'النبذة',education:'التعليم',certs:'الشهادات والإنجازات',experience:'المشاريع والخبرات',skills:'المهارات',languages:'اللغات'},en={summary:'PROFILE',education:'EDUCATION',certs:'CERTIFICATES & ACHIEVEMENTS',experience:'PROJECTS & EXPERIENCE',skills:'SKILLS',languages:'LANGUAGES'};
  const map=data.lang==='ar'?ar:en;document.querySelectorAll('#cv [data-key]').forEach(el=>el.textContent=map[el.dataset.key]);
  document.querySelectorAll('[data-cv-template]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.cvTemplate===data.template));
  try{localStorage.setItem(localKey,JSON.stringify({groupId,version,data}))}catch{}
}
function applyData(data={}){fieldIds.forEach(id=>{if($(id)&&data[id]!=null)$(id).value=data[id]});render()}
function setupTemplates(){const box=$('templatePicker');if(!box)return;box.innerHTML=templates.map(([value,label])=>`<button type="button" class="template-choice" data-cv-template="${value}">${label}</button>`).join('');box.addEventListener('click',e=>{const btn=e.target.closest('[data-cv-template]');if(!btn)return;$('template').value=btn.dataset.cvTemplate;render()})}
async function cloudSave({silent=false}={}){
  if(saving)return null;
  const data=collect();
  if(!clean(data.name)){if(!silent)status('اكتب اسم الطالب قبل الحفظ.','error');return null}
  if(!clean(data.artifactName))data.artifactName='CV 1';
  const user=await waitForUser();
  if(!user){if(!silent)status('سجّل الدخول أولًا ليُحفظ الـCV في حسابك.','error');return null}
  saving=true;const saveButton=$('saveBtn'),oldSaveText=saveButton?.textContent;if(saveButton&&!silent){saveButton.disabled=true;saveButton.textContent='جاري الحفظ…'}if(!silent)status('جارٍ حفظ الـCV في حسابك…');
  try{
    const saved=await saveArtifact({artifactType:'cv',artifactGroupId:groupId,artifactName:data.artifactName,studentName:data.name,specialization:data.role,template:data.template,language:data.lang,version,data,renderedHtml:$('cv').outerHTML});
    lastSavedFingerprint=fingerprint(data);version+=1;try{localStorage.setItem(localKey,JSON.stringify({groupId,version,data}))}catch{}
    if(!silent)status(`تم الحفظ باسم «${data.artifactName}».`,'success');
    return saved;
  }catch(error){console.error(error);if(!silent)status(error?.code==='login-required'?'سجّل الدخول أولًا ليُحفظ الـCV.':'تعذر الحفظ الآن.','error');return null}finally{saving=false;if(saveButton&&!silent){saveButton.disabled=false;saveButton.textContent=oldSaveText||'حفظ في حسابي'}}
}
async function download(){
  const data=collect();if(!clean(data.name)){status('اكتب اسم الطالب قبل التنزيل.','error');return}
  const btn=$('downloadBtn'),old=btn.textContent;btn.disabled=true;btn.textContent='جاري تجهيز PDF…';
  try{const user=await waitForUser(1200);if(user&&fingerprint(data)!==lastSavedFingerprint)await cloudSave({silent:true});await downloadNodePdf($('cv'),`${safeFilename(data.name,'Student')}-CV.pdf`);status('تم تجهيز ملف PDF.','success')}catch(error){console.error(error);status('تعذر تجهيز PDF على هذا المتصفح. أعد المحاولة في Safari أو Chrome.','error')}finally{btn.disabled=false;btn.textContent=old}}
async function loadInitial(){
  setupTemplates();
  const params=new URLSearchParams(location.search),artifactId=params.get('artifact');
  if(artifactId){try{const artifact=await getArtifact(artifactId);if(artifact?.artifactType==='cv'){groupId=artifact.artifactGroupId||crypto.randomUUID();version=Number(artifact.version||1)+1;applyData(artifact.data||{});$('artifactName').value=artifact.artifactName||$('artifactName').value;render();lastSavedFingerprint=fingerprint(collect());status('تم تحميل النسخة المحفوظة. أي حفظ جديد سيُسجل كنسخة جديدة.','success');return}}catch(error){console.warn(error)}}
  try{const saved=JSON.parse(localStorage.getItem(localKey)||'null');if(saved?.data){groupId=saved.groupId||groupId;version=Number(saved.version||1);applyData(saved.data);return}}catch{}
  const user=await waitForUser(900);if(user){if(!$('name').value)$('name').value=user.displayName||'';if(!$('email').value)$('email').value=user.email||''}render();
}
fieldIds.forEach(id=>$(id)?.addEventListener('input',render));
$('saveBtn')?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();cloudSave()});$('downloadBtn')?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();download()});
$('clearBtn')?.addEventListener('click',()=>{if(!confirm('مسح المسودة الحالية من الجهاز؟'))return;fieldIds.forEach(id=>{if($(id))$(id).value=''});$('artifactName').value='CV 1';$('template').value='modern';$('lang').value='en';groupId=crypto.randomUUID();version=1;lastSavedFingerprint='';localStorage.removeItem(localKey);render();status('تم مسح المسودة المحلية.')});
loadInitial();
