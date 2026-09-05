const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const rawLines=v=>String(v??'').split(/\n+/).map(clean).filter(Boolean);
const sentence=v=>clean(v).replace(/[.،,;؛:]+$/,'');
const uniq=a=>[...new Set(a.map(clean).filter(Boolean))];
const hasArabic=v=>/[\u0600-\u06ff]/.test(String(v||''));

const fields=[
  {ar:'الأمن السيبراني',en:'Cybersecurity',re:/cyber|cybersecurity|information security|امن سيبر|أمن سيبر|الامن السيبر|الأمن السيبر|امن المعلومات|أمن المعلومات/i},
  {ar:'علوم الحاسب',en:'Computer Science',re:/computer science|علوم الحاسب|علوم الكمبيوتر/i},
  {ar:'البرمجة وتطوير البرمجيات',en:'Software Development',re:/programming|coding|software development|برمج|تطوير برمج/i},
  {ar:'الذكاء الاصطناعي',en:'Artificial Intelligence',re:/artificial intelligence|machine learning|\bai\b|ذكاء اصطناعي|تعلم آلي/i},
  {ar:'علوم وتحليل البيانات',en:'Data Science and Analytics',re:/data science|data analysis|analytics|علوم البيانات|تحليل البيانات/i},
  {ar:'الشبكات',en:'Computer Networking',re:/network|networking|شبكات/i},
  {ar:'تقنية المعلومات',en:'Information Technology',re:/information technology|\bit\b|تقنية المعلومات|دعم فني|technical support/i},
  {ar:'إدارة الأعمال',en:'Business Administration',re:/business administration|business|إدارة الأعمال|ادارة اعمال/i},
  {ar:'المحاسبة',en:'Accounting',re:/accounting|accountant|محاسب|محاسبة/i},
  {ar:'الهندسة',en:'Engineering',re:/engineering|engineer|هندسة|هندسه|مهندس/i},
  {ar:'الطب والرعاية الصحية',en:'Healthcare',re:/medicine|medical|healthcare|طب|طبي|تمريض/i},
  {ar:'التسويق',en:'Marketing',re:/marketing|digital marketing|تسويق/i},
  {ar:'إدارة المشاريع',en:'Project Management',re:/project management|project manager|إدارة المشاريع|مدير مشروع/i},
  {ar:'خدمة العملاء',en:'Customer Service',re:/customer service|call center|خدمة العملاء|خدمة عملاء/i},
  {ar:'المبيعات',en:'Sales',re:/sales|sales representative|مبيعات|مندوب مبيعات/i}
];
const skillCatalog=[
  {ar:'الأمن السيبراني',en:'Cybersecurity',re:/cyber|security|أمن سيبر|الأمن السيبر|أمن المعلومات/i},
  {ar:'بايثون',en:'Python',re:/\bpython\b|بايثون/i},
  {ar:'البرمجة',en:'Programming',re:/programming|coding|برمجة|برمج/i},
  {ar:'الشبكات',en:'Networking',re:/network|شبكات/i},
  {ar:'تحليل البيانات',en:'Data Analysis',re:/data analysis|analytics|تحليل البيانات/i},
  {ar:'الذكاء الاصطناعي',en:'Artificial Intelligence',re:/artificial intelligence|machine learning|\bai\b|ذكاء اصطناعي|تعلم آلي/i},
  {ar:'الحوسبة السحابية',en:'Cloud Computing',re:/cloud|aws|azure|gcp|سحاب/i},
  {ar:'قواعد البيانات',en:'Databases',re:/database|sql|mysql|postgres|mongodb|قواعد البيانات/i},
  {ar:'لينكس',en:'Linux',re:/linux|ubuntu|لينكس/i},
  {ar:'إدارة المشاريع',en:'Project Management',re:/project management|agile|scrum|pmp|إدارة المشاريع/i},
  {ar:'القيادة',en:'Leadership',re:/leadership|قيادة/i},
  {ar:'البحث',en:'Research',re:/research|بحث/i},
  {ar:'اللغة الإنجليزية',en:'English',re:/english|انجليزي|إنجليزي|اللغة الإنجليزية/i}
];

function fieldName(role,lang){
  const r=clean(role);if(!r)return'';const hit=fields.find(x=>x.re.test(r));
  if(hit)return lang==='ar'?hit.ar:hit.en;
  if(lang==='ar')return hasArabic(r)?sentence(r):r;
  return hasArabic(r)?'the target field':sentence(r);
}
function academicState(text=''){
  const t=clean(text);return{
    highSchoolGraduate:/خريج.{0,30}(ثان|ثانوية)|خلصت.{0,24}(ثان|ثانوية)|انتهيت.{0,24}(ثان|ثانوية)|اكملت.{0,24}(ثان|ثانوية)|أكملت.{0,24}(ثان|ثانوية)|completed.{0,30}high school|high school graduate|secondary school graduate/i.test(t),
    highSchoolStudent:/طالب.{0,24}(ثان|ثانوية)|high school student|secondary school student/i.test(t),
    bachelorApplicant:/اقدم.{0,28}بكالوريوس|أقدم.{0,28}بكالوريوس|مقدم.{0,28}بكالوريوس|متقدم.{0,28}بكالوريوس|بقدم.{0,28}بكالوريوس|applying.{0,35}bachelor|bachelor.?s applicant|seeking.{0,28}bachelor/i.test(t),
    bachelorStudent:/طالب.{0,28}بكالوريوس|ادرس.{0,28}بكالوريوس|أدرس.{0,28}بكالوريوس|bachelor.?s student|undergraduate student/i.test(t),
    bachelorGraduate:/خريج.{0,28}بكالوريوس|حاصل.{0,28}بكالوريوس|انهيت.{0,28}بكالوريوس|أنهيت.{0,28}بكالوريوس|bachelor.?s graduate|bachelor.?s degree holder|completed.{0,28}bachelor/i.test(t),
    masterApplicant:/اقدم.{0,28}ماجستير|أقدم.{0,28}ماجستير|متقدم.{0,28}ماجستير|applying.{0,35}master|master.?s applicant/i.test(t),
    masterStudent:/طالب.{0,28}ماجستير|ادرس.{0,28}ماجستير|أدرس.{0,28}ماجستير|master.?s student/i.test(t),
    masterGraduate:/خريج.{0,28}ماجستير|حاصل.{0,28}ماجستير|master.?s graduate|master.?s degree holder/i.test(t)
  }
}
function professionalState(text=''){
  const t=clean(text),years=(t.match(/(?:خبرة|خبرتي|اشتغلت|عملت|experience|worked)[^\d]{0,30}(\d{1,2})\s*(?:سنوات|سنة|عام|years?|yrs?)/i)||t.match(/(\d{1,2})\s*(?:سنوات|سنة|عام)\s*(?:خبرة|عمل)/i)||[])[1]||'';
  return{employed:/موظف|اعمل|أعمل|اشتغل|أشتغل|currently work|currently employed|working as|employed as/i.test(t),jobSeeker:/ابحث عن عمل|أبحث عن عمل|ابحث عن وظيفة|أبحث عن وظيفة|باحث عن عمل|looking for (?:a )?job|seeking (?:a )?(?:job|role|position|opportunity)|open to work/i.test(t),experienced:/خبرة|خبرتي|اشتغلت|عملت|worked|experience/i.test(t),internship:/تدريب تعاوني|متدرب|تدريب عملي|internship|intern\b|trainee/i.test(t),freelancer:/عمل حر|فريلانسر|مستقل|freelance|freelancer/i.test(t),years:Number(years||0)}
}
function extractGpa(text=''){const m=String(text).match(/(?:معدل|gpa|grade|score)\s*[:：-]?\s*(\d{1,3}(?:\.\d+)?\s*%?)/i)||String(text).match(/\b(\d{2,3}(?:\.\d+)\s*%)\b/);return m?.[1]?.replace(/\s/g,'')||''}
function extractYear(text=''){const years=[...String(text).matchAll(/\b(19\d{2}|20\d{2})\b/g)].map(m=>m[1]);return years.at(-1)||''}
function extractInstitution(text=''){
  const t=clean(text);let m=t.match(/((?:ثانوية|مدرسة|جامعة|كلية|معهد)\s+[^،.;]{2,90})/i);
  if(m){let s=m[1].split(/\s+(?:بمعدل|بمعدلي|معدل|عام|سنة|في عام|وتقدير|وأتقدم|ومقدم|ومتقدم)\b/i)[0];return clean(s)}
  m=t.match(/((?:high school|secondary school|university|college|institute)\s+[^,.;]{2,90})/i);if(m){let s=m[1].split(/\s+(?:with|gpa|grade|in|year|applying)\b/i)[0];return clean(s)}return'';
}
function normalizeSkills(values,lang){
  const out=[];for(const raw of values){const x=clean(raw);if(!x)continue;const hit=skillCatalog.find(s=>s.re.test(x));out.push(hit?(lang==='ar'?hit.ar:hit.en):x)}return uniq(out)
}
function formalLanguage(raw,lang){
  const items=String(raw||'').split(/[|،,;\n]+/).map(clean).filter(Boolean).map(x=>{
    if(lang==='ar'){
      if(/العربي|arabic/i.test(x))return /أم|native/i.test(x)?'العربية — لغة أم':x.replace(/arabic/i,'العربية');
      if(/english|انجليزي|إنجليزي/i.test(x))return x.replace(/english|انجليزي|إنجليزي/ig,'الإنجليزية');
      if(/russian|روسي/i.test(x))return x.replace(/russian|روسي/ig,'الروسية');
    }else{
      if(/العربي|arabic/i.test(x))return /أم|native/i.test(x)?'Arabic — Native':x.replace(/العربية?|arabic/ig,'Arabic');
      if(/english|انجليزي|إنجليزي/i.test(x))return x.replace(/english|انجليزي|إنجليزي/ig,'English');
      if(/russian|روسي/i.test(x))return x.replace(/russian|روسي/ig,'Russian');
    }return x
  });return uniq(items).join(' | ')
}
function formalizeFreeText(text,lang,field=''){
  let s=sentence(text);if(!s)return'';
  if(lang==='ar'){
    s=s.replace(/^انا\s+/i,'').replace(/\bخلصت\b/g,'أكملت').replace(/\bانتهيت من\b/g,'أكملت').replace(/\bمقدم على\b/g,'متقدم للالتحاق بـ').replace(/\bمتقدم على\b/g,'متقدم للالتحاق بـ').replace(/\bبقدم على\b/g,'أتقدم للالتحاق بـ').replace(/\bسويت موقع\b/g,'طورت موقعًا إلكترونيًا').replace(/\bسويت مشروع\b/g,'أنجزت مشروعًا').replace(/\bسويت\b/g,'أنجزت').replace(/\bبنيت\b/g,'طورت').replace(/\bاشتغلت\b/g,'عملت').replace(/\bعندي\b/g,'لدي').replace(/\bشاركت بتطوع\b/g,'شاركت في عمل تطوعي').replace(/\bشاركت في تطوع\b/g,'شاركت في عمل تطوعي');
    if(/اطمح|أطمح|هدفي|ابغى|أبغى/.test(s)&&/اكمل دراست|أكمل دراست|مواصلة دراست/.test(s)){const place=/روسيا/.test(s)?' في روسيا':'';return `الهدف الأكاديمي هو مواصلة الدراسة${place}${field?` ضمن مسار ${field}`:''}.`}
    return `${s}.`;
  }
  s=s.replace(/^i\s+/i,'').replace(/\bi finished\b/ig,'Completed').replace(/\bi completed\b/ig,'Completed').replace(/\bi am applying for\b/ig,'Applying to').replace(/\bi built\b/ig,'Developed').replace(/\bi made\b/ig,'Developed').replace(/\bi worked\b/ig,'Worked').replace(/\bi have\b/ig,'Possesses');return `${s}.`;
}
function educationLine(line,lang,field){
  const state=academicState(line),gpa=extractGpa(line),year=extractYear(line),institution=extractInstitution(line),bits=[];
  if(lang==='ar'){
    if(state.highSchoolGraduate){bits.push(`أكمل المرحلة الثانوية${institution?` في ${institution}`:''}${gpa?` بمعدل ${gpa}`:''}${year?` عام ${year}`:''}`)}
    else if(state.highSchoolStudent){bits.push(`يدرس حاليًا في المرحلة الثانوية${institution?` في ${institution}`:''}${gpa?` بمعدل ${gpa}`:''}`)}
    if(state.bachelorApplicant)bits.push(`متقدم للالتحاق ببرنامج بكالوريوس${field?` في ${field}`:''}`);
    else if(state.bachelorStudent)bits.push(`يدرس حاليًا ضمن برنامج بكالوريوس${field?` في ${field}`:''}`);
    else if(state.bachelorGraduate)bits.push(`أكمل درجة البكالوريوس${field?` في مسار مرتبط بـ ${field}`:''}${year?` عام ${year}`:''}`);
    if(state.masterApplicant)bits.push(`متقدم للالتحاق ببرنامج ماجستير${field?` في ${field}`:''}`);else if(state.masterStudent)bits.push(`يدرس حاليًا ضمن برنامج ماجستير${field?` في ${field}`:''}`);else if(state.masterGraduate)bits.push(`أكمل درجة الماجستير${field?` في مسار مرتبط بـ ${field}`:''}`);
    if(bits.length)return bits.join('، و')+'.';
  }else{
    if(state.highSchoolGraduate)bits.push(`Completed secondary education${institution?` at ${institution}`:''}${gpa?` with a final grade of ${gpa}`:''}${year?` in ${year}`:''}`);else if(state.highSchoolStudent)bits.push(`Currently completing secondary education${institution?` at ${institution}`:''}${gpa?` with a current grade of ${gpa}`:''}`);
    if(state.bachelorApplicant)bits.push(`applying to a Bachelor's program${field?` in ${field}`:''}`);else if(state.bachelorStudent)bits.push(`currently enrolled in a Bachelor's program${field?` in ${field}`:''}`);else if(state.bachelorGraduate)bits.push(`completed a Bachelor's degree${field?` in a field related to ${field}`:''}${year?` in ${year}`:''}`);
    if(state.masterApplicant)bits.push(`applying to a Master's program${field?` in ${field}`:''}`);else if(state.masterStudent)bits.push(`currently enrolled in a Master's program${field?` in ${field}`:''}`);else if(state.masterGraduate)bits.push(`completed a Master's degree${field?` in a field related to ${field}`:''}`);
    if(bits.length)return bits.join('; ')+'.';
  }
  return formalizeFreeText(line,lang,field)
}
function experienceLine(line,lang,field){
  const x=sentence(line);if(!x)return'';
  if(lang==='ar'){
    if(/سويت|بنيت|طورت|أنشأت|عملت.*موقع|موقع للمنح/i.test(x)){const name=(x.match(/(?:اسمه|باسم)\s+([^،.;]+)/i)||[])[1]||'';return `تطوير موقع إلكتروني${/منح/i.test(x)?' متخصص في المنح':''}${name?` باسم ${clean(name)}`:''}${field?`، مع توظيف مهارات مرتبطة بـ ${field}`:''}.`}
    if(/مشروع.*(?:python|بايثون)/i.test(x))return `تنفيذ مشروع باستخدام Python${field?` لدعم التطبيق العملي في ${field}`:''}.`;
    if(/تطوع|متطوع/i.test(x))return `المشاركة في نشاط تطوعي${field?` يدعم المهارات العامة المرتبطة بالمسار في ${field}`:''}.`;
    if(/اشتغلت|عملت|موظف|خبرة/i.test(x)){let s=formalizeFreeText(x,lang,field);return s.replace(/^عملت\s+/,'خبرة عملية في ')}
    return formalizeFreeText(x,lang,field)
  }
  if(/built|created|developed|website|project|worked|experience|volunteer/i.test(x))return formalizeFreeText(x,lang,field);return formalizeFreeText(x,lang,field)
}
function headline(data,lang,state,pState,field){
  if(lang==='ar'){
    if(state.highSchoolGraduate&&state.bachelorApplicant)return `خريج ثانوية | متقدم لبكالوريوس${field?` في ${field}`:''}`;
    if(state.highSchoolGraduate)return `خريج ثانوية${field?` | مهتم بـ ${field}`:''}`;
    if(state.highSchoolStudent)return `طالب ثانوي${field?` | يستهدف ${field}`:''}`;
    if(state.bachelorStudent)return `طالب بكالوريوس${field?` في ${field}`:''}`;
    if(state.bachelorGraduate&&state.masterApplicant)return `خريج بكالوريوس | متقدم لماجستير${field?` في ${field}`:''}`;
    if(pState.employed||pState.experienced)return field||'ملف مهني';
    return field||'ملف أكاديمي ومهني';
  }
  if(state.highSchoolGraduate&&state.bachelorApplicant)return `High School Graduate | Bachelor's Applicant${field?` in ${field}`:''}`;
  if(state.highSchoolGraduate)return `High School Graduate${field?` | ${field}`:''}`;
  if(state.highSchoolStudent)return `High School Student${field?` | Aspiring ${field} Student`:''}`;
  if(state.bachelorStudent)return `Bachelor's Student${field?` in ${field}`:''}`;
  if(state.bachelorGraduate&&state.masterApplicant)return `Bachelor's Graduate | Master's Applicant${field?` in ${field}`:''}`;
  return field||'Academic and Professional Profile';
}
function semanticSummary(data,lang,state,pState,field,{certificateCount=0,skills=[],educationCount=0,experienceCount=0}={}){
  const parts=[];
  if(lang==='ar'){
    if(state.highSchoolGraduate&&state.bachelorApplicant)parts.push(`خريج مرحلة ثانوية ومتقدم للانتقال إلى التعليم الجامعي عبر برنامج بكالوريوس${field?` في ${field}`:''}.`);
    else if(state.highSchoolGraduate)parts.push(`خريج مرحلة ثانوية${field?` يركز مساره الأكاديمي على ${field}`:''}.`);
    else if(state.highSchoolStudent)parts.push(`طالب في المرحلة الثانوية يستعد للمرحلة الجامعية${field?` في ${field}`:''}.`);
    else if(state.bachelorStudent)parts.push(`طالب بكالوريوس${field?` في ${field}`:''}.`);
    else if(state.bachelorGraduate&&state.masterApplicant)parts.push(`خريج بكالوريوس ومتقدم إلى مرحلة الماجستير${field?` في ${field}`:''}.`);
    else if(pState.years)parts.push(`يمتلك خبرة عملية موثقة تمتد إلى ${pState.years} ${pState.years===1?'سنة':'سنوات'}${field?` في مسار مرتبط بـ ${field}`:''}.`);
    else if(pState.employed||pState.experienced)parts.push(`يمتلك خبرة عملية مرتبطة${field?` بـ ${field}`:' بالمسار المهني المذكور'}.`);
    else if(field)parts.push(`يركز الملف على مسار ${field}.`);
    const rawSummary=clean(data.summary);if(rawSummary&&!/^(?:خريج|طالب|خلصت|أكملت|مقدم|متقدم).*(?:ثان|بكالوريوس|ماجستير)/i.test(rawSummary)){const rewritten=formalizeFreeText(rawSummary,lang,field);if(rewritten&&!parts.some(p=>p.includes(sentence(rewritten))))parts.push(rewritten)}
    if(certificateCount)parts.push(`يتضمن الملف ${certificateCount} ${certificateCount===1?'شهادة أو إنجازًا موثقًا':'شهادة وإنجازًا موثقًا'} تم إدراج بياناتها ضمن السيرة.`);
    if(skills.length)parts.push(`وتشمل المهارات والمجالات المذكورة: ${skills.join('، ')}.`);
    if(experienceCount)parts.push(`كما يتضمن ${experienceCount} ${experienceCount===1?'خبرة أو مشروعًا أو نشاطًا':'عناصر من الخبرات والمشاريع والأنشطة'} أعيدت صياغتها بصورة مهنية.`);
    if(educationCount>1)parts.push('وقد جرى تنظيم المؤهلات التعليمية الواردة بحيث تظهر كل معلومة أكاديمية مرفقة بصورة واضحة ومباشرة.');
  }else{
    if(state.highSchoolGraduate&&state.bachelorApplicant)parts.push(`High school graduate preparing for university through an application to a Bachelor's program${field?` in ${field}`:''}.`);else if(state.highSchoolGraduate)parts.push(`High school graduate${field?` with an academic focus on ${field}`:''}.`);else if(state.highSchoolStudent)parts.push(`High school student preparing for university study${field?` in ${field}`:''}.`);else if(state.bachelorStudent)parts.push(`Bachelor's student${field?` in ${field}`:''}.`);else if(state.bachelorGraduate&&state.masterApplicant)parts.push(`Bachelor's graduate applying for Master's study${field?` in ${field}`:''}.`);else if(pState.years)parts.push(`Professional profile with ${pState.years} year${pState.years===1?'':'s'} of documented experience${field?` related to ${field}`:''}.`);else if(pState.employed||pState.experienced)parts.push(`Professional experience related${field?` to ${field}`:' to the stated career path'}.`);else if(field)parts.push(`Profile focused on ${field}.`);
    const rawSummary=clean(data.summary);if(rawSummary&&!/^(?:high school|secondary school|bachelor|master|student|graduate|applying)/i.test(rawSummary))parts.push(formalizeFreeText(rawSummary,lang,field));
    if(certificateCount)parts.push(`The CV includes ${certificateCount} documented certificate${certificateCount===1?' or achievement':'s and achievements'}, with the extracted details retained in the document.`);
    if(skills.length)parts.push(`Listed skills and subject areas include ${skills.join(', ')}.`);
    if(experienceCount)parts.push(`It also includes ${experienceCount} item${experienceCount===1?'':'s'} of experience, projects, or activities rewritten in formal CV language.`);
  }
  return uniq(parts).join(' ')
}

export function buildSemanticCv(data,{certificateCount=0,skills=[]}={}){
  const lang=data.lang==='ar'?'ar':'en',field=fieldName(data.role,lang),combined=[data.summary,data.education,data.experience,data.role].map(clean).join(' '),state=academicState(combined),pState=professionalState(combined);
  const normalizedSkills=normalizeSkills(skills,lang);
  let education=rawLines(data.education).map(x=>educationLine(x,lang,field)).filter(Boolean);
  if(!education.length&&(state.highSchoolGraduate||state.highSchoolStudent||state.bachelorApplicant||state.bachelorStudent||state.bachelorGraduate||state.masterApplicant||state.masterStudent||state.masterGraduate))education=[educationLine(combined,lang,field)];
  education=uniq(education);
  const experience=uniq(rawLines(data.experience).map(x=>experienceLine(x,lang,field)).filter(Boolean));
  return{headline:headline(data,lang,state,pState,field),summary:semanticSummary(data,lang,state,pState,field,{certificateCount,skills:normalizedSkills,educationCount:education.length,experienceCount:experience.length}),education,experience,skills:normalizedSkills,languages:formalLanguage(data.languages,lang),mode:(pState.employed||pState.experienced)&&!(state.highSchoolStudent||state.bachelorStudent||state.bachelorApplicant||state.masterApplicant)?'professional':'academic'}
}
