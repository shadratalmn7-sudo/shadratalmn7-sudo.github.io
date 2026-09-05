const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const rawLines=v=>String(v||'').split(/\n+/).map(clean).filter(Boolean);
const hasArabic=v=>/[\u0600-\u06ff]/.test(String(v||''));
const sentence=v=>clean(v).replace(/[.،,;؛:]+$/,'');
const uniq=a=>[...new Set(a.filter(Boolean))];

const fields=[
  {ar:'الأمن السيبراني',en:'Cybersecurity',re:/cyber|cybersecurity|information security|امن سيبر|أمن سيبر|الامن السيبر|الأمن السيبر|امن المعلومات|أمن المعلومات/i},
  {ar:'علوم الحاسب',en:'Computer Science',re:/computer science|علوم الحاسب|علوم الكمبيوتر/i},
  {ar:'البرمجة وتطوير البرمجيات',en:'Software Development',re:/programming|coding|software developer|software development|برمج|مطور برمج|تطوير برمج/i},
  {ar:'الذكاء الاصطناعي',en:'Artificial Intelligence',re:/artificial intelligence|machine learning|\bai\b|ذكاء اصطناعي|تعلم آلي/i},
  {ar:'علوم وتحليل البيانات',en:'Data Science and Analytics',re:/data science|data analysis|analytics|علوم البيانات|تحليل البيانات/i},
  {ar:'الشبكات',en:'Computer Networking',re:/network|networking|شبكات/i},
  {ar:'تقنية المعلومات',en:'Information Technology',re:/information technology|\bit\b|تقنية المعلومات|دعم فني|technical support/i},
  {ar:'إدارة الأعمال',en:'Business Administration',re:/business administration|business|ادارة اعمال|إدارة أعمال/i},
  {ar:'المحاسبة',en:'Accounting',re:/accounting|accountant|محاسب|محاسبة/i},
  {ar:'المبيعات',en:'Sales',re:/sales|salesman|sales representative|مبيعات|مندوب مبيعات/i},
  {ar:'خدمة العملاء',en:'Customer Service',re:/customer service|call center|خدمة العملاء|خدمة عملاء|كول سنتر/i},
  {ar:'الموارد البشرية',en:'Human Resources',re:/human resources|\bhr\b|موارد بشرية/i},
  {ar:'التسويق',en:'Marketing',re:/marketing|digital marketing|تسويق/i},
  {ar:'إدارة المشاريع',en:'Project Management',re:/project management|project manager|إدارة المشاريع|مدير مشروع/i},
  {ar:'التصميم',en:'Design',re:/graphic design|designer|ui\/ux|تصميم|مصمم/i},
  {ar:'الهندسة',en:'Engineering',re:/engineering|engineer|هندسه|هندسة|مهندس/i},
  {ar:'الطب والرعاية الصحية',en:'Healthcare',re:/medicine|medical|healthcare|nurse|doctor|طب|طبي|تمريض|ممرض|طبيب/i},
  {ar:'الأمن والحماية',en:'Security',re:/security guard|security officer|حارس امن|حارس أمن|موظف امن|موظف أمن/i},
  {ar:'التجزئة وخدمة نقاط البيع',en:'Retail and Point-of-Sale Operations',re:/cashier|retail|كاشير|امين صندوق|أمين صندوق|تجزئة/i}
];

export function fieldName(role,lang='en'){
  const r=clean(role);if(!r)return'';
  const found=fields.find(x=>x.re.test(r));if(found)return lang==='ar'?found.ar:found.en;
  if(lang==='ar')return hasArabic(r)?sentence(r):r;
  return hasArabic(r)?'the target professional field':sentence(r);
}

export function academicState(text=''){
  const t=clean(text);
  return{
    highSchoolGraduate:/خريج.{0,24}(ثان|ثانوية)|انتهيت.{0,18}(ثان|ثانوية)|خلصت.{0,18}(ثان|ثانوية)|اكملت.{0,18}(ثان|ثانوية)|أكملت.{0,18}(ثان|ثانوية)|completed.{0,24}high school|high school graduate|secondary school graduate/i.test(t),
    highSchoolStudent:/طالب.{0,24}(ثان|ثانوية)|high school student|secondary school student/i.test(t),
    bachelorApplicant:/اقدم.{0,24}بكالوريوس|أقدم.{0,24}بكالوريوس|مقدم.{0,24}بكالوريوس|متقدم.{0,24}بكالوريوس|بقدم.{0,24}بكالوريوس|applying.{0,30}bachelor|bachelor.?s applicant|seeking.{0,24}bachelor/i.test(t),
    bachelorStudent:/طالب.{0,24}بكالوريوس|ادرس.{0,24}بكالوريوس|أدرس.{0,24}بكالوريوس|bachelor.?s student|undergraduate student/i.test(t),
    bachelorGraduate:/خريج.{0,24}بكالوريوس|حاصل.{0,24}بكالوريوس|انهيت.{0,24}بكالوريوس|أنهيت.{0,24}بكالوريوس|bachelor.?s graduate|bachelor.?s degree holder|completed.{0,24}bachelor/i.test(t),
    masterApplicant:/اقدم.{0,24}ماجستير|أقدم.{0,24}ماجستير|متقدم.{0,24}ماجستير|applying.{0,30}master|master.?s applicant/i.test(t),
    masterStudent:/طالب.{0,24}ماجستير|ادرس.{0,24}ماجستير|أدرس.{0,24}ماجستير|master.?s student/i.test(t),
    masterGraduate:/خريج.{0,24}ماجستير|حاصل.{0,24}ماجستير|master.?s graduate|master.?s degree holder/i.test(t)
  }
}

export function professionalState(text=''){
  const t=clean(text);
  const years=(t.match(/(?:خبرة|خبرتي|اشتغلت|عملت|experience|worked)[^\d]{0,25}(\d{1,2})\s*(?:سنوات|سنة|عام|years?|yrs?)/i)||t.match(/(\d{1,2})\s*(?:سنوات|سنة|عام)\s*(?:خبرة|عمل)/i)||[])[1]||'';
  return{
    employed:/موظف|اعمل|أعمل|اشتغل|أشتغل|أعمل حاليا|أعمل حالي|currently work|currently employed|working as|employed as/i.test(t),
    jobSeeker:/ابحث عن عمل|أبحث عن عمل|ابحث عن وظيفة|أبحث عن وظيفة|باحث عن عمل|فرصة وظيفية|وظيفة جديدة|looking for (?:a )?job|seeking (?:a )?(?:job|role|position|opportunity)|open to work/i.test(t),
    experienced:/خبرة|خبرتي|اشتغلت|عملت|worked|experience|professional experience/i.test(t),
    internship:/تدريب تعاوني|متدرب|تدريب عملي|internship|intern\b|trainee/i.test(t),
    freelancer:/عمل حر|فريلانسر|مستقل|freelance|freelancer/i.test(t),
    careerChange:/تغيير مسار|تحويل مسار|انتقل إلى مجال|career change|transitioning to/i.test(t),
    years:Number(years||0)
  }
}

function extractGpa(text=''){
  const m=String(text).match(/(?:معدل|gpa|grade|score)\s*[:：-]?\s*(\d{1,3}(?:\.\d+)?\s*%?)/i)||String(text).match(/\b(\d{2,3}(?:\.\d+)\s*%)\b/);return m?.[1]?.replace(/\s/g,'')||'';
}
function extractYear(text=''){
  const years=[...String(text).matchAll(/\b(19\d{2}|20\d{2})\b/g)].map(m=>m[1]);return years.at(-1)||'';
}
function hasAcademicIntent(state){return state.bachelorApplicant||state.masterApplicant||state.highSchoolStudent||state.bachelorStudent||state.masterStudent}
function hasProfessionalIntent(state){return state.employed||state.jobSeeker||state.experienced||state.freelancer||state.internship||state.careerChange}

function structuredEducationLines(text=''){
  return rawLines(text).filter(line=>{
    if(/خريج|انتهيت|خلصت|اكملت|أكملت|اقدم|أقدم|مقدم|متقدم|طالب|ادرس|أدرس|graduate|applying|student|completed/i.test(line))return false;
    return /(?:school|university|college|academy|institute|مدرس|ثانوية|جامعة|كلية|أكاديمية|معهد)/i.test(line)&&(/[—–|-]/.test(line)||/\b(?:19|20)\d{2}\b/.test(line)||/\d+(?:\.\d+)?%/.test(line));
  }).slice(0,4);
}

function jobTitleFromText(text,field,lang){
  const t=clean(text);
  const patterns=[
    [/مدير مشروع|project manager/i,'مدير مشاريع','Project Manager'],
    [/محاسب|accountant/i,'محاسب','Accountant'],
    [/خدمة عملاء|customer service/i,'أخصائي خدمة عملاء','Customer Service Professional'],
    [/كاشير|امين صندوق|أمين صندوق|cashier/i,'أمين صندوق','Cashier'],
    [/مندوب مبيعات|sales representative/i,'مندوب مبيعات','Sales Representative'],
    [/موظف مبيعات|sales associate/i,'أخصائي مبيعات','Sales Professional'],
    [/دعم فني|technical support/i,'أخصائي دعم فني','Technical Support Specialist'],
    [/محلل بيانات|data analyst/i,'محلل بيانات','Data Analyst'],
    [/محلل امن|محلل أمن|security analyst/i,'محلل أمن سيبراني','Cybersecurity Analyst'],
    [/مطور|developer/i,'مطور برمجيات','Software Developer'],
    [/مصمم|designer/i,'مصمم','Designer'],
    [/مهندس|engineer/i,'مهندس','Engineer'],
    [/حارس امن|حارس أمن|security guard/i,'موظف أمن','Security Officer'],
    [/موارد بشرية|human resources|\bhr\b/i,'أخصائي موارد بشرية','Human Resources Professional'],
    [/تسويق|marketing/i,'أخصائي تسويق','Marketing Professional']
  ];
  for(const [re,ar,en] of patterns)if(re.test(t))return lang==='ar'?ar:en;
  if(field)return lang==='ar'?`متخصص في ${field}`:`${field} Professional`;
  return lang==='ar'?'محترف مهني':'Professional';
}

function headline(data,lang,aState,pState,field){
  const all=`${data.role||''} ${data.summary||''} ${data.experience||''}`;
  const professional=hasProfessionalIntent(pState)&&!hasAcademicIntent(aState);
  if(professional){
    const title=jobTitleFromText(all,field,lang);
    if(lang==='ar'){
      if(pState.jobSeeker&&pState.years)return `${title} بخبرة ${pState.years} سنوات | باحث عن فرصة جديدة`;
      if(pState.jobSeeker)return `${title} | باحث عن فرصة مهنية`;
      if(pState.freelancer)return `${title} | عمل حر ومشاريع مستقلة`;
      if(pState.internship)return `${title} | خبرة تدريبية وعملية`;
      if(pState.years)return `${title} | خبرة ${pState.years} سنوات`;
      return title;
    }
    if(pState.jobSeeker&&pState.years)return `${title} | ${pState.years} Years of Experience | Open to Opportunities`;
    if(pState.jobSeeker)return `${title} | Open to Opportunities`;
    if(pState.freelancer)return `${title} | Freelance & Project Experience`;
    if(pState.internship)return `${title} | Internship & Practical Experience`;
    if(pState.years)return `${title} | ${pState.years} Years of Experience`;
    return title;
  }
  if(lang==='ar'){
    if(aState.highSchoolGraduate&&aState.bachelorApplicant)return field?`خريج ثانوية ومتقدم لبرنامج بكالوريوس في ${field}`:'خريج ثانوية ومتقدم لبرنامج بكالوريوس';
    if(aState.highSchoolGraduate)return field?`خريج ثانوية يستهدف مواصلة الدراسة في ${field}`:'خريج ثانوية';
    if(aState.highSchoolStudent)return field?`طالب ثانوي يستهدف دراسة ${field}`:'طالب في المرحلة الثانوية';
    if(aState.bachelorStudent)return field?`طالب بكالوريوس في ${field}`:'طالب بكالوريوس';
    if(aState.bachelorGraduate&&aState.masterApplicant)return field?`خريج بكالوريوس ومتقدم لدراسة الماجستير في ${field}`:'خريج بكالوريوس ومتقدم لدراسة الماجستير';
    if(aState.bachelorGraduate&&hasProfessionalIntent(pState))return jobTitleFromText(all,field,lang);
    if(aState.bachelorGraduate)return field?`خريج بكالوريوس في ${field}`:'خريج بكالوريوس';
    if(aState.masterStudent)return field?`طالب ماجستير في ${field}`:'طالب ماجستير';
    return field||'ملف مهني وأكاديمي';
  }
  if(aState.highSchoolGraduate&&aState.bachelorApplicant)return field?`High School Graduate | Bachelor's Applicant in ${field}`:"High School Graduate | Bachelor's Applicant";
  if(aState.highSchoolGraduate)return field?`High School Graduate | Prospective ${field} Student`:'High School Graduate';
  if(aState.highSchoolStudent)return field?`High School Student | Aspiring ${field} Student`:'High School Student';
  if(aState.bachelorStudent)return field?`Bachelor's Student in ${field}`:"Bachelor's Student";
  if(aState.bachelorGraduate&&aState.masterApplicant)return field?`Bachelor's Graduate | Master's Applicant in ${field}`:"Bachelor's Graduate | Master's Applicant";
  if(aState.bachelorGraduate&&hasProfessionalIntent(pState))return jobTitleFromText(all,field,lang);
  if(aState.bachelorGraduate)return field?`Bachelor's Graduate | ${field}`:"Bachelor's Graduate";
  if(aState.masterStudent)return field?`Master's Student in ${field}`:"Master's Student";
  return field||'Professional and Academic Profile';
}

function education(data,lang,state,field){
  const text=clean(data.education),gpa=extractGpa(text),year=extractYear(text),out=structuredEducationLines(text);
  if(lang==='ar'){
    if(state.highSchoolGraduate)out.push(`المرحلة الثانوية — مكتملة${gpa?` بمعدل ${gpa}`:''}${year?`، ${year}`:''}.`);
    else if(state.highSchoolStudent)out.push(`المرحلة الثانوية — قيد الدراسة${gpa?`، المعدل الحالي ${gpa}`:''}.`);
    if(state.bachelorApplicant)out.push(`الهدف الأكاديمي: الالتحاق ببرنامج بكالوريوس${field?` في ${field}`:''}.`);
    else if(state.bachelorStudent)out.push(`درجة البكالوريوس${field?` في ${field}`:''} — قيد الدراسة.`);
    else if(state.bachelorGraduate)out.push(`درجة البكالوريوس — مكتملة${field?` في ${field}`:''}${year?`، ${year}`:''}.`);
    if(state.masterApplicant)out.push(`الهدف الأكاديمي: الالتحاق ببرنامج ماجستير${field?` في ${field}`:''}.`);
    else if(state.masterStudent)out.push(`درجة الماجستير${field?` في ${field}`:''} — قيد الدراسة.`);
    else if(state.masterGraduate)out.push(`درجة الماجستير — مكتملة${field?` في ${field}`:''}.`);
    if(!out.length&&text)out.push('مؤهل تعليمي يدعم المسار المهني والتطوير المستمر.');
  }else{
    if(state.highSchoolGraduate)out.push(`Secondary education — completed${gpa?` with a final grade of ${gpa}`:''}${year?` (${year})`:''}.`);
    else if(state.highSchoolStudent)out.push(`Secondary education — currently in progress${gpa?` with a current grade of ${gpa}`:''}.`);
    if(state.bachelorApplicant)out.push(`Academic objective: admission to a Bachelor's program${field?` in ${field}`:''}.`);
    else if(state.bachelorStudent)out.push(`Bachelor's degree${field?` in ${field}`:''} — currently in progress.`);
    else if(state.bachelorGraduate)out.push(`Bachelor's degree — completed${field?` in ${field}`:''}${year?` (${year})`:''}.`);
    if(state.masterApplicant)out.push(`Academic objective: admission to a Master's program${field?` in ${field}`:''}.`);
    else if(state.masterStudent)out.push(`Master's degree${field?` in ${field}`:''} — currently in progress.`);
    else if(state.masterGraduate)out.push(`Master's degree — completed${field?` in ${field}`:''}.`);
    if(!out.length&&text)out.push('Educational background supporting professional development and continued learning.');
  }
  return uniq(out).slice(0,6);
}

function professionalSummary(data,lang,pState,field,{certificateCount=0,skills=[]}={}){
  const all=`${data.role||''} ${data.summary||''} ${data.experience||''}`,title=jobTitleFromText(all,field,lang),listed=skills.filter(Boolean).slice(0,6);
  if(lang==='ar'){
    const parts=[];
    if(pState.years)parts.push(`${title} بخبرة عملية تمتد لنحو ${pState.years} سنوات، مع تركيز على تقديم أداء منظم وتطوير الكفاءة في المسؤوليات المرتبطة بالمجال.`);
    else if(pState.experienced||pState.employed)parts.push(`${title} يمتلك خبرة عملية مرتبطة بالمجال، ويعمل على تطوير الأداء المهني وبناء خبرة قابلة للقياس والتوثيق.`);
    else if(pState.jobSeeker)parts.push(`${title} يستهدف فرصة مهنية مناسبة تسمح بتوظيف خبراته ومهاراته الحالية وتطويرها ضمن بيئة عمل منظمة.`);
    else parts.push(`${title} يركز على بناء مسار مهني واضح وتطوير المهارات والخبرات المرتبطة بمجاله.`);
    if(listed.length)parts.push(`تشمل مجالات القوة المذكورة في الملف ${listed.join('، ')}، وقد تم عرضها بصيغة مهنية مرتبطة بالخبرة والهدف الوظيفي.`);
    if(certificateCount)parts.push('ويدعم الملف سجل من الشهادات والإنجازات الموثقة التي تعكس التعلم المستمر والتطوير المهني.');
    if(pState.jobSeeker)parts.push('يبحث عن فرصة يمكن من خلالها إضافة قيمة عملية، تحمل المسؤولية، والاستمرار في تطوير المهارات بصورة مهنية.');
    return parts.join(' ');
  }
  const parts=[];
  if(pState.years)parts.push(`${title} with approximately ${pState.years} years of practical experience, focused on reliable performance, continuous improvement, and responsibilities relevant to the field.`);
  else if(pState.experienced||pState.employed)parts.push(`${title} with practical experience relevant to the field and a focus on strengthening performance, professional capability, and measurable contribution.`);
  else if(pState.jobSeeker)parts.push(`${title} seeking a suitable professional opportunity to apply existing capabilities while continuing to develop within a structured work environment.`);
  else parts.push(`${title} focused on building a clear professional path and developing skills and experience relevant to the field.`);
  if(listed.length)parts.push(`Key strengths identified in the profile include ${listed.join(', ')}, presented in relation to professional responsibilities and career objectives.`);
  if(certificateCount)parts.push('The profile is also supported by documented certificates and achievements that demonstrate continued learning and professional development.');
  if(pState.jobSeeker)parts.push('Seeking an opportunity to contribute effectively, take ownership of responsibilities, and continue developing professionally.');
  return parts.join(' ');
}

function academicSummary(data,lang,state,field,{certificateCount=0,skills=[]}={}){
  const listed=skills.filter(Boolean).slice(0,5);
  if(lang==='ar'){
    const parts=[];
    if(state.highSchoolGraduate&&state.bachelorApplicant)parts.push(`خريج مرحلة ثانوية يستعد للانتقال إلى الدراسة الجامعية من خلال التقديم على برنامج بكالوريوس${field?` في ${field}`:''}.`);
    else if(state.highSchoolGraduate)parts.push(`خريج مرحلة ثانوية يعمل على بناء مسار أكاديمي منظم${field?` في ${field}`:''}.`);
    else if(state.highSchoolStudent)parts.push(`طالب في المرحلة الثانوية يركز على الاستعداد المبكر للدراسة الجامعية${field?` في ${field}`:''}.`);
    else if(state.bachelorStudent)parts.push(`طالب بكالوريوس يطوّر خلفيته الأكاديمية والتطبيقية${field?` في ${field}`:''}.`);
    else if(state.bachelorGraduate&&state.masterApplicant)parts.push(`خريج بكالوريوس يستعد للانتقال إلى مرحلة الدراسات العليا${field?` في ${field}`:''}.`);
    else parts.push(field?`صاحب ملف أكاديمي يركز على تطوير مساره في ${field}.`:'صاحب ملف أكاديمي يركز على بناء مسار دراسي منظم.');
    if(certificateCount)parts.push('يدعم هذا المسار سجل من الشهادات والإنجازات الموثقة التي تعكس الاستمرار في التعلم والتطوير.');
    if(listed.length)parts.push(`وتشمل مجالات التركيز المذكورة في الملف ${listed.join('، ')}، باعتبارها عناصر داعمة للهدف الأكاديمي.`);
    parts.push('يعرض الملف المعلومات القابلة للتوثيق بصيغة واضحة ومهنية مرتبطة بالمرحلة الدراسية القادمة.');
    return parts.join(' ');
  }
  const parts=[];
  if(state.highSchoolGraduate&&state.bachelorApplicant)parts.push(`High school graduate preparing for the transition to university through an application to a Bachelor's program${field?` in ${field}`:''}.`);
  else if(state.highSchoolGraduate)parts.push(`High school graduate building a focused academic pathway${field?` toward ${field}`:''}.`);
  else if(state.highSchoolStudent)parts.push(`High school student preparing early for university study${field?` in ${field}`:''}.`);
  else if(state.bachelorStudent)parts.push(`Bachelor's student developing academic and practical preparation${field?` in ${field}`:''}.`);
  else if(state.bachelorGraduate&&state.masterApplicant)parts.push(`Bachelor's graduate preparing for postgraduate study${field?` in ${field}`:''}.`);
  else parts.push(field?`Academic profile focused on continued development in ${field}.`:'Academic profile focused on structured educational development.');
  if(certificateCount)parts.push('This direction is supported by documented certificates and achievements that demonstrate continued learning and preparation.');
  if(listed.length)parts.push(`Key areas mentioned in the profile include ${listed.join(', ')}, presented as supporting evidence for the academic objective.`);
  parts.push('The profile presents verifiable information in a clear, professional format aligned with the next stage of study.');
  return parts.join(' ');
}

function formalExperience(line,lang,field){
  const x=sentence(line);if(!x)return'';
  const years=(x.match(/(\d{1,2})\s*(?:سنوات|سنة|عام|years?|yrs?)/i)||[])[1]||'';
  const company=(x.match(/(?:في|لدى|مع)\s+([^،,.]{2,60})/i)||x.match(/(?:at|for|with)\s+([^,.]{2,60})/i)||[])[1]?.trim()||'';
  if(lang==='ar'){
    if(/كاشير|امين صندوق|أمين صندوق/i.test(x))return `خبرة${years?` لمدة ${years} ${Number(years)===1?'سنة':'سنوات'}`:''} في أعمال نقاط البيع والتعامل مع المعاملات اليومية والعملاء${company?` لدى ${company}`:''}.`;
    if(/خدمة عملاء|كول سنتر/i.test(x))return `خبرة${years?` لمدة ${years} سنوات`:''} في خدمة العملاء، متابعة الاستفسارات، والتعامل المهني مع احتياجات العملاء${company?` لدى ${company}`:''}.`;
    if(/مبيعات|مندوب/i.test(x))return `خبرة${years?` لمدة ${years} سنوات`:''} في المبيعات والتواصل مع العملاء ودعم تحقيق الأهداف البيعية${company?` لدى ${company}`:''}.`;
    if(/دعم فني/i.test(x))return `خبرة${years?` لمدة ${years} سنوات`:''} في الدعم الفني وتشخيص المشكلات ومتابعة الحلول التقنية${company?` لدى ${company}`:''}.`;
    if(/مطور|برمج|developer|programming/i.test(x))return `خبرة عملية في تطوير البرمجيات والعمل على مهام ومشاريع تقنية${field?` مرتبطة بـ ${field}`:''}${company?` لدى ${company}`:''}.`;
    if(/تطوع|متطوع/i.test(x))return 'مشاركة تطوعية ساهمت في تنمية مهارات العمل الجماعي، تحمل المسؤولية، والتواصل ضمن بيئة عملية.';
    if(/مشروع|سويت|صممت|بنيت|طورت|أنشأت/i.test(x))return `تنفيذ مشروع عملي${field?` مرتبط بـ ${field}`:''} بهدف تطبيق المعرفة وتحويلها إلى مخرجات قابلة للاستخدام والتطوير.`;
    if(/اشتغلت|عملت|اعمل|أعمل|خبرة|موظف/i.test(x))return `خبرة عملية موثقة${field?` في مجال ${field}`:''}${company?` لدى ${company}`:''}، مع مسؤوليات مرتبطة بالتنفيذ اليومي والتعاون والالتزام بمتطلبات العمل.`;
    return `خبرة أو نشاط عملي مرتبط بـ ${field||'المسار المهني'}، تمت صياغته لإبراز القيمة المهنية للمعلومة المدخلة.`;
  }
  if(/cashier|point.?of.?sale|retail/i.test(x))return `Experience${years?` spanning ${years} year${Number(years)===1?'':'s'}`:''} in point-of-sale operations, daily transactions, and direct customer interaction${company?` at ${company}`:''}.`;
  if(/customer service|call center/i.test(x))return `Experience${years?` spanning ${years} years`:''} in customer service, inquiry handling, and professional communication with customers${company?` at ${company}`:''}.`;
  if(/sales|sales representative/i.test(x))return `Experience${years?` spanning ${years} years`:''} in sales, customer communication, and supporting commercial targets${company?` at ${company}`:''}.`;
  if(/technical support/i.test(x))return `Experience${years?` spanning ${years} years`:''} in technical support, issue diagnosis, and follow-up of technical solutions${company?` at ${company}`:''}.`;
  if(/developer|programming|software/i.test(x))return `Practical experience in software development and technical tasks or projects${field?` related to ${field}`:''}${company?` at ${company}`:''}.`;
  if(/volunteer/i.test(x))return 'Volunteer experience that strengthened teamwork, responsibility, and communication in a practical environment.';
  if(/project|built|created|developed|designed/i.test(x))return `Completed a practical project${field?` related to ${field}`:''}, applying available knowledge to produce a usable and improvable outcome.`;
  if(/worked|working|employed|experience/i.test(x))return `Documented practical experience${field?` in ${field}`:''}${company?` at ${company}`:''}, with responsibilities involving day-to-day execution, collaboration, and professional reliability.`;
  return `Practical experience or activity relevant to ${field||'the professional profile'}, rewritten to emphasize its professional value.`;
}

export function buildSemanticCv(data,{certificateCount=0,skills=[]}={}){
  const lang=data.lang==='ar'?'ar':'en';
  const combined=`${data.summary||''} ${data.education||''} ${data.experience||''} ${data.role||''}`;
  const aState=academicState(combined),pState=professionalState(combined),field=fieldName(data.role,lang);
  const professional=hasProfessionalIntent(pState)&&!hasAcademicIntent(aState);
  return{
    mode:professional?'professional':'academic',
    headline:headline(data,lang,aState,pState,field),
    summary:professional?professionalSummary(data,lang,pState,field,{certificateCount,skills}):academicSummary(data,lang,aState,field,{certificateCount,skills}),
    education:education(data,lang,aState,field),
    experience:rawLines(data.experience).map(x=>formalExperience(x,lang,field)).filter(Boolean)
  };
}
